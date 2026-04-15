using MiniHBYS.Core.DTOs;

namespace MiniHBYS.Core.Interfaces;

public interface IAppointmentService
{
    Task<ApiResponse<IEnumerable<AppointmentDto>>> GetAllAsync();
    Task<ApiResponse<AppointmentDto>> GetByIdAsync(int id);
    Task<ApiResponse<IEnumerable<AppointmentDto>>> GetByPatientIdAsync(int patientId);
    Task<ApiResponse<IEnumerable<AppointmentDto>>> GetByDoctorIdAsync(int doctorId);
    Task<ApiResponse<AppointmentDto>> CreateAsync(CreateAppointmentDto dto);
    Task<ApiResponse<AppointmentDto>> UpdateStatusAsync(int id, UpdateAppointmentStatusDto dto);
    Task<ApiResponse<bool>> DeleteAsync(int id);
}
