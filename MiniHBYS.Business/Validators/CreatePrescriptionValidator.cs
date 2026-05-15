using FluentValidation;
using MiniHBYS.Core.DTOs;

namespace MiniHBYS.Business.Validators;

public class CreatePrescriptionItemValidator : AbstractValidator<CreatePrescriptionItemDto>
{
    public CreatePrescriptionItemValidator()
    {
        RuleFor(x => x.MedicationName)
            .NotEmpty().WithMessage("İlaç adı zorunludur.")
            .MaximumLength(200);

        RuleFor(x => x.Dosage)
            .NotEmpty().WithMessage("Doz bilgisi zorunludur.")
            .MaximumLength(100);

        RuleFor(x => x.Frequency)
            .NotEmpty().WithMessage("Kullanım sıklığı zorunludur.")
            .MaximumLength(100);

        RuleFor(x => x.Duration)
            .NotEmpty().WithMessage("Kullanım süresi zorunludur.")
            .MaximumLength(100);

        RuleFor(x => x.Instructions).MaximumLength(500);
    }
}

public class CreatePrescriptionValidator : AbstractValidator<CreatePrescriptionDto>
{
    public CreatePrescriptionValidator()
    {
        RuleFor(x => x.MedicalRecordId)
            .GreaterThan(0).WithMessage("Geçerli bir muayene kaydı seçilmelidir.");

        RuleFor(x => x.Items)
            .NotEmpty().WithMessage("Reçete en az bir ilaç içermelidir.");

        RuleForEach(x => x.Items).SetValidator(new CreatePrescriptionItemValidator());
    }
}

public class UpdatePrescriptionValidator : AbstractValidator<UpdatePrescriptionDto>
{
    public UpdatePrescriptionValidator()
    {
        RuleFor(x => x.Items)
            .NotEmpty().WithMessage("Reçete en az bir ilaç içermelidir.");

        RuleForEach(x => x.Items).SetValidator(new CreatePrescriptionItemValidator());
    }
}
