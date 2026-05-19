import { apiClient } from "./apiClient";
import type {
  ApiResponse,
  CreateMedicalRecordDto,
  MedicalRecord,
  PagedResult,
  UpdateMedicalRecordDto,
} from "../types";

const unwrap = <T,>(res: ApiResponse<T>): T => {
  if (!res.success || res.data === undefined || res.data === null) {
    throw new Error(res.message || "İşlem başarısız.");
  }
  return res.data;
};

export interface MedicalRecordListParams {
  page?: number;
  pageSize?: number;
}

const downloadBlob = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const extractFileName = (
  contentDisposition: string | undefined,
  fallback: string
): string => {
  if (!contentDisposition) return fallback;
  const utf8Match = /filename\*\s*=\s*UTF-8''([^;]+)/i.exec(contentDisposition);
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1].replace(/"/g, ""));
    } catch {
      /* ignore */
    }
  }
  const match = /filename\s*=\s*"?([^";]+)"?/i.exec(contentDisposition);
  return match?.[1]?.trim() || fallback;
};

export const medicalRecordService = {
  getAll: async (params: MedicalRecordListParams = {}): Promise<PagedResult<MedicalRecord>> => {
    const { page = 1, pageSize = 20 } = params;
    const { data } = await apiClient.get<ApiResponse<PagedResult<MedicalRecord>>>(
      "/medical-records",
      { params: { page, pageSize } }
    );
    return unwrap(data);
  },
  getByAppointmentId: async (
    appointmentId: number
  ): Promise<MedicalRecord | null> => {
    try {
      const { data } = await apiClient.get<ApiResponse<MedicalRecord>>(
        `/medical-records/appointment/${appointmentId}`,
        { validateStatus: (s) => s === 200 || s === 404 }
      );
      return data.success && data.data ? data.data : null;
    } catch {
      return null;
    }
  },
  getByPatientId: async (patientId: number): Promise<MedicalRecord[]> => {
    const { data } = await apiClient.get<ApiResponse<MedicalRecord[]>>(
      `/medical-records/patient/${patientId}`
    );
    return unwrap(data);
  },
  getByDoctor: async (doctorId: number): Promise<MedicalRecord[]> => {
    const { data } = await apiClient.get<ApiResponse<MedicalRecord[]>>(
      `/medical-records/doctor/${doctorId}`
    );
    return unwrap(data);
  },
  create: async (dto: CreateMedicalRecordDto): Promise<MedicalRecord> => {
    const { data } = await apiClient.post<ApiResponse<MedicalRecord>>(
      "/medical-records",
      dto
    );
    return unwrap(data);
  },
  update: async (
    id: number,
    dto: UpdateMedicalRecordDto
  ): Promise<MedicalRecord> => {
    const { data } = await apiClient.put<ApiResponse<MedicalRecord>>(
      `/medical-records/${id}`,
      dto
    );
    return unwrap(data);
  },
  downloadEpikrizPdf: async (id: number, fallbackName?: string): Promise<void> => {
    const response = await apiClient.get<Blob>(`/medical-records/${id}/epikriz`, {
      responseType: "blob",
    });
    const fileName = extractFileName(
      response.headers["content-disposition"] as string | undefined,
      fallbackName ?? `Epikriz_${id}.pdf`
    );
    downloadBlob(response.data, fileName);
  },
};
