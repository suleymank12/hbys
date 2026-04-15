using FluentValidation;
using MiniHBYS.Core.DTOs;

namespace MiniHBYS.Business.Validators;

public class CreateMedicalRecordValidator : AbstractValidator<CreateMedicalRecordDto>
{
    public CreateMedicalRecordValidator()
    {
        RuleFor(x => x.AppointmentId)
            .GreaterThan(0).WithMessage("Geçerli bir randevu seçilmelidir.");

        RuleFor(x => x.Diagnosis)
            .NotEmpty().WithMessage("Tanı alanı boş olamaz.")
            .MaximumLength(500).WithMessage("Tanı en fazla 500 karakter olabilir.");
    }
}
