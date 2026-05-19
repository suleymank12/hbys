import { apiClient } from "./apiClient";
import type {
  ApiResponse,
  Appointment,
  AppointmentStatus,
  CreateAppointmentDto,
  PagedResult,
  UpdateAppointmentStatusDto,
} from "../types";

const unwrap = <T,>(res: ApiResponse<T>): T => {
  if (!res.success || res.data === undefined || res.data === null) {
    throw new Error(res.message || "İşlem başarısız.");
  }
  return res.data;
};

export interface AppointmentListParams {
  page?: number;
  pageSize?: number;
}

export const appointmentService = {
  list: async (params: AppointmentListParams = {}): Promise<PagedResult<Appointment>> => {
    const { page = 1, pageSize = 20 } = params;
    const { data } = await apiClient.get<ApiResponse<PagedResult<Appointment>>>(
      "/appointments",
      { params: { page, pageSize } }
    );
    return unwrap(data);
  },
  listByDoctor: async (doctorId: number): Promise<Appointment[]> => {
    const { data } = await apiClient.get<ApiResponse<Appointment[]>>(
      `/appointments/doctor/${doctorId}`
    );
    return unwrap(data);
  },
  listByPatient: async (patientId: number): Promise<Appointment[]> => {
    const { data } = await apiClient.get<ApiResponse<Appointment[]>>(
      `/appointments/patient/${patientId}`
    );
    return unwrap(data);
  },
  create: async (dto: CreateAppointmentDto): Promise<Appointment> => {
    const { data } = await apiClient.post<ApiResponse<Appointment>>("/appointments", dto);
    return unwrap(data);
  },
  updateStatus: async (id: number, status: AppointmentStatus): Promise<Appointment> => {
    const { data } = await apiClient.put<ApiResponse<Appointment>>(
      `/appointments/${id}/status`,
      { status } as UpdateAppointmentStatusDto
    );
    return unwrap(data);
  },
  cancel: async (id: number): Promise<void> => {
    await apiClient.delete<ApiResponse<boolean>>(`/appointments/${id}/cancel`);
  },
};
