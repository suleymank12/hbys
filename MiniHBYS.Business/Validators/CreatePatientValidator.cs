using FluentValidation;
using MiniHBYS.Core.DTOs;
using MiniHBYS.Core.Enums;

namespace MiniHBYS.Business.Validators;

public class CreatePatientValidator : AbstractValidator<CreatePatientDto>
{
    public CreatePatientValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Ad alanı boş olamaz.")
            .MaximumLength(100).WithMessage("Ad en fazla 100 karakter olabilir.");

        RuleFor(x => x.Surname)
            .NotEmpty().WithMessage("Soyad alanı boş olamaz.")
            .MaximumLength(100).WithMessage("Soyad en fazla 100 karakter olabilir.");

        RuleFor(x => x.NationalId)
            .NotEmpty().WithMessage("TC Kimlik No boş olamaz.")
            .Length(11).WithMessage("TC Kimlik No tam 11 hane olmalıdır.")
            .Matches("^[0-9]+$").WithMessage("TC Kimlik No yalnızca rakamlardan oluşmalıdır.")
            .Must(IsValidTcKimlik).WithMessage("Geçersiz TC Kimlik Numarası.");

        RuleFor(x => x.BirthDate)
            .LessThanOrEqualTo(DateTime.UtcNow).WithMessage("Doğum tarihi gelecek bir tarih olamaz.");

        RuleFor(x => x.Gender)
            .IsInEnum().WithMessage("Geçersiz cinsiyet değeri.");

        RuleFor(x => x.InsuranceType)
            .IsInEnum().WithMessage("Geçersiz sigorta türü.");

        RuleFor(x => x.BloodType)
            .IsInEnum().WithMessage("Geçersiz kan grubu.")
            .When(x => x.BloodType.HasValue);

        RuleFor(x => x.Phone)
            .NotEmpty().WithMessage("Telefon alanı boş olamaz.")
            .MaximumLength(15).WithMessage("Telefon en fazla 15 karakter olabilir.");

        RuleFor(x => x.Email)
            .EmailAddress().WithMessage("Geçerli bir e-posta adresi giriniz.")
            .When(x => !string.IsNullOrWhiteSpace(x.Email));

        RuleFor(x => x.EmergencyContactPhone)
            .Matches(@"^[0-9+()\s\-]{7,15}$")
            .WithMessage("Acil iletişim telefonu geçerli bir format olmalıdır.")
            .When(x => !string.IsNullOrWhiteSpace(x.EmergencyContactPhone));

        RuleFor(x => x.City).MaximumLength(100);
        RuleFor(x => x.District).MaximumLength(100);
        RuleFor(x => x.Address).MaximumLength(500);
        RuleFor(x => x.EmergencyContactName).MaximumLength(200);
        RuleFor(x => x.Allergies).MaximumLength(1000);
        RuleFor(x => x.ChronicDiseases).MaximumLength(1000);
    }

    /// <summary>
    /// Türkiye Cumhuriyeti kimlik numarası checksum algoritması:
    /// 1) İlk hane 0 olamaz.
    /// 2) Tek sıralı (1,3,5,7,9) hanelerin toplamının 7 katından çift sıralı
    ///    (2,4,6,8) hanelerin toplamı çıkarılır → mod 10 = 10. hane.
    /// 3) İlk 10 hanenin toplamının mod 10'u = 11. hane.
    /// </summary>
    private static bool IsValidTcKimlik(string? value)
    {
        if (string.IsNullOrEmpty(value) || value.Length != 11) return false;

        var digits = new int[11];
        for (var i = 0; i < 11; i++)
        {
            if (!char.IsDigit(value[i])) return false;
            digits[i] = value[i] - '0';
        }

        if (digits[0] == 0) return false;

        var oddSum = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
        var evenSum = digits[1] + digits[3] + digits[5] + digits[7];

        var tenthCheck = ((oddSum * 7) - evenSum) % 10;
        if (tenthCheck < 0) tenthCheck += 10;
        if (tenthCheck != digits[9]) return false;

        var firstTenSum = 0;
        for (var i = 0; i < 10; i++) firstTenSum += digits[i];
        var eleventhCheck = firstTenSum % 10;
        if (eleventhCheck != digits[10]) return false;

        return true;
    }
}
