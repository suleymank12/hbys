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
            .ForMember(d => d.FullName, o => o.MapFrom(s => $"{s.Name} {s.Surname}"));
        CreateMap<CreatePatientDto, Patient>();
        CreateMap<UpdatePatientDto, Patient>();

        CreateMap<Doctor, DoctorDto>();
        CreateMap<CreateDoctorDto, Doctor>()
            .ForMember(d => d.Password, o => o.Ignore());
        CreateMap<UpdateDoctorDto, Doctor>();

        CreateMap<Appointment, AppointmentDto>()
            .ForMember(d => d.PatientFullName,
                o => o.MapFrom(s => s.Patient != null ? $"{s.Patient.Name} {s.Patient.Surname}" : string.Empty))
            .ForMember(d => d.DoctorName,
                o => o.MapFrom(s => s.Doctor != null ? s.Doctor.Name : string.Empty))
            .ForMember(d => d.DoctorBranch,
                o => o.MapFrom(s => s.Doctor != null ? s.Doctor.Branch : string.Empty))
            .ForMember(d => d.StatusText,
                o => o.MapFrom(s => GetStatusText(s.Status)));
        CreateMap<CreateAppointmentDto, Appointment>();

        CreateMap<MedicalRecord, MedicalRecordDto>()
            .ForMember(d => d.PatientFullName,
                o => o.MapFrom(s => s.Appointment != null && s.Appointment.Patient != null
                    ? $"{s.Appointment.Patient.Name} {s.Appointment.Patient.Surname}"
                    : string.Empty))
            .ForMember(d => d.DoctorName,
                o => o.MapFrom(s => s.Appointment != null && s.Appointment.Doctor != null
                    ? s.Appointment.Doctor.Name
                    : string.Empty))
            .ForMember(d => d.DoctorBranch,
                o => o.MapFrom(s => s.Appointment != null && s.Appointment.Doctor != null
                    ? s.Appointment.Doctor.Branch
                    : string.Empty))
            .ForMember(d => d.AppointmentDate,
                o => o.MapFrom(s => s.Appointment != null ? s.Appointment.DateTime : default));
        CreateMap<CreateMedicalRecordDto, MedicalRecord>();
        CreateMap<UpdateMedicalRecordDto, MedicalRecord>();
    }

    private static string GetStatusText(AppointmentStatus status) => status switch
    {
        AppointmentStatus.Bekliyor => "Bekliyor",
        AppointmentStatus.Tamamlandi => "Tamamlandı",
        AppointmentStatus.IptalEdildi => "İptal Edildi",
        _ => status.ToString()
    };
}
