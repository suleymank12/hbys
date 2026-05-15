namespace MiniHBYS.Core.Entities;

public class MedicalRecord : BaseEntity
{
    public int AppointmentId { get; set; }
    public string ChiefComplaint { get; set; } = string.Empty;
    public string? History { get; set; }
    public string? Examination { get; set; }
    public string Diagnosis { get; set; } = string.Empty;
    public string? DiagnosisCode { get; set; }
    public string? TreatmentPlan { get; set; }
    public string? Notes { get; set; }

    public Appointment Appointment { get; set; } = null!;
    public VitalSigns? VitalSigns { get; set; }
}
