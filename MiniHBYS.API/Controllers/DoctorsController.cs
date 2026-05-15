using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MiniHBYS.Core.DTOs;
using MiniHBYS.Core.Interfaces;

namespace MiniHBYS.API.Controllers;

[ApiController]
[Route("api/doctors")]
[Produces("application/json")]
[Tags("Doctors")]
[Authorize(Roles = "Admin")]
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
    [ProducesResponseType(typeof(ApiResponse<DoctorDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<DoctorDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateDoctorDto dto)
    {
        var result = await _service.UpdateAsync(id, dto);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>Doktor kaydını siler (soft delete).</summary>
    [HttpDelete("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id)
    {
        var result = await _service.DeleteAsync(id);
        return result.Success ? Ok(result) : NotFound(result);
    }
}
