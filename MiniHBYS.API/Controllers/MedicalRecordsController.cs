using Microsoft.AspNetCore.Mvc;
using MiniHBYS.Core.DTOs;
using MiniHBYS.Core.Interfaces;

namespace MiniHBYS.API.Controllers;

[ApiController]
[Route("api/medical-records")]
[Produces("application/json")]
[Tags("MedicalRecords")]
public class MedicalRecordsController : ControllerBase
{
    private readonly IMedicalRecordService _service;

    public MedicalRecordsController(IMedicalRecordService service)
    {
        _service = service;
    }

    /// <summary>Tüm muayene kayıtlarını listeler.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<MedicalRecordDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll() =>
        Ok(await _service.GetAllAsync());

    /// <summary>Hastaya ait tüm muayene kayıtlarını listeler.</summary>
    [HttpGet("patient/{patientId:int}")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<MedicalRecordDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetByPatient(int patientId) =>
        Ok(await _service.GetByPatientIdAsync(patientId));

    /// <summary>Bir randevuya ait muayene kaydını getirir.</summary>
    [HttpGet("appointment/{appointmentId:int}")]
    [ProducesResponseType(typeof(ApiResponse<MedicalRecordDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<MedicalRecordDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetByAppointment(int appointmentId)
    {
        var result = await _service.GetByAppointmentIdAsync(appointmentId);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>Tamamlanmış randevuya muayene kaydı oluşturur.</summary>
    /// <remarks>
    /// Kayıt yalnızca `status = Tamamlandı` olan bir randevu için oluşturulabilir
    /// ve aynı randevuya birden fazla kayıt eklenemez.
    ///
    /// Örnek istek:
    ///
    ///     POST /api/medical-records
    ///     {
    ///       "appointmentId": 45,
    ///       "diagnosis": "Üst solunum yolu enfeksiyonu",
    ///       "notes": "5 gün antibiyotik, bol sıvı. 1 hafta sonra kontrol."
    ///     }
    /// </remarks>
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<MedicalRecordDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<MedicalRecordDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] CreateMedicalRecordDto dto)
    {
        var result = await _service.CreateAsync(dto);
        return result.Success
            ? CreatedAtAction(nameof(GetByAppointment), new { appointmentId = result.Data!.AppointmentId }, result)
            : BadRequest(result);
    }

    /// <summary>Muayene kaydını günceller.</summary>
    /// <remarks>
    /// Örnek istek:
    ///
    ///     PUT /api/medical-records/78
    ///     {
    ///       "diagnosis": "Viral farenjit",
    ///       "notes": "Semptomatik tedavi, istirahat."
    ///     }
    /// </remarks>
    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<MedicalRecordDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<MedicalRecordDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateMedicalRecordDto dto)
    {
        var result = await _service.UpdateAsync(id, dto);
        return result.Success ? Ok(result) : NotFound(result);
    }
}
