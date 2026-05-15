import { apiClient } from "./apiClient";
import type { ApiResponse, Icd10Code } from "../types";

const unwrap = <T,>(res: ApiResponse<T>): T => {
  if (!res.success || res.data === undefined || res.data === null) {
    throw new Error(res.message || "İşlem başarısız.");
  }
  return res.data;
};

export const icd10Service = {
  search: async (term: string): Promise<Icd10Code[]> => {
    const { data } = await apiClient.get<ApiResponse<Icd10Code[]>>("/icd10", {
      params: term ? { search: term } : undefined,
    });
    return unwrap(data);
  },
};
