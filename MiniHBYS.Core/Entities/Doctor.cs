using MiniHBYS.Core.Enums;

namespace MiniHBYS.Core.Entities;

public class Doctor : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Branch { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public UserRole Role { get; set; } = UserRole.Doktor;

    public ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();
}
