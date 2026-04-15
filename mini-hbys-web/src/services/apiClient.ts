import axios, { AxiosError } from "axios";
import toast from "react-hot-toast";
import type { ApiResponse } from "../types";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5273/api",
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiResponse<unknown>>) => {
    const data = error.response?.data;
    const message = data?.message || error.message || "Bir hata oluştu.";

    if (data?.errors && data.errors.length > 0) {
      data.errors.forEach((err) => toast.error(err));
    } else {
      toast.error(message);
    }
    return Promise.reject(error);
  }
);
