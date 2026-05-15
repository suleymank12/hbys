using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MiniHBYS.Core.DTOs;
using MiniHBYS.Core.Interfaces;

namespace MiniHBYS.API.Controllers;

[ApiController]
[Route("api/prescriptions")]
[Produces("application/json")]
[Tags("Prescriptions")]
[Authorize]
public class PrescriptionsController : ControllerBase
{
    private readonly IPrescriptionService _service;

    public PrescriptionsController(IPrescriptionService service)
    {
        _service = service;
    }

    /// <summary>Bir muayene kaydına ait reçeteyi getirir.</summary>
    [HttpGet("medical-record/{medicalRecordId:int}")]
    [ProducesResponseType(typeof(ApiResponse<PrescriptionDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<PrescriptionDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetByMedicalRecord(int medicalRecordId)
    {
        var result = await _service.GetByMedicalRecordIdAsync(medicalRecordId);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>Hastaya ait tüm reçeteleri listeler.</summary>
    [HttpGet("patient/{patientId:int}")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<PrescriptionDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetByPatient(int patientId) =>
        Ok(await _service.GetByPatientIdAsync(patientId));

    /// <summary>Doktora ait tüm reçeteleri listeler.</summary>
    [HttpGet("doctor/{doctorId:int}")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<PrescriptionDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetByDoctor(int doctorId) =>
        Ok(await _service.GetByDoctorIdAsync(doctorId));

    /// <summary>Bir muayene kaydı için reçete oluşturur. Yalnızca kaydın doktoru yazabilir.</summary>
    [HttpPost]
    [Authorize(Roles = "Doktor")]
    [ProducesResponseType(typeof(ApiResponse<PrescriptionDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<PrescriptionDto>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Create([FromBody] CreatePrescriptionDto dto)
    {
        if (!TryGetDoctorId(out var doctorId)) return Forbid();

        var result = await _service.CreateAsync(dto, doctorId);
        return result.Success
            ? CreatedAtAction(nameof(GetByMedicalRecord), new { medicalRecordId = result.Data!.MedicalRecordId }, result)
            : BadRequest(result);
    }

    /// <summary>Reçete ilaçlarını günceller. Yalnızca reçeteyi yazan doktor düzenleyebilir.</summary>
    [HttpPut("{id:int}")]
    [Authorize(Roles = "Doktor")]
    [ProducesResponseType(typeof(ApiResponse<PrescriptionDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<PrescriptionDto>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Update(int id, [FromBody] UpdatePrescriptionDto dto)
    {
        if (!TryGetDoctorId(out var doctorId)) return Forbid();

        var result = await _service.UpdateAsync(id, dto, doctorId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    private bool TryGetDoctorId(out int doctorId)
    {
        var claim = User.FindFirstValue("doctorId");
        return int.TryParse(claim, out doctorId);
    }
}
