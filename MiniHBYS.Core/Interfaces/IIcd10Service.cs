using MiniHBYS.Core.DTOs;

namespace MiniHBYS.Core.Interfaces;

public interface IIcd10Service
{
    Task<ApiResponse<IEnumerable<Icd10CodeDto>>> SearchAsync(string? term, int limit = 20);
}
