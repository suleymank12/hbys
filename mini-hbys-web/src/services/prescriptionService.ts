import { apiClient } from "./apiClient";
import type {
  ApiResponse,
  CreatePrescriptionDto,
  Prescription,
  UpdatePrescriptionDto,
} from "../types";

const unwrap = <T,>(res: ApiResponse<T>): T => {
  if (!res.success || res.data === undefined || res.data === null) {
    throw new Error(res.message || "İşlem başarısız.");
  }
  return res.data;
};

export const prescriptionService = {
  getByMedicalRecord: async (medicalRecordId: number): Promise<Prescription | null> => {
    try {
      const { data } = await apiClient.get<ApiResponse<Prescription>>(
        `/prescriptions/medical-record/${medicalRecordId}`,
        { validateStatus: (s) => s === 200 || s === 404 }
      );
      return data.success && data.data ? data.data : null;
    } catch {
      return null;
    }
  },
  getByPatient: async (patientId: number): Promise<Prescription[]> => {
    const { data } = await apiClient.get<ApiResponse<Prescription[]>>(
      `/prescriptions/patient/${patientId}`
    );
    return unwrap(data);
  },
  getByDoctor: async (doctorId: number): Promise<Prescription[]> => {
    const { data } = await apiClient.get<ApiResponse<Prescription[]>>(
      `/prescriptions/doctor/${doctorId}`
    );
    return unwrap(data);
  },
  create: async (dto: CreatePrescriptionDto): Promise<Prescription> => {
    const { data } = await apiClient.post<ApiResponse<Prescription>>(
      "/prescriptions",
      dto
    );
    return unwrap(data);
  },
  update: async (id: number, dto: UpdatePrescriptionDto): Promise<Prescription> => {
    const { data } = await apiClient.put<ApiResponse<Prescription>>(
      `/prescriptions/${id}`,
      dto
    );
    return unwrap(data);
  },
};
