import { apiClient } from "./apiClient";
import type {
  ApiResponse,
  CreateDoctorDto,
  Doctor,
  UpdateDoctorDto,
} from "../types";

const unwrap = <T,>(res: ApiResponse<T>): T => {
  if (!res.success || res.data === undefined || res.data === null) {
    throw new Error(res.message || "İşlem başarısız.");
  }
  return res.data;
};

export const doctorService = {
  list: async (): Promise<Doctor[]> => {
    const { data } = await apiClient.get<ApiResponse<Doctor[]>>("/doctors");
    return unwrap(data);
  },
  listByBranch: async (branch: string): Promise<Doctor[]> => {
    const { data } = await apiClient.get<ApiResponse<Doctor[]>>(
      `/doctors/branch/${encodeURIComponent(branch)}`
    );
    return unwrap(data);
  },
  create: async (dto: CreateDoctorDto): Promise<Doctor> => {
    const { data } = await apiClient.post<ApiResponse<Doctor>>("/doctors", dto);
    return unwrap(data);
  },
  update: async (id: number, dto: UpdateDoctorDto): Promise<Doctor> => {
    const { data } = await apiClient.put<ApiResponse<Doctor>>(`/doctors/${id}`, dto);
    return unwrap(data);
  },
  remove: async (id: number): Promise<void> => {
    await apiClient.delete<ApiResponse<boolean>>(`/doctors/${id}`);
  },
};
