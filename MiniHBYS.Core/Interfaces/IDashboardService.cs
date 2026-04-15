using MiniHBYS.Core.DTOs;

namespace MiniHBYS.Core.Interfaces;

public interface IDashboardService
{
    Task<ApiResponse<DashboardStatsDto>> GetStatsAsync();
}
