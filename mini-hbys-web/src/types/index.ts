export const AppointmentStatus = {
  Bekliyor: 0,
  Geldi: 1,
  MuayenedeAlindi: 2,
  Tamamlandi: 3,
  IptalEdildi: 4,
  Gelmedi: 5,
} as const;

export type AppointmentStatus = (typeof AppointmentStatus)[keyof typeof AppointmentStatus];

export const UserRole = {
  Admin: 0,
  Doktor: 1,
  Sekreter: 2,
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export type UserRoleName = "Admin" | "Doktor" | "Sekreter";

export interface ApiResponse<T> {
  success: boolean;
  message?: string | null;
  data?: T | null;
  errors?: string[] | null;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface LoginResponse {
  id: number;
  token: string;
  email: string;
  name: string;
  role: UserRole;
  roleText: string;
  doctorId?: number | null;
  expiresAt: string;
}

export interface CurrentUser {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  roleText: string;
  doctorId?: number | null;
}

export const Gender = {
  Erkek: 0,
  Kadın: 1,
  Belirtilmemiş: 2,
} as const;
export type Gender = (typeof Gender)[keyof typeof Gender];

export const BloodType = {
  ARhPositive: 0,
  ARhNegative: 1,
  BRhPositive: 2,
  BRhNegative: 3,
  ABRhPositive: 4,
  ABRhNegative: 5,
  ORhPositive: 6,
  ORhNegative: 7,
} as const;
export type BloodType = (typeof BloodType)[keyof typeof BloodType];

export const InsuranceType = {
  SGK: 0,
  Ozel: 1,
  Yabanci: 2,
  Yok: 3,
} as const;
export type InsuranceType = (typeof InsuranceType)[keyof typeof InsuranceType];

export interface Patient {
  id: number;
  protocolNumber: string;
  name: string;
  surname: string;
  fullName: string;
  nationalId: string;
  birthDate: string;
  gender: Gender;
  genderText: string;
  bloodType?: BloodType | null;
  bloodTypeText?: string | null;
  insuranceType: InsuranceType;
  insuranceTypeText: string;
  phone: string;
  email?: string | null;
  city?: string | null;
  district?: string | null;
  address?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  allergies?: string | null;
  chronicDiseases?: string | null;
  createdAt: string;
}

export interface CreatePatientDto {
  name: string;
  surname: string;
  nationalId: string;
  birthDate: string;
  gender: Gender;
  bloodType?: BloodType | null;
  insuranceType: InsuranceType;
  phone: string;
  email?: string | null;
  city?: string | null;
  district?: string | null;
  address?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  allergies?: string | null;
  chronicDiseases?: string | null;
}

export interface UpdatePatientDto {
  name: string;
  surname: string;
  birthDate: string;
  gender: Gender;
  bloodType?: BloodType | null;
  insuranceType: InsuranceType;
  phone: string;
  email?: string | null;
  city?: string | null;
  district?: string | null;
  address?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  allergies?: string | null;
  chronicDiseases?: string | null;
}

export interface Doctor {
  id: number;
  name: string;
  branch: string;
  email: string;
  createdAt: string;
}

export interface CreateDoctorDto {
  name: string;
  branch: string;
  email: string;
  password: string;
}

export interface UpdateDoctorDto {
  name: string;
  branch: string;
  email: string;
}

export interface Appointment {
  id: number;
  patientId: number;
  doctorId: number;
  patientFullName: string;
  doctorName: string;
  doctorBranch: string;
  dateTime: string;
  status: AppointmentStatus;
  statusText: string;
  createdAt: string;
}

export interface CreateAppointmentDto {
  patientId: number;
  doctorId: number;
  dateTime: string;
}

export interface UpdateAppointmentStatusDto {
  status: AppointmentStatus;
}

export interface PrescriptionItem {
  id?: number;
  medicationName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string | null;
}

export interface Prescription {
  id: number;
  medicalRecordId: number;
  prescriptionNumber: string;
  prescribedAt: string;
  patientFullName: string;
  doctorName: string;
  doctorBranch: string;
  createdAt: string;
  items: PrescriptionItem[];
}

export interface CreatePrescriptionItemDto {
  medicationName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string | null;
}

export interface CreatePrescriptionDto {
  medicalRecordId: number;
  items: CreatePrescriptionItemDto[];
}

export interface UpdatePrescriptionDto {
  items: CreatePrescriptionItemDto[];
}

export interface Icd10Code {
  code: string;
  nameTr: string;
  nameEn?: string | null;
  category: string;
}

export interface VitalSigns {
  bloodPressureSystolic?: number | null;
  bloodPressureDiastolic?: number | null;
  pulse?: number | null;
  temperature?: number | null;
  respiratoryRate?: number | null;
  oxygenSaturation?: number | null;
  height?: number | null;
  weight?: number | null;
}

export interface MedicalRecord {
  id: number;
  appointmentId: number;
  patientFullName: string;
  doctorName: string;
  doctorBranch: string;
  appointmentDate: string;
  chiefComplaint: string;
  history?: string | null;
  examination?: string | null;
  diagnosis: string;
  diagnosisCode?: string | null;
  treatmentPlan?: string | null;
  notes?: string | null;
  vitalSigns?: VitalSigns | null;
  prescription?: Prescription | null;
  createdAt: string;
}

export interface CreateMedicalRecordDto {
  appointmentId: number;
  chiefComplaint: string;
  history?: string | null;
  examination?: string | null;
  diagnosis: string;
  diagnosisCode?: string | null;
  treatmentPlan?: string | null;
  notes?: string | null;
  vitalSigns?: VitalSigns | null;
}

export interface UpdateMedicalRecordDto {
  chiefComplaint: string;
  history?: string | null;
  examination?: string | null;
  diagnosis: string;
  diagnosisCode?: string | null;
  treatmentPlan?: string | null;
  notes?: string | null;
  vitalSigns?: VitalSigns | null;
}

export interface BranchStat {
  branch: string;
  doctorCount: number;
  appointmentCount: number;
}

export interface DashboardStats {
  totalPatients: number;
  totalDoctors: number;
  todayAppointments: number;
  pendingAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  branchStats: BranchStat[];
}
