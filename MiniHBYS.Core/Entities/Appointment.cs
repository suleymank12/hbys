using MiniHBYS.Core.Enums;

namespace MiniHBYS.Core.Entities;

public class Appointment : BaseEntity
{
    public int PatientId { get; set; }
    public int DoctorId { get; set; }
    public DateTime DateTime { get; set; }
    public AppointmentStatus Status { get; set; } = AppointmentStatus.Bekliyor;
    public AppointmentType Type { get; set; } = AppointmentType.Poliklinik;

    public Patient Patient { get; set; } = null!;
    public Doctor Doctor { get; set; } = null!;
    public MedicalRecord? MedicalRecord { get; set; }
}
