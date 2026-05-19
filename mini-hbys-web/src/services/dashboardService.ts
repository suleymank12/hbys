import { apiClient } from "./apiClient";
import type {
  ApiResponse,
  DashboardStats,
  DoctorStat,
  RecentMedicalRecord,
  TodayAppointment,
} from "../types";

const unwrap = <T,>(res: ApiResponse<T>, fallback: string): T => {
  if (!res.success || res.data === undefined || res.data === null) {
    throw new Error(res.message || fallback);
  }
  return res.data;
};

export const dashboardService = {
  getStats: async (): Promise<DashboardStats> => {
    const { data } = await apiClient.get<ApiResponse<DashboardStats>>(
      "/dashboard/stats"
    );
    return unwrap(data, "İstatistikler alınamadı.");
  },
  getTodayAppointments: async (): Promise<TodayAppointment[]> => {
    const { data } = await apiClient.get<ApiResponse<TodayAppointment[]>>(
      "/dashboard/today-appointments"
    );
    return unwrap(data, "Bugünkü randevular alınamadı.");
  },
  getRecentMedicalRecords: async (limit = 5): Promise<RecentMedicalRecord[]> => {
    const { data } = await apiClient.get<ApiResponse<RecentMedicalRecord[]>>(
      "/dashboard/recent-medical-records",
      { params: { limit } }
    );
    return unwrap(data, "Son muayene kayıtları alınamadı.");
  },
  getDoctorStats: async (): Promise<DoctorStat[]> => {
    const { data } = await apiClient.get<ApiResponse<DoctorStat[]>>(
      "/dashboard/doctor-stats"
    );
    return unwrap(data, "Doktor istatistikleri alınamadı.");
  },
};
