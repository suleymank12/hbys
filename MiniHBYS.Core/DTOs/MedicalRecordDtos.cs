namespace MiniHBYS.Core.DTOs;

public class VitalSignsDto
{
    public int? BloodPressureSystolic { get; set; }
    public int? BloodPressureDiastolic { get; set; }
    public int? Pulse { get; set; }
    public decimal? Temperature { get; set; }
    public int? RespiratoryRate { get; set; }
    public int? OxygenSaturation { get; set; }
    public decimal? Height { get; set; }
    public decimal? Weight { get; set; }
}

public class MedicalRecordDto
{
    public int Id { get; set; }
    public int AppointmentId { get; set; }
    public string PatientFullName { get; set; } = string.Empty;
    public string DoctorName { get; set; } = string.Empty;
    public string DoctorBranch { get; set; } = string.Empty;
    public DateTime AppointmentDate { get; set; }
    public string ChiefComplaint { get; set; } = string.Empty;
    public string? History { get; set; }
    public string? Examination { get; set; }
    public string Diagnosis { get; set; } = string.Empty;
    public string? DiagnosisCode { get; set; }
    public string? TreatmentPlan { get; set; }
    public string? Notes { get; set; }
    public VitalSignsDto? VitalSigns { get; set; }
    public PrescriptionDto? Prescription { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateMedicalRecordDto
{
    public int AppointmentId { get; set; }
    public string ChiefComplaint { get; set; } = string.Empty;
    public string? History { get; set; }
    public string? Examination { get; set; }
    public string Diagnosis { get; set; } = string.Empty;
    public string? DiagnosisCode { get; set; }
    public string? TreatmentPlan { get; set; }
    public string? Notes { get; set; }
    public VitalSignsDto? VitalSigns { get; set; }
}

public class UpdateMedicalRecordDto
{
    public string ChiefComplaint { get; set; } = string.Empty;
    public string? History { get; set; }
    public string? Examination { get; set; }
    public string Diagnosis { get; set; } = string.Empty;
    public string? DiagnosisCode { get; set; }
    public string? TreatmentPlan { get; set; }
    public string? Notes { get; set; }
    public VitalSignsDto? VitalSigns { get; set; }
}
