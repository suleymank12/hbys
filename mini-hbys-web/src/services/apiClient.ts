import axios, { AxiosError } from "axios";
import toast from "react-hot-toast";
import type { ApiResponse } from "../types";
import { TOKEN_STORAGE_KEY, USER_STORAGE_KEY } from "./authService.constants";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5273/api",
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiResponse<unknown>>) => {
    const status = error.response?.status;
    const data = error.response?.data;
    const message = data?.message || error.message || "Bir hata oluştu.";

    if (status === 401 && window.location.pathname !== "/login") {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(USER_STORAGE_KEY);
      toast.error("Oturum süresi doldu. Lütfen tekrar giriş yapın.");
      window.location.href = "/login";
      return Promise.reject(error);
    }

    if (status === 403) {
      toast.error("Bu işlem için yetkiniz yok.");
      return Promise.reject(error);
    }

    if (data?.errors && data.errors.length > 0) {
      data.errors.forEach((err) => toast.error(err));
    } else if (status !== 401) {
      toast.error(message);
    }
    return Promise.reject(error);
  }
);
