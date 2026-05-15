using MiniHBYS.Core.DTOs;

namespace MiniHBYS.Core.Interfaces;

public interface IAuditService
{
    /// <summary>
    /// HttpContext'ten userId/userName/role/IP otomatik çıkarılarak log kaydı oluşturur.
    /// HTTP context yoksa kayıt yapılmaz.
    /// </summary>
    Task LogAsync(string entityType, int entityId, string action, string? details = null);

    /// <summary>
    /// Açık parametrelerle log kaydı oluşturur (login/login-fail gibi
    /// kullanıcı context'i kurulmadan önce kullanılır).
    /// </summary>
    Task LogForAsync(
        int userId,
        string userName,
        string userRole,
        string entityType,
        int entityId,
        string action,
        string? details = null,
        string? ipAddress = null);

    Task<ApiResponse<IEnumerable<AuditLogDto>>> GetByEntityAsync(string entityType, int entityId);
    Task<ApiResponse<IEnumerable<AuditLogDto>>> GetByUserAsync(int userId, DateTime? from = null, DateTime? to = null);
    Task<ApiResponse<IEnumerable<AuditLogDto>>> GetRecentAsync(int limit = 50);
}
