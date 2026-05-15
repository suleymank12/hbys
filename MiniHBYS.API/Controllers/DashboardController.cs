using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MiniHBYS.Core.DTOs;
using MiniHBYS.Core.Interfaces;

namespace MiniHBYS.API.Controllers;

[ApiController]
[Route("api/dashboard")]
[Produces("application/json")]
[Tags("Dashboard")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly IDashboardService _service;

    public DashboardController(IDashboardService service)
    {
        _service = service;
    }

    /// <summary>Genel sistem istatistiklerini (hasta/doktor/randevu/branş) döner.</summary>
    /// <remarks>
    /// Örnek yanıt:
    ///
    ///     {
    ///       "success": true,
    ///       "data": {
    ///         "totalPatients": 124,
    ///         "totalDoctors": 18,
    ///         "todayAppointments": 9,
    ///         "pendingAppointments": 32,
    ///         "completedAppointments": 201,
    ///         "cancelledAppointments": 14,
    ///         "branchStats": [
    ///           { "branch": "Kardiyoloji", "doctorCount": 3, "appointmentCount": 42 },
    ///           { "branch": "Dahiliye",    "doctorCount": 4, "appointmentCount": 58 }
    ///         ]
    ///       }
    ///     }
    /// </remarks>
    [HttpGet("stats")]
    [ProducesResponseType(typeof(ApiResponse<DashboardStatsDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetStats() => Ok(await _service.GetStatsAsync());
}
