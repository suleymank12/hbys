using FluentValidation;
using MiniHBYS.Core.DTOs;

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
            .Matches("^[0-9]+$").WithMessage("TC Kimlik No yalnızca rakamlardan oluşmalıdır.");

        RuleFor(x => x.BirthDate)
            .LessThanOrEqualTo(DateTime.UtcNow).WithMessage("Doğum tarihi gelecek bir tarih olamaz.");

        RuleFor(x => x.Phone)
            .NotEmpty().WithMessage("Telefon alanı boş olamaz.")
            .MaximumLength(15).WithMessage("Telefon en fazla 15 karakter olabilir.");

        RuleFor(x => x.Email)
            .EmailAddress().WithMessage("Geçerli bir e-posta adresi giriniz.")
            .When(x => !string.IsNullOrWhiteSpace(x.Email));
    }
}
