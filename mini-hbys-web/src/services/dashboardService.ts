import { apiClient } from "./apiClient";
import type { ApiResponse, DashboardStats } from "../types";

export const dashboardService = {
  getStats: async (): Promise<DashboardStats> => {
    const { data } = await apiClient.get<ApiResponse<DashboardStats>>(
      "/dashboard/stats"
    );
    if (!data.success || !data.data) {
      throw new Error(data.message || "İstatistikler alınamadı.");
    }
    return data.data;
  },
};
