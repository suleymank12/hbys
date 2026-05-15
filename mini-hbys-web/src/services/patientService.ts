import { apiClient } from "./apiClient";
import type {
  ApiResponse,
  CreatePatientDto,
  PagedResult,
  Patient,
  UpdatePatientDto,
} from "../types";

const unwrap = <T,>(res: ApiResponse<T>): T => {
  if (!res.success || res.data === undefined || res.data === null) {
    throw new Error(res.message || "İşlem başarısız.");
  }
  return res.data;
};

export interface PatientListParams {
  page?: number;
  pageSize?: number;
  search?: string;
}

export const patientService = {
  list: async (params: PatientListParams = {}): Promise<PagedResult<Patient>> => {
    const { page = 1, pageSize = 20, search } = params;
    const query: Record<string, string | number> = { page, pageSize };
    if (search && search.trim().length > 0) query.search = search.trim();
    const { data } = await apiClient.get<ApiResponse<PagedResult<Patient>>>(
      "/patients",
      { params: query }
    );
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
