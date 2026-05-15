namespace MiniHBYS.Core.Entities;

public class Doctor : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Branch { get; set; } = string.Empty;

    public int UserId { get; set; }
    public User User { get; set; } = null!;

    public ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();
}
