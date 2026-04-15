import { apiClient } from "./apiClient";
import type {
  ApiResponse,
  CreatePatientDto,
  Patient,
  UpdatePatientDto,
} from "../types";

const unwrap = <T,>(res: ApiResponse<T>): T => {
  if (!res.success || res.data === undefined || res.data === null) {
    throw new Error(res.message || "İşlem başarısız.");
  }
  return res.data;
};

export const patientService = {
  list: async (): Promise<Patient[]> => {
    const { data } = await apiClient.get<ApiResponse<Patient[]>>("/patients");
    return unwrap(data);
  },
  create: async (dto: CreatePatientDto): Promise<Patient> => {
    const { data } = await apiClient.post<ApiResponse<Patient>>("/patients", dto);
    return unwrap(data);
  },
  update: async (id: number, dto: UpdatePatientDto): Promise<Patient> => {
    const { data } = await apiClient.put<ApiResponse<Patient>>(`/patients/${id}`, dto);
    return unwrap(data);
  },
  remove: async (id: number): Promise<void> => {
    await apiClient.delete<ApiResponse<boolean>>(`/patients/${id}`);
  },
};
