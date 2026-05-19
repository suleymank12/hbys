using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MiniHBYS.Core.DTOs;
using MiniHBYS.Core.Interfaces;

namespace MiniHBYS.API.Controllers;

[ApiController]
[Route("api/doctors")]
[Produces("application/json")]
[Tags("Doctors")]
[Authorize]
public class DoctorsController : ControllerBase
{
    private readonly IDoctorService _service;

    public DoctorsController(IDoctorService service)
    {
        _service = service;
    }

    /// <summary>Tüm doktorları listeler.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<DoctorDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll() => Ok(await _service.GetAllAsync());

    /// <summary>Id'ye göre doktor getirir.</summary>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<DoctorDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<DoctorDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await _service.GetByIdAsync(id);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>Branşa göre doktorları listeler.</summary>
    [HttpGet("branch/{branch}")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<DoctorDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetByBranch(string branch) =>
        Ok(await _service.GetByBranchAsync(branch));

    /// <summary>Yeni doktor oluşturur.</summary>
    /// <remarks>
    /// Örnek istek:
    ///
    ///     POST /api/doctors
    ///     {
    ///       "name": "Dr. Mehmet Demir",
    ///       "branch": "Kardiyoloji",
    ///       "email": "mehmet.demir@hastane.com",
    ///       "password": "Gecici.123"
    ///     }
    /// </remarks>
    [HttpPost]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(ApiResponse<DoctorDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<DoctorDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] CreateDoctorDto dto)
    {
        var result = await _service.CreateAsync(dto);
        return result.Success
            ? CreatedAtAction(nameof(GetById), new { id = result.Data!.Id }, result)
            : BadRequest(result);
    }

    /// <summary>Doktor bilgilerini günceller.</summary>
    /// <remarks>
    /// Örnek istek:
    ///
    ///     PUT /api/doctors/3
    ///     {
    ///       "name": "Dr. Mehmet Demir",
    ///       "branch": "Kardiyoloji",
    ///       "email": "mehmet.demir@hastane.com"
    ///     }
    /// </remarks>
    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(ApiResponse<DoctorDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<DoctorDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateDoctorDto dto)
    {
        var result = await _service.UpdateAsync(id, dto);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>Doktor kaydını siler (soft delete).</summary>
    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id)
    {
        var result = await _service.DeleteAsync(id);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>Doktorun haftalık mesai çizelgesini günceller (mevcut çizelgeyi tamamen değiştirir).</summary>
    /// <remarks>
    /// Örnek istek:
    ///
    ///     PUT /api/doctors/3/schedule
    ///     {
    ///       "schedules": [
    ///         { "dayOfWeek": 1, "startTime": "08:00", "endTime": "17:00" },
    ///         { "dayOfWeek": 2, "startTime": "08:00", "endTime": "17:00" }
    ///       ]
    ///     }
    ///
    /// `dayOfWeek`: 1=Pazartesi, ... 7=Pazar. Verilmeyen günler mesai dışı sayılır.
    /// </remarks>
    [HttpPut("{id:int}/schedule")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(ApiResponse<DoctorDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<DoctorDto>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<DoctorDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateSchedule(int id, [FromBody] UpdateDoctorScheduleDto dto)
    {
        var result = await _service.UpdateScheduleAsync(id, dto);
        if (!result.Success)
        {
            return result.Message?.Contains("bulunamadı") == true
                ? NotFound(result)
                : BadRequest(result);
        }
        return Ok(result);
    }
}
