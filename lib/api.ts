//D:\Lahan Project APP\client\lib\api.ts
import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { getSession, signOut } from "next-auth/react";

// 1. Create the Axios Instance
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000, // 10 seconds timeout
});

// 2. Request Interceptor: Attaches the Token
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Check if this request should skip authentication
    const skipAuth = (config as any).skipAuth || false;
    
    if (!skipAuth) {
      // In Next.js Client Components, we use getSession to retrieve the token
      const session = await getSession();

      // Attach token if available
      if (session?.accessToken) {
        config.headers.Authorization = `Bearer ${session.accessToken}`;
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 3. Response Interceptor: Handles Global Errors
api.interceptors.response.use(
  (response) => response, // Return success responses directly
  async (error: AxiosError) => {
    // Handle 401 Unauthorized (Token expired or invalid)
    if (error.response?.status === 401) {
      console.error("⚠️ Unauthorized: Token may be expired or invalid");
      
      // Optional: Automatically sign out user
      // await signOut({ callbackUrl: "/login" });
    }

    // Handle 403 Forbidden (Role mismatch)
    if (error.response?.status === 403) {
      console.error("⚠️ Forbidden: You don't have permission for this action");
    }

    // Handle 409 Conflict (e.g., duplicate email)
    if (error.response?.status === 409) {
      console.error("⚠️ Conflict: Resource already exists");
    }

    // Handle 500 Server Errors
    if (error.response?.status && error.response.status >= 500) {
      console.error("⚠️ Server error: Please try again later");
    }

    // Handle network errors
    if (error.code === 'ECONNREFUSED') {
      console.error("⚠️ Connection refused: Backend server may be down");
      console.error("   Make sure NestJS is running on port 5000");
    }

    return Promise.reject(error);
  }
);

// 4. Helper function for requests that don't need auth
interface RequestConfig extends InternalAxiosRequestConfig {
  useAuth?: boolean;
}

export const apiPost = async (url: string, data?: any, config?: { useAuth?: boolean }) => {
  const requestConfig: any = {
    ...config,
    skipAuth: config?.useAuth === false,
  };
  
  return api.post(url, data, requestConfig);
};

export const apiGet = async (url: string, config?: { useAuth?: boolean }) => {
  const requestConfig: any = {
    ...config,
    skipAuth: config?.useAuth === false,
  };
  
  return api.get(url, requestConfig);
};

export default api;