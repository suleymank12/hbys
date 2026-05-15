namespace MiniHBYS.Core.Entities;

/// <summary>
/// KVKK m.12 gereği veri erişim ve değişikliklerini izleyen denetim kaydı.
/// Bağımsız log tablosu — soft delete yoktur, kayıtlar değiştirilemez.
/// </summary>
public class AuditLog
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string UserRole { get; set; } = string.Empty;
    public string EntityType { get; set; } = string.Empty;
    public int EntityId { get; set; }
    public string Action { get; set; } = string.Empty;
    public string? Details { get; set; }
    public string? IpAddress { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}
