import { apiClient } from "./apiClient";
import type {
  ApiResponse,
  CreateMedicalRecordDto,
  MedicalRecord,
  UpdateMedicalRecordDto,
} from "../types";

const unwrap = <T,>(res: ApiResponse<T>): T => {
  if (!res.success || res.data === undefined || res.data === null) {
    throw new Error(res.message || "İşlem başarısız.");
  }
  return res.data;
};

export const medicalRecordService = {
  getAll: async (): Promise<MedicalRecord[]> => {
    const { data } = await apiClient.get<ApiResponse<MedicalRecord[]>>(
      "/medical-records"
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
};
