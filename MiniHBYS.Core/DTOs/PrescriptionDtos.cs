namespace MiniHBYS.Core.DTOs;

public class PrescriptionItemDto
{
    public int Id { get; set; }
    public string MedicationName { get; set; } = string.Empty;
    public string Dosage { get; set; } = string.Empty;
    public string Frequency { get; set; } = string.Empty;
    public string Duration { get; set; } = string.Empty;
    public string? Instructions { get; set; }
}

public class PrescriptionDto
{
    public int Id { get; set; }
    public int MedicalRecordId { get; set; }
    public string PrescriptionNumber { get; set; } = string.Empty;
    public DateTime PrescribedAt { get; set; }
    public string PatientFullName { get; set; } = string.Empty;
    public string DoctorName { get; set; } = string.Empty;
    public string DoctorBranch { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public List<PrescriptionItemDto> Items { get; set; } = new();
}

public class CreatePrescriptionItemDto
{
    public string MedicationName { get; set; } = string.Empty;
    public string Dosage { get; set; } = string.Empty;
    public string Frequency { get; set; } = string.Empty;
    public string Duration { get; set; } = string.Empty;
    public string? Instructions { get; set; }
}

public class CreatePrescriptionDto
{
    public int MedicalRecordId { get; set; }
    public List<CreatePrescriptionItemDto> Items { get; set; } = new();
}

public class UpdatePrescriptionDto
{
    public List<CreatePrescriptionItemDto> Items { get; set; } = new();
}
