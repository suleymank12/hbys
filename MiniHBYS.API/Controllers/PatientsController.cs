using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MiniHBYS.Core.DTOs;
using MiniHBYS.Core.Interfaces;

namespace MiniHBYS.API.Controllers;

[ApiController]
[Route("api/patients")]
[Produces("application/json")]
[Tags("Patients")]
[Authorize]
public class PatientsController : ControllerBase
{
    private const string WriteRoles = "Admin,Sekreter";

    private readonly IPatientService _service;

    public PatientsController(IPatientService service)
    {
        _service = service;
    }

    /// <summary>Tüm hastaları listeler.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<PatientDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll() => Ok(await _service.GetAllAsync());

    /// <summary>Id'ye göre hasta getirir.</summary>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<PatientDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<PatientDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await _service.GetByIdAsync(id);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>TC kimlik numarası ile hasta getirir.</summary>
    [HttpGet("tc/{nationalId}")]
    [ProducesResponseType(typeof(ApiResponse<PatientDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<PatientDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetByNationalId(string nationalId)
    {
        var result = await _service.GetByNationalIdAsync(nationalId);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>Yeni hasta oluşturur.</summary>
    /// <remarks>
    /// Örnek istek:
    ///
    ///     POST /api/patients
    ///     {
    ///       "name": "Ayşe",
    ///       "surname": "Yılmaz",
    ///       "nationalId": "12345678901",
    ///       "birthDate": "1990-05-14",
    ///       "phone": "05321234567",
    ///       "email": "ayse@example.com"
    ///     }
    /// </remarks>
    [HttpPost]
    [Authorize(Roles = WriteRoles)]
    [ProducesResponseType(typeof(ApiResponse<PatientDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<PatientDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] CreatePatientDto dto)
    {
        var result = await _service.CreateAsync(dto);
        return result.Success
            ? CreatedAtAction(nameof(GetById), new { id = result.Data!.Id }, result)
            : BadRequest(result);
    }

    /// <summary>Hasta bilgilerini günceller.</summary>
    [HttpPut("{id:int}")]
    [Authorize(Roles = WriteRoles)]
    [ProducesResponseType(typeof(ApiResponse<PatientDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<PatientDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(int id, [FromBody] UpdatePatientDto dto)
    {
        var result = await _service.UpdateAsync(id, dto);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>Hasta kaydını siler (soft delete).</summary>
    [HttpDelete("{id:int}")]
    [Authorize(Roles = WriteRoles)]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id)
    {
        var result = await _service.DeleteAsync(id);
        return result.Success ? Ok(result) : NotFound(result);
    }
}
