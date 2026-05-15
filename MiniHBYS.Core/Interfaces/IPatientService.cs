using MiniHBYS.Core.DTOs;

namespace MiniHBYS.Core.Interfaces;

public interface IPatientService
{
    Task<ApiResponse<PagedResult<PatientDto>>> GetAllAsync(int page = 1, int pageSize = 20, string? search = null);
    Task<ApiResponse<PatientDto>> GetByIdAsync(int id);
    Task<ApiResponse<PatientDto>> GetByNationalIdAsync(string nationalId);
    Task<ApiResponse<PatientDto>> CreateAsync(CreatePatientDto dto);
    Task<ApiResponse<PatientDto>> UpdateAsync(int id, UpdatePatientDto dto);
    Task<ApiResponse<bool>> DeleteAsync(int id);
}
