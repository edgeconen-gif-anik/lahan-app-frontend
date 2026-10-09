import axios, {
  AxiosError,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from "axios";
import { getSession } from "next-auth/react";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/api-error";
import { logoutFromApp } from "@/lib/auth/logout";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const skipAuth =
      (config as InternalAxiosRequestConfig & { skipAuth?: boolean })
        .skipAuth || false;

    if (!skipAuth) {
      const session = await getSession();

      if (session?.accessToken) {
        config.headers.Authorization = `Bearer ${session.accessToken}`;
      }
    }

    return config;
  },
  (error) => Promise.reject(error),
);

type RetryableConfig = InternalAxiosRequestConfig & {
  skipAuth?: boolean;
  __retried?: boolean;
};

const RETRY_DELAY_MS = 1000;
const RETRYABLE_STATUSES = [502, 503, 504];

function isTransientFailure(error: AxiosError) {
  // No response means network failure or timeout (e.g. a cold-starting host).
  return !error.response || RETRYABLE_STATUSES.includes(error.response.status);
}

function describeFailure(error: AxiosError) {
  if (!error.response) {
    return error.code === "ECONNABORTED"
      ? "The server took too long to respond. Please try again."
      : "Cannot reach the server. Check your internet connection.";
  }

  const status = error.response.status;
  if (status === 403) {
    return getApiErrorMessage(
      error,
      "You don't have permission to view this data.",
    );
  }
  if (status >= 500) {
    return "Something went wrong on the server. Please try again shortly.";
  }

  return null;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const requestConfig = error.config as RetryableConfig | undefined;
    const skipAuth = requestConfig?.skipAuth || false;
    const isGet = requestConfig?.method?.toLowerCase() === "get";

    // Retry idempotent reads once when the failure looks temporary.
    if (
      requestConfig &&
      isGet &&
      !requestConfig.__retried &&
      !axios.isCancel(error) &&
      isTransientFailure(error)
    ) {
      requestConfig.__retried = true;
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      return api.request(requestConfig);
    }

    if (error.response?.status === 401 && !skipAuth) {
      await logoutFromApp("/login?reason=expired");
      return Promise.reject(error);
    }

    // Mutations report their own errors through their hooks' onError, so only
    // failed reads are surfaced here to avoid duplicate toasts.
    if (isGet && !skipAuth && typeof window !== "undefined") {
      const message = describeFailure(error);
      if (message) {
        toast.error(message, { id: "api-read-error" });
      }
    }

    return Promise.reject(error);
  },
);

interface RequestConfig extends AxiosRequestConfig {
  useAuth?: boolean;
}

export const apiPost = async (
  url: string,
  data?: unknown,
  config?: { useAuth?: boolean },
) => {
  const requestConfig: RequestConfig & { skipAuth?: boolean } = {
    ...config,
    skipAuth: config?.useAuth === false,
  };

  return api.post(url, data, requestConfig);
};

export const apiGet = async (url: string, config?: { useAuth?: boolean }) => {
  const requestConfig: RequestConfig & { skipAuth?: boolean } = {
    ...config,
    skipAuth: config?.useAuth === false,
  };

  return api.get(url, requestConfig);
};

export default api;
