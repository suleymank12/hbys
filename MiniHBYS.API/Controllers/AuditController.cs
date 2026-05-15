using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MiniHBYS.Core.DTOs;
using MiniHBYS.Core.Interfaces;

namespace MiniHBYS.API.Controllers;

[ApiController]
[Route("api/audit")]
[Produces("application/json")]
[Tags("Audit")]
[Authorize(Roles = "Admin")]
public class AuditController : ControllerBase
{
    private readonly IAuditService _service;

    public AuditController(IAuditService service)
    {
        _service = service;
    }

    /// <summary>Belirli bir kaydın tüm denetim geçmişini döner.</summary>
    [HttpGet("entity/{type}/{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<AuditLogDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetByEntity(string type, int id) =>
        Ok(await _service.GetByEntityAsync(type, id));

    /// <summary>Bir kullanıcının yaptığı işlemleri döner.</summary>
    [HttpGet("user/{userId:int}")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<AuditLogDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetByUser(int userId, [FromQuery] DateTime? from, [FromQuery] DateTime? to) =>
        Ok(await _service.GetByUserAsync(userId, from, to));

    /// <summary>Son N kaydı döner (varsayılan 50, en fazla 500).</summary>
    [HttpGet("recent")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<AuditLogDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetRecent([FromQuery] int limit = 50) =>
        Ok(await _service.GetRecentAsync(limit));
}
