import axios, {
  AxiosError,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from "axios";
import { getSession, signOut } from "next-auth/react";

let signOutInProgress = false;

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const skipAuth = (config as InternalAxiosRequestConfig & { skipAuth?: boolean })
      .skipAuth || false;

    if (!skipAuth) {
      const session = await getSession();

      if (session?.accessToken) {
        config.headers.Authorization = `Bearer ${session.accessToken}`;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const requestConfig = error.config as
      | (InternalAxiosRequestConfig & { skipAuth?: boolean })
      | undefined;
    const skipAuth = requestConfig?.skipAuth || false;

    if (error.response?.status === 401 && !skipAuth) {
      console.error("Unauthorized: token may be expired or invalid");

      if (!signOutInProgress) {
        signOutInProgress = true;

        try {
          await signOut({ callbackUrl: "/login" });
        } finally {
          signOutInProgress = false;
        }
      }
    }

    if (error.response?.status === 403) {
      console.error("Forbidden: you don't have permission for this action");
    }

    if (error.response?.status === 409) {
      console.error("Conflict: resource already exists");
    }

    if (error.response?.status && error.response.status >= 500) {
      console.error("Server error: please try again later");
    }

    if (error.code === "ECONNREFUSED") {
      console.error("Connection refused: backend server may be down");
      console.error("Make sure NestJS is running on port 5000");
    }

    return Promise.reject(error);
  }
);

interface RequestConfig extends AxiosRequestConfig {
  useAuth?: boolean;
}

export const apiPost = async (
  url: string,
  data?: unknown,
  config?: { useAuth?: boolean }
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
