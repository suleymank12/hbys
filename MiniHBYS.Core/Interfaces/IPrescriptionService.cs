using MiniHBYS.Core.DTOs;

namespace MiniHBYS.Core.Interfaces;

public interface IPrescriptionService
{
    Task<ApiResponse<PrescriptionDto>> GetByMedicalRecordIdAsync(int medicalRecordId);
    Task<ApiResponse<IEnumerable<PrescriptionDto>>> GetByPatientIdAsync(int patientId);
    Task<ApiResponse<IEnumerable<PrescriptionDto>>> GetByDoctorIdAsync(int doctorId);
    Task<ApiResponse<PrescriptionDto>> CreateAsync(CreatePrescriptionDto dto, int doctorId);
    Task<ApiResponse<PrescriptionDto>> UpdateAsync(int id, UpdatePrescriptionDto dto, int doctorId);
}
