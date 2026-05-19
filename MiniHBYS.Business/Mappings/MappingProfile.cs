using AutoMapper;
using MiniHBYS.Core.DTOs;
using MiniHBYS.Core.Entities;
using MiniHBYS.Core.Enums;

namespace MiniHBYS.Business.Mappings;

public class MappingProfile : Profile
{
    public MappingProfile()
    {
        CreateMap<Patient, PatientDto>()
            .ForMember(d => d.FullName, o => o.MapFrom(s => $"{s.Name} {s.Surname}"))
            .ForMember(d => d.GenderText, o => o.MapFrom(s => GetGenderText(s.Gender)))
            .ForMember(d => d.BloodTypeText, o => o.MapFrom(s => GetBloodTypeText(s.BloodType)))
            .ForMember(d => d.InsuranceTypeText, o => o.MapFrom(s => GetInsuranceTypeText(s.InsuranceType)));
        CreateMap<CreatePatientDto, Patient>()
            .ForMember(d => d.ProtocolNumber, o => o.Ignore());
        CreateMap<UpdatePatientDto, Patient>()
            .ForMember(d => d.ProtocolNumber, o => o.Ignore())
            .ForMember(d => d.NationalId, o => o.Ignore());

        CreateMap<Doctor, DoctorDto>()
            .ForMember(d => d.Email,
                o => o.MapFrom(s => s.User != null ? s.User.Email : string.Empty))
            .ForMember(d => d.DisplayName,
                o => o.MapFrom(s => BuildDoctorDisplayName(s.Title, s.Name)));
        CreateMap<CreateDoctorDto, Doctor>()
            .ForMember(d => d.UserId, o => o.Ignore())
            .ForMember(d => d.User, o => o.Ignore());
        CreateMap<UpdateDoctorDto, Doctor>()
            .ForMember(d => d.UserId, o => o.Ignore())
            .ForMember(d => d.User, o => o.Ignore());

        CreateMap<Appointment, AppointmentDto>()
            .ForMember(d => d.PatientFullName,
                o => o.MapFrom(s => s.Patient != null ? $"{s.Patient.Name} {s.Patient.Surname}" : string.Empty))
            .ForMember(d => d.DoctorName,
                o => o.MapFrom(s => s.Doctor != null ? BuildDoctorDisplayName(s.Doctor.Title, s.Doctor.Name) : string.Empty))
            .ForMember(d => d.DoctorBranch,
                o => o.MapFrom(s => s.Doctor != null ? s.Doctor.Branch : string.Empty))
            .ForMember(d => d.StatusText,
                o => o.MapFrom(s => GetStatusText(s.Status)))
            .ForMember(d => d.TypeText,
                o => o.MapFrom(s => GetTypeText(s.Type)));
        CreateMap<CreateAppointmentDto, Appointment>();

        CreateMap<MedicalRecord, MedicalRecordDto>()
            .ForMember(d => d.PatientFullName,
                o => o.MapFrom(s => s.Appointment != null && s.Appointment.Patient != null
                    ? $"{s.Appointment.Patient.Name} {s.Appointment.Patient.Surname}"
                    : string.Empty))
            .ForMember(d => d.DoctorName,
                o => o.MapFrom(s => s.Appointment != null && s.Appointment.Doctor != null
                    ? BuildDoctorDisplayName(s.Appointment.Doctor.Title, s.Appointment.Doctor.Name)
                    : string.Empty))
            .ForMember(d => d.DoctorBranch,
                o => o.MapFrom(s => s.Appointment != null && s.Appointment.Doctor != null
                    ? s.Appointment.Doctor.Branch
                    : string.Empty))
            .ForMember(d => d.AppointmentDate,
                o => o.MapFrom(s => s.Appointment != null ? s.Appointment.DateTime : default))
            .ForMember(d => d.VitalSigns,
                o => o.MapFrom(s => s.VitalSigns))
            .ForMember(d => d.Prescription,
                o => o.MapFrom(s => s.Prescription));
        CreateMap<VitalSigns, VitalSignsDto>();
        CreateMap<Icd10Code, Icd10CodeDto>();

        CreateMap<Prescription, PrescriptionDto>()
            .ForMember(d => d.PatientFullName,
                o => o.MapFrom(s => s.MedicalRecord != null && s.MedicalRecord.Appointment != null && s.MedicalRecord.Appointment.Patient != null
                    ? $"{s.MedicalRecord.Appointment.Patient.Name} {s.MedicalRecord.Appointment.Patient.Surname}"
                    : string.Empty))
            .ForMember(d => d.DoctorName,
                o => o.MapFrom(s => s.MedicalRecord != null && s.MedicalRecord.Appointment != null && s.MedicalRecord.Appointment.Doctor != null
                    ? BuildDoctorDisplayName(s.MedicalRecord.Appointment.Doctor.Title, s.MedicalRecord.Appointment.Doctor.Name)
                    : string.Empty))
            .ForMember(d => d.DoctorBranch,
                o => o.MapFrom(s => s.MedicalRecord != null && s.MedicalRecord.Appointment != null && s.MedicalRecord.Appointment.Doctor != null
                    ? s.MedicalRecord.Appointment.Doctor.Branch
                    : string.Empty));
        CreateMap<PrescriptionItem, PrescriptionItemDto>();

        CreateMap<AuditLog, AuditLogDto>();
        CreateMap<CreateMedicalRecordDto, MedicalRecord>()
            .ForMember(d => d.VitalSigns, o => o.Ignore());
        CreateMap<UpdateMedicalRecordDto, MedicalRecord>()
            .ForMember(d => d.AppointmentId, o => o.Ignore())
            .ForMember(d => d.VitalSigns, o => o.Ignore());
    }

    private static string BuildDoctorDisplayName(string? title, string name) =>
        string.IsNullOrWhiteSpace(title) ? name : $"{title.Trim()} {name}";

    private static string GetStatusText(AppointmentStatus status) => status switch
    {
        AppointmentStatus.Bekliyor => "Bekliyor",
        AppointmentStatus.Geldi => "Geldi",
        AppointmentStatus.MuayenedeAlindi => "Muayenede",
        AppointmentStatus.Tamamlandi => "Tamamlandı",
        AppointmentStatus.IptalEdildi => "İptal Edildi",
        AppointmentStatus.Gelmedi => "Gelmedi",
        _ => status.ToString()
    };

    private static string GetTypeText(AppointmentType type) => type switch
    {
        AppointmentType.Poliklinik => "Poliklinik",
        AppointmentType.Kontrol => "Kontrol",
        AppointmentType.Acil => "Acil",
        _ => type.ToString()
    };

    private static string GetGenderText(Gender gender) => gender switch
    {
        Gender.Erkek => "Erkek",
        Gender.Kadın => "Kadın",
        Gender.Belirtilmemiş => "Belirtilmemiş",
        _ => gender.ToString()
    };

    private static string? GetBloodTypeText(BloodType? bt) => bt switch
    {
        BloodType.ARhPositive => "A Rh+",
        BloodType.ARhNegative => "A Rh-",
        BloodType.BRhPositive => "B Rh+",
        BloodType.BRhNegative => "B Rh-",
        BloodType.ABRhPositive => "AB Rh+",
        BloodType.ABRhNegative => "AB Rh-",
        BloodType.ORhPositive => "0 Rh+",
        BloodType.ORhNegative => "0 Rh-",
        _ => null
    };

    private static string GetInsuranceTypeText(InsuranceType t) => t switch
    {
        InsuranceType.SGK => "SGK",
        InsuranceType.Ozel => "Özel Sigorta",
        InsuranceType.Yabanci => "Yabancı Uyruklu",
        InsuranceType.Yok => "Yok",
        _ => t.ToString()
    };
}
