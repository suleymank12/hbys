import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { Modal } from "../../components/ui/Modal";
import { Button } from "../../components/ui/Button";
import { FormField } from "../../components/ui/FormField";
import { DatePicker } from "../../components/ui/DatePicker";
import type { Patient, CreatePatientDto, UpdatePatientDto } from "../../types";

interface FormValues {
  name: string;
  surname: string;
  nationalId: string;
  birthDate: string;
  phone: string;
  email: string;
}

interface Props {
  open: boolean;
  patient: Patient | null;
  onClose: () => void;
  onSubmit: (dto: CreatePatientDto | UpdatePatientDto, id?: number) => Promise<void>;
}

export function PatientFormModal({ open, patient, onClose, onSubmit }: Props) {
  const isEdit = !!patient;
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>();

  useEffect(() => {
    if (!open) return;
    reset({
      name: patient?.name ?? "",
      surname: patient?.surname ?? "",
      nationalId: patient?.nationalId ?? "",
      birthDate: patient ? patient.birthDate.slice(0, 10) : "",
      phone: patient?.phone ?? "",
      email: patient?.email ?? "",
    });
  }, [open, patient, reset]);

  const submit = handleSubmit(async (values) => {
    const payload = {
      name: values.name.trim(),
      surname: values.surname.trim(),
      birthDate: new Date(values.birthDate).toISOString(),
      phone: values.phone.trim(),
      email: values.email.trim() || null,
    };

    if (isEdit) {
      await onSubmit(payload as UpdatePatientDto, patient!.id);
    } else {
      await onSubmit({
        ...payload,
        nationalId: values.nationalId.trim(),
      } as CreatePatientDto);
    }
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Hasta Bilgilerini Düzenle" : "Yeni Hasta Ekle"}
      description={
        isEdit ? "Mevcut hasta kaydını güncelleyin." : "Yeni hasta kaydı oluşturun."
      }
      size="lg"
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            label="Ad"
            error={errors.name?.message}
            {...register("name", {
              required: "Ad zorunludur.",
              maxLength: { value: 100, message: "En fazla 100 karakter." },
            })}
          />
          <FormField
            label="Soyad"
            error={errors.surname?.message}
            {...register("surname", {
              required: "Soyad zorunludur.",
              maxLength: { value: 100, message: "En fazla 100 karakter." },
            })}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            label="TC Kimlik No"
            placeholder="11 haneli TC kimlik numarası"
            disabled={isEdit}
            hint={isEdit ? "TC kimlik düzenlenemez." : undefined}
            error={errors.nationalId?.message}
            {...register("nationalId", {
              required: isEdit ? false : "TC Kimlik No zorunludur.",
              pattern: {
                value: /^[0-9]{11}$/,
                message: "TC Kimlik tam 11 haneli rakam olmalıdır.",
              },
            })}
          />
          <Controller
            control={control}
            name="birthDate"
            rules={{
              required: "Doğum tarihi zorunludur.",
              validate: (v) =>
                new Date(v) <= new Date() || "Gelecek tarih seçilemez.",
            }}
            render={({ field }) => (
              <DatePicker
                label="Doğum Tarihi"
                value={field.value}
                onChange={field.onChange}
                maxDate={new Date()}
                error={errors.birthDate?.message}
              />
            )}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            label="Telefon"
            placeholder="05XX XXX XX XX"
            error={errors.phone?.message}
            {...register("phone", {
              required: "Telefon zorunludur.",
              maxLength: { value: 15, message: "En fazla 15 karakter." },
            })}
          />
          <FormField
            label="E-posta (opsiyonel)"
            type="email"
            error={errors.email?.message}
            {...register("email", {
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: "Geçerli bir e-posta giriniz.",
              },
            })}
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 mt-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Vazgeç
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {isEdit ? "Güncelle" : "Kaydet"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
