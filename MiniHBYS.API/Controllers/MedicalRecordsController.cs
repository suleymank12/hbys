using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MiniHBYS.Core.DTOs;
using MiniHBYS.Core.Interfaces;

namespace MiniHBYS.API.Controllers;

[ApiController]
[Route("api/medical-records")]
[Produces("application/json")]
[Tags("MedicalRecords")]
[Authorize]
public class MedicalRecordsController : ControllerBase
{
    private readonly IMedicalRecordService _service;

    public MedicalRecordsController(IMedicalRecordService service)
    {
        _service = service;
    }

    /// <summary>Muayene kayıtlarını sayfalı şekilde listeler.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<MedicalRecordDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20) =>
        Ok(await _service.GetAllAsync(page, pageSize));

    /// <summary>Hastaya ait tüm muayene kayıtlarını listeler.</summary>
    [HttpGet("patient/{patientId:int}")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<MedicalRecordDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetByPatient(int patientId) =>
        Ok(await _service.GetByPatientIdAsync(patientId));

    /// <summary>Doktora ait tüm muayene kayıtlarını listeler.</summary>
    [HttpGet("doctor/{doctorId:int}")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<MedicalRecordDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetByDoctor(int doctorId) =>
        Ok(await _service.GetByDoctorIdAsync(doctorId));

    /// <summary>Bir randevuya ait muayene kaydını getirir.</summary>
    [HttpGet("appointment/{appointmentId:int}")]
    [ProducesResponseType(typeof(ApiResponse<MedicalRecordDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<MedicalRecordDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetByAppointment(int appointmentId)
    {
        var result = await _service.GetByAppointmentIdAsync(appointmentId);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>Tamamlanmış randevuya muayene kaydı oluşturur. Yalnızca randevunun
    /// kendi doktoru tarafından çağrılabilir.</summary>
    [HttpPost]
    [Authorize(Roles = "Doktor")]
    [ProducesResponseType(typeof(ApiResponse<MedicalRecordDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<MedicalRecordDto>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Create([FromBody] CreateMedicalRecordDto dto)
    {
        if (!TryGetDoctorId(out var doctorId))
            return Forbid();

        var result = await _service.CreateAsync(dto, doctorId);
        return result.Success
            ? CreatedAtAction(nameof(GetByAppointment), new { appointmentId = result.Data!.AppointmentId }, result)
            : BadRequest(result);
    }

    /// <summary>Muayene kaydını günceller. Yalnızca kaydı oluşturan doktor düzenleyebilir.</summary>
    [HttpPut("{id:int}")]
    [Authorize(Roles = "Doktor")]
    [ProducesResponseType(typeof(ApiResponse<MedicalRecordDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<MedicalRecordDto>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<MedicalRecordDto>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateMedicalRecordDto dto)
    {
        if (!TryGetDoctorId(out var doctorId))
            return Forbid();

        var result = await _service.UpdateAsync(id, dto, doctorId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    private bool TryGetDoctorId(out int doctorId)
    {
        var claim = User.FindFirstValue("doctorId");
        return int.TryParse(claim, out doctorId);
    }
}
