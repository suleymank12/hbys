export const AppointmentStatus = {
  Bekliyor: 0,
  Tamamlandi: 1,
  IptalEdildi: 2,
} as const;

export type AppointmentStatus = (typeof AppointmentStatus)[keyof typeof AppointmentStatus];

export interface ApiResponse<T> {
  success: boolean;
  message?: string | null;
  data?: T | null;
  errors?: string[] | null;
}

export interface Patient {
  id: number;
  name: string;
  surname: string;
  fullName: string;
  nationalId: string;
  birthDate: string;
  phone: string;
  email?: string | null;
  createdAt: string;
}

export interface CreatePatientDto {
  name: string;
  surname: string;
  nationalId: string;
  birthDate: string;
  phone: string;
  email?: string | null;
}

export interface UpdatePatientDto {
  name: string;
  surname: string;
  birthDate: string;
  phone: string;
  email?: string | null;
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

export interface MedicalRecord {
  id: number;
  appointmentId: number;
  patientFullName: string;
  doctorName: string;
  doctorBranch: string;
  appointmentDate: string;
  diagnosis: string;
  notes?: string | null;
  createdAt: string;
}

export interface CreateMedicalRecordDto {
  appointmentId: number;
  diagnosis: string;
  notes?: string | null;
}

export interface UpdateMedicalRecordDto {
  diagnosis: string;
  notes?: string | null;
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
