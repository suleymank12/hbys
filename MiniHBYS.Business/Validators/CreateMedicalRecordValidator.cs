using FluentValidation;
using MiniHBYS.Core.DTOs;

namespace MiniHBYS.Business.Validators;

public class CreateMedicalRecordValidator : AbstractValidator<CreateMedicalRecordDto>
{
    public CreateMedicalRecordValidator()
    {
        RuleFor(x => x.AppointmentId)
            .GreaterThan(0).WithMessage("Geçerli bir randevu seçilmelidir.");

        RuleFor(x => x.ChiefComplaint)
            .NotEmpty().WithMessage("Başvuru şikayeti alanı boş olamaz.")
            .MaximumLength(1000).WithMessage("Başvuru şikayeti en fazla 1000 karakter olabilir.");

        RuleFor(x => x.History).MaximumLength(2000);
        RuleFor(x => x.Examination).MaximumLength(2000);

        RuleFor(x => x.Diagnosis)
            .NotEmpty().WithMessage("Tanı alanı boş olamaz.")
            .MaximumLength(500).WithMessage("Tanı en fazla 500 karakter olabilir.");

        RuleFor(x => x.TreatmentPlan).MaximumLength(2000);

        When(x => x.VitalSigns is not null, () =>
        {
            RuleFor(x => x.VitalSigns!.BloodPressureSystolic)
                .InclusiveBetween(40, 300).WithMessage("Sistolik tansiyon 40–300 mmHg aralığında olmalıdır.")
                .When(x => x.VitalSigns!.BloodPressureSystolic.HasValue);
            RuleFor(x => x.VitalSigns!.BloodPressureDiastolic)
                .InclusiveBetween(20, 200).WithMessage("Diastolik tansiyon 20–200 mmHg aralığında olmalıdır.")
                .When(x => x.VitalSigns!.BloodPressureDiastolic.HasValue);
            RuleFor(x => x.VitalSigns!.Pulse)
                .InclusiveBetween(20, 250).WithMessage("Nabız 20–250 /dk aralığında olmalıdır.")
                .When(x => x.VitalSigns!.Pulse.HasValue);
            RuleFor(x => x.VitalSigns!.Temperature)
                .InclusiveBetween(25m, 45m).WithMessage("Ateş 25–45 °C aralığında olmalıdır.")
                .When(x => x.VitalSigns!.Temperature.HasValue);
            RuleFor(x => x.VitalSigns!.RespiratoryRate)
                .InclusiveBetween(5, 80).WithMessage("Solunum hızı 5–80 /dk aralığında olmalıdır.")
                .When(x => x.VitalSigns!.RespiratoryRate.HasValue);
            RuleFor(x => x.VitalSigns!.OxygenSaturation)
                .InclusiveBetween(50, 100).WithMessage("SpO2 50–100 % aralığında olmalıdır.")
                .When(x => x.VitalSigns!.OxygenSaturation.HasValue);
            RuleFor(x => x.VitalSigns!.Height)
                .InclusiveBetween(20m, 250m).WithMessage("Boy 20–250 cm aralığında olmalıdır.")
                .When(x => x.VitalSigns!.Height.HasValue);
            RuleFor(x => x.VitalSigns!.Weight)
                .InclusiveBetween(1m, 500m).WithMessage("Kilo 1–500 kg aralığında olmalıdır.")
                .When(x => x.VitalSigns!.Weight.HasValue);
        });
    }
}
