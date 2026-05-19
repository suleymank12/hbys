using MiniHBYS.Core.DTOs;

namespace MiniHBYS.Core.Interfaces;

public interface IDashboardService
{
    Task<ApiResponse<DashboardStatsDto>> GetStatsAsync();
    Task<ApiResponse<IEnumerable<TodayAppointmentDto>>> GetTodayAppointmentsAsync();
    Task<ApiResponse<IEnumerable<RecentMedicalRecordDto>>> GetRecentMedicalRecordsAsync(int limit = 5);
    Task<ApiResponse<IEnumerable<DoctorStatDto>>> GetDoctorStatsAsync();
}
