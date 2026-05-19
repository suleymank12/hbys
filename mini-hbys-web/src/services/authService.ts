import { apiClient } from "./apiClient";
import {
  TOKEN_STORAGE_KEY,
  USER_STORAGE_KEY,
} from "./authService.constants";
import type {
  ApiResponse,
  ChangePasswordDto,
  CurrentUser,
  LoginDto,
  LoginResponse,
} from "../types";

export { TOKEN_STORAGE_KEY, USER_STORAGE_KEY };

const unwrap = <T,>(res: ApiResponse<T>): T => {
  if (!res.success || res.data === undefined || res.data === null) {
    throw new Error(res.message || "İşlem başarısız.");
  }
  return res.data;
};

export const authService = {
  login: async (dto: LoginDto): Promise<LoginResponse> => {
    const { data } = await apiClient.post<ApiResponse<LoginResponse>>(
      "/auth/login",
      dto
    );
    return unwrap(data);
  },
  me: async (): Promise<CurrentUser> => {
    const { data } = await apiClient.get<ApiResponse<CurrentUser>>("/auth/me");
    return unwrap(data);
  },
  changePassword: async (dto: ChangePasswordDto): Promise<void> => {
    const { data } = await apiClient.put<ApiResponse<boolean>>(
      "/auth/change-password",
      dto
    );
    if (!data.success) {
      throw new Error(data.message || "Şifre değiştirilemedi.");
    }
  },
  logout: () => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
  },
  getStoredToken: (): string | null => localStorage.getItem(TOKEN_STORAGE_KEY),
  getStoredUser: (): CurrentUser | null => {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as CurrentUser;
    } catch {
      return null;
    }
  },
  storeSession: (token: string, user: CurrentUser) => {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  },
};
