namespace MiniHBYS.Core.DTOs;

public class MedicalRecordDto
{
    public int Id { get; set; }
    public int AppointmentId { get; set; }
    public string PatientFullName { get; set; } = string.Empty;
    public string DoctorName { get; set; } = string.Empty;
    public string DoctorBranch { get; set; } = string.Empty;
    public DateTime AppointmentDate { get; set; }
    public string Diagnosis { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateMedicalRecordDto
{
    public int AppointmentId { get; set; }
    public string Diagnosis { get; set; } = string.Empty;
    public string? Notes { get; set; }
}

public class UpdateMedicalRecordDto
{
    public string Diagnosis { get; set; } = string.Empty;
    public string? Notes { get; set; }
}
