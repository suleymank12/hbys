using MiniHBYS.Core.DTOs;

namespace MiniHBYS.Core.Interfaces;

public interface IMedicalRecordService
{
    Task<ApiResponse<PagedResult<MedicalRecordDto>>> GetAllAsync(int page = 1, int pageSize = 20);
    Task<ApiResponse<MedicalRecordDto>> GetByIdAsync(int id);
    Task<ApiResponse<MedicalRecordDto>> GetByAppointmentIdAsync(int appointmentId);
    Task<ApiResponse<IEnumerable<MedicalRecordDto>>> GetByPatientIdAsync(int patientId);
    Task<ApiResponse<IEnumerable<MedicalRecordDto>>> GetByDoctorIdAsync(int doctorId);
    Task<ApiResponse<MedicalRecordDto>> CreateAsync(CreateMedicalRecordDto dto, int doctorId);
    Task<ApiResponse<MedicalRecordDto>> UpdateAsync(int id, UpdateMedicalRecordDto dto, int doctorId);
    Task<ApiResponse<bool>> DeleteAsync(int id);
    Task<ApiResponse<EpikrizFileDto>> GenerateEpikrizPdfAsync(int id);
}
