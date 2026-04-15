using Microsoft.AspNetCore.Mvc;
using MiniHBYS.Core.DTOs;
using MiniHBYS.Core.Interfaces;

namespace MiniHBYS.API.Controllers;

[ApiController]
[Route("api/appointments")]
[Produces("application/json")]
[Tags("Appointments")]
public class AppointmentsController : ControllerBase
{
    private readonly IAppointmentService _service;

    public AppointmentsController(IAppointmentService service)
    {
        _service = service;
    }

    /// <summary>Tüm randevuları listeler.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<AppointmentDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll() => Ok(await _service.GetAllAsync());

    /// <summary>Id'ye göre randevu getirir.</summary>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<AppointmentDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<AppointmentDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await _service.GetByIdAsync(id);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>Doktora ait randevuları listeler.</summary>
    [HttpGet("doctor/{doctorId:int}")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<AppointmentDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetByDoctorId(int doctorId) =>
        Ok(await _service.GetByDoctorIdAsync(doctorId));

    /// <summary>Hastaya ait randevuları listeler.</summary>
    [HttpGet("patient/{patientId:int}")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<AppointmentDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetByPatientId(int patientId) =>
        Ok(await _service.GetByPatientIdAsync(patientId));

    /// <summary>Yeni randevu oluşturur (30 dk slot çakışma kontrolü ile).</summary>
    /// <remarks>
    /// Örnek istek:
    ///
    ///     POST /api/appointments
    ///     {
    ///       "patientId": 12,
    ///       "doctorId": 3,
    ///       "dateTime": "2026-04-20T10:30:00Z"
    ///     }
    ///
    /// Aynı doktorun ±30 dakikalık slotunda başka bir randevu varsa 400 döner.
    /// </remarks>
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<AppointmentDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<AppointmentDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] CreateAppointmentDto dto)
    {
        var result = await _service.CreateAsync(dto);
        return result.Success
            ? CreatedAtAction(nameof(GetById), new { id = result.Data!.Id }, result)
            : BadRequest(result);
    }

    /// <summary>Randevu durumunu günceller (yalnızca Bekliyor → Tamamlandı/İptal geçişi).</summary>
    /// <remarks>
    /// Durum değerleri: `0 = Bekliyor`, `1 = Tamamlandı`, `2 = İptal Edildi`.
    ///
    /// Örnek istek:
    ///
    ///     PUT /api/appointments/45/status
    ///     { "status": 1 }
    /// </remarks>
    [HttpPut("{id:int}/status")]
    [ProducesResponseType(typeof(ApiResponse<AppointmentDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<AppointmentDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateAppointmentStatusDto dto)
    {
        var result = await _service.UpdateStatusAsync(id, dto);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>Randevuyu iptal eder (soft delete).</summary>
    [HttpDelete("{id:int}/cancel")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Cancel(int id)
    {
        var result = await _service.DeleteAsync(id);
        return result.Success ? Ok(result) : NotFound(result);
    }
}
