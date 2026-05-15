import { apiClient } from "./apiClient";
import type { ApiResponse, AuditLog } from "../types";

const unwrap = <T,>(res: ApiResponse<T>): T => {
  if (!res.success || res.data === undefined || res.data === null) {
    throw new Error(res.message || "İşlem başarısız.");
  }
  return res.data;
};

export const auditService = {
  recent: async (limit = 100): Promise<AuditLog[]> => {
    const { data } = await apiClient.get<ApiResponse<AuditLog[]>>("/audit/recent", {
      params: { limit },
    });
    return unwrap(data);
  },
  byEntity: async (entityType: string, entityId: number): Promise<AuditLog[]> => {
    const { data } = await apiClient.get<ApiResponse<AuditLog[]>>(
      `/audit/entity/${entityType}/${entityId}`
    );
    return unwrap(data);
  },
  byUser: async (userId: number, from?: string, to?: string): Promise<AuditLog[]> => {
    const { data } = await apiClient.get<ApiResponse<AuditLog[]>>(`/audit/user/${userId}`, {
      params: { from, to },
    });
    return unwrap(data);
  },
};
