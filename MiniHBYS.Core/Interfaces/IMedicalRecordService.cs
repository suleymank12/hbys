using MiniHBYS.Core.DTOs;

namespace MiniHBYS.Core.Interfaces;

public interface IMedicalRecordService
{
    Task<ApiResponse<IEnumerable<MedicalRecordDto>>> GetAllAsync();
    // Already declared above; kept for visibility.
    Task<ApiResponse<MedicalRecordDto>> GetByIdAsync(int id);
    Task<ApiResponse<MedicalRecordDto>> GetByAppointmentIdAsync(int appointmentId);
    Task<ApiResponse<IEnumerable<MedicalRecordDto>>> GetByPatientIdAsync(int patientId);
    Task<ApiResponse<IEnumerable<MedicalRecordDto>>> GetByDoctorIdAsync(int doctorId);
    Task<ApiResponse<MedicalRecordDto>> CreateAsync(CreateMedicalRecordDto dto);
    Task<ApiResponse<MedicalRecordDto>> UpdateAsync(int id, UpdateMedicalRecordDto dto);
    Task<ApiResponse<bool>> DeleteAsync(int id);
}
