using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MiniHBYS.Core.DTOs;
using MiniHBYS.Core.Interfaces;

namespace MiniHBYS.API.Controllers;

[ApiController]
[Route("api/icd10")]
[Produces("application/json")]
[Tags("Icd10")]
[Authorize]
public class Icd10Controller : ControllerBase
{
    private readonly IIcd10Service _service;

    public Icd10Controller(IIcd10Service service)
    {
        _service = service;
    }

    /// <summary>
    /// ICD-10 kodlarını arar. Boş aramada ilk 20 kodu döner.
    /// Arama hem koda hem Türkçe tanı adına bakar (ILIKE).
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<Icd10CodeDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Search([FromQuery] string? search) =>
        Ok(await _service.SearchAsync(search));
}
