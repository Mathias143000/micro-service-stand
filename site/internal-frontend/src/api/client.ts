import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { getStoredToken } from "./authStorage";

type UnauthorizedHandler = () => void;

let unauthorizedHandler: UnauthorizedHandler | null = null;

export function setUnauthorizedHandler(handler: UnauthorizedHandler | null): void {
  unauthorizedHandler = handler;
}

const apiClient = axios.create({
  // Default: use Vite proxy to backend (see vite.config.ts)
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "/api"
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getStoredToken();

  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (import.meta.env.DEV) {
    console.log("[API REQUEST]", {
      method: config.method,
      url: `${config.baseURL}${config.url}`,
      params: config.params,
      data: config.data,
      hasAuthorization: Boolean(config.headers?.Authorization)
    });
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV) {
      console.log("[API RESPONSE]", {
        status: response.status,
        url: `${response.config.baseURL}${response.config.url}`,
        data: response.data
      });
    }

    return response;
  },
  (error: AxiosError) => {
    if (import.meta.env.DEV) {
      console.error("[API ERROR]", {
        status: error.response?.status,
        url: error.config ? `${error.config.baseURL}${error.config.url}` : "unknown",
        data: error.response?.data
      });
    }

    if (error.response?.status === 401 && unauthorizedHandler) {
      unauthorizedHandler();
    }

    return Promise.reject(error);
  }
);

export default apiClient;
