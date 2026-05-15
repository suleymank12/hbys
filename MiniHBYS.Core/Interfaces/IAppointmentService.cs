using MiniHBYS.Core.DTOs;
using MiniHBYS.Core.Enums;

namespace MiniHBYS.Core.Interfaces;

public interface IAppointmentService
{
    Task<ApiResponse<PagedResult<AppointmentDto>>> GetAllAsync(int page = 1, int pageSize = 20);
    Task<ApiResponse<AppointmentDto>> GetByIdAsync(int id);
    Task<ApiResponse<IEnumerable<AppointmentDto>>> GetByPatientIdAsync(int patientId);
    Task<ApiResponse<IEnumerable<AppointmentDto>>> GetByDoctorIdAsync(int doctorId);
    Task<ApiResponse<AppointmentDto>> CreateAsync(CreateAppointmentDto dto);
    Task<ApiResponse<AppointmentDto>> UpdateStatusAsync(int id, UpdateAppointmentStatusDto dto, UserRole role);
    Task<ApiResponse<bool>> DeleteAsync(int id);
}
