using MiniHBYS.Core.DTOs;

namespace MiniHBYS.Core.Interfaces;

public interface IDoctorService
{
    Task<ApiResponse<IEnumerable<DoctorDto>>> GetAllAsync();
    Task<ApiResponse<DoctorDto>> GetByIdAsync(int id);
    Task<ApiResponse<IEnumerable<DoctorDto>>> GetByBranchAsync(string branch);
    Task<ApiResponse<DoctorDto>> CreateAsync(CreateDoctorDto dto);
    Task<ApiResponse<DoctorDto>> UpdateAsync(int id, UpdateDoctorDto dto);
    Task<ApiResponse<bool>> DeleteAsync(int id);
}
