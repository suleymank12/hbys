using FluentValidation;
using MiniHBYS.Core.DTOs;

namespace MiniHBYS.Business.Validators;

public class CreateAppointmentValidator : AbstractValidator<CreateAppointmentDto>
{
    public CreateAppointmentValidator()
    {
        RuleFor(x => x.PatientId)
            .GreaterThan(0).WithMessage("Geçerli bir hasta seçilmelidir.");

        RuleFor(x => x.DoctorId)
            .GreaterThan(0).WithMessage("Geçerli bir doktor seçilmelidir.");

        RuleFor(x => x.DateTime)
            .GreaterThan(DateTime.UtcNow).WithMessage("Randevu tarihi geçmiş bir tarih olamaz.");
    }
}
