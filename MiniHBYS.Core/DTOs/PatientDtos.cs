using MiniHBYS.Core.Enums;

namespace MiniHBYS.Core.DTOs;

public class PatientDto
{
    public int Id { get; set; }
    public string ProtocolNumber { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Surname { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string NationalId { get; set; } = string.Empty;
    public DateTime BirthDate { get; set; }
    public Gender Gender { get; set; }
    public string GenderText { get; set; } = string.Empty;
    public BloodType? BloodType { get; set; }
    public string? BloodTypeText { get; set; }
    public InsuranceType InsuranceType { get; set; }
    public string InsuranceTypeText { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? City { get; set; }
    public string? District { get; set; }
    public string? Address { get; set; }
    public string? EmergencyContactName { get; set; }
    public string? EmergencyContactPhone { get; set; }
    public string? Allergies { get; set; }
    public string? ChronicDiseases { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreatePatientDto
{
    public string Name { get; set; } = string.Empty;
    public string Surname { get; set; } = string.Empty;
    public string NationalId { get; set; } = string.Empty;
    public DateTime BirthDate { get; set; }
    public Gender Gender { get; set; } = Gender.Belirtilmemiş;
    public BloodType? BloodType { get; set; }
    public InsuranceType InsuranceType { get; set; } = InsuranceType.SGK;
    public string Phone { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? City { get; set; }
    public string? District { get; set; }
    public string? Address { get; set; }
    public string? EmergencyContactName { get; set; }
    public string? EmergencyContactPhone { get; set; }
    public string? Allergies { get; set; }
    public string? ChronicDiseases { get; set; }
}

public class UpdatePatientDto
{
    public string Name { get; set; } = string.Empty;
    public string Surname { get; set; } = string.Empty;
    public DateTime BirthDate { get; set; }
    public Gender Gender { get; set; } = Gender.Belirtilmemiş;
    public BloodType? BloodType { get; set; }
    public InsuranceType InsuranceType { get; set; } = InsuranceType.SGK;
    public string Phone { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? City { get; set; }
    public string? District { get; set; }
    public string? Address { get; set; }
    public string? EmergencyContactName { get; set; }
    public string? EmergencyContactPhone { get; set; }
    public string? Allergies { get; set; }
    public string? ChronicDiseases { get; set; }
}
