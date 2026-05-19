import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { Modal } from "../../components/ui/Modal";
import { Button } from "../../components/ui/Button";
import { FormField } from "../../components/ui/FormField";
import { Select } from "../../components/ui/Select";
import { BRANCH_OPTIONS } from "../../constants/branches";
import {
  DOCTOR_TITLE_OPTIONS,
  type CreateDoctorDto,
  type Doctor,
  type UpdateDoctorDto,
} from "../../types";

interface FormValues {
  title: string;
  name: string;
  branch: string;
  email: string;
  password: string;
}

interface Props {
  open: boolean;
  doctor: Doctor | null;
  onClose: () => void;
  onSubmit: (
    dto: CreateDoctorDto | UpdateDoctorDto,
    id?: number
  ) => Promise<void>;
}

const TITLE_OPTIONS = DOCTOR_TITLE_OPTIONS.map((t) => ({ value: t, label: t }));

export function DoctorFormModal({ open, doctor, onClose, onSubmit }: Props) {
  const isEdit = !!doctor;
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
      title: doctor?.title ?? "",
      name: doctor?.name ?? "",
      branch: doctor?.branch ?? "",
      email: doctor?.email ?? "",
      password: "",
    });
  }, [open, doctor, reset]);

  const submit = handleSubmit(async (values) => {
    const base = {
      title: values.title ? values.title : null,
      name: values.name.trim(),
      branch: values.branch,
      email: values.email.trim(),
    };
    if (isEdit) {
      await onSubmit(base as UpdateDoctorDto, doctor!.id);
    } else {
      await onSubmit({ ...base, password: values.password } as CreateDoctorDto);
    }
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Doktor Bilgilerini Düzenle" : "Yeni Doktor Ekle"}
      description={
        isEdit
          ? "Mevcut doktor kaydını güncelleyin."
          : "Yeni doktor kaydı oluşturun."
      }
      size="lg"
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-4">
          <Controller
            control={control}
            name="title"
            render={({ field }) => (
              <Select
                label="Ünvan"
                value={field.value}
                onChange={field.onChange}
                options={TITLE_OPTIONS}
                placeholder="Seçiniz"
              />
            )}
          />
          <FormField
            label="Ad"
            error={errors.name?.message}
            {...register("name", {
              required: "Ad zorunludur.",
              maxLength: { value: 100, message: "En fazla 100 karakter." },
            })}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Controller
            control={control}
            name="branch"
            rules={{ required: "Branş seçiniz." }}
            render={({ field }) => (
              <Select
                label="Branş"
                value={field.value}
                onChange={field.onChange}
                options={BRANCH_OPTIONS}
                placeholder="Branş seçiniz"
                error={errors.branch?.message}
              />
            )}
          />
          <FormField
            label="E-posta"
            type="email"
            error={errors.email?.message}
            {...register("email", {
              required: "E-posta zorunludur.",
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: "Geçerli bir e-posta giriniz.",
              },
            })}
          />
        </div>

        {!isEdit && (
          <FormField
            label="Şifre"
            type="password"
            placeholder="En az 10 karakter"
            autoComplete="new-password"
            error={errors.password?.message}
            {...register("password", {
              required: "Şifre zorunludur.",
              minLength: { value: 10, message: "En az 10 karakter olmalıdır." },
            })}
          />
        )}

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
