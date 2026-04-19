import axios from "axios";

const DEFAULT_API_BASE_URL = "http://localhost:8080";
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/+$/, "");

const apiRequest = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

apiRequest.interceptors.request.use((config) => {
  if (typeof window === "undefined") {
    return config;
  }

  try {
    const storedUser = window.localStorage.getItem("user");
    if (!storedUser) {
      return config;
    }

    const user = JSON.parse(storedUser);
    if (user?.token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${user.token}`;
    }
  } catch (error) {
    console.warn("Failed to restore auth token from localStorage", error);
  }

  return config;
});

export default apiRequest;
export { API_BASE_URL };
