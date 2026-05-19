using MiniHBYS.Core.DTOs;

namespace MiniHBYS.Core.Interfaces;

public interface IAuthService
{
    Task<ApiResponse<LoginResponseDto>> LoginAsync(LoginDto dto);
    Task<ApiResponse<CurrentUserDto>> GetCurrentUserAsync(int userId);
    Task<ApiResponse<bool>> ChangePasswordAsync(int userId, ChangePasswordDto dto);
}
