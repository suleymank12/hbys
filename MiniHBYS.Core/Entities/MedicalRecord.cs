namespace MiniHBYS.Core.Entities;

public class MedicalRecord : BaseEntity
{
    public int AppointmentId { get; set; }
    public string Diagnosis { get; set; } = string.Empty;
    public string? Notes { get; set; }

    public Appointment Appointment { get; set; } = null!;
}
