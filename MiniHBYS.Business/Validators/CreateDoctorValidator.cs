using FluentValidation;
using MiniHBYS.Core.DTOs;

namespace MiniHBYS.Business.Validators;

public class CreateDoctorValidator : AbstractValidator<CreateDoctorDto>
{
    public CreateDoctorValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Ad alanı boş olamaz.")
            .MaximumLength(100).WithMessage("Ad en fazla 100 karakter olabilir.");

        RuleFor(x => x.Branch)
            .NotEmpty().WithMessage("Branş alanı boş olamaz.")
            .MaximumLength(100).WithMessage("Branş en fazla 100 karakter olabilir.");

        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("E-posta alanı boş olamaz.")
            .EmailAddress().WithMessage("Geçerli bir e-posta adresi giriniz.");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Şifre alanı boş olamaz.")
            .MinimumLength(6).WithMessage("Şifre en az 6 karakter olmalıdır.");
    }
}
