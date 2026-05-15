import { useEffect, type ReactNode } from "react";
import { Controller, useForm } from "react-hook-form";
import { User, Phone, Stethoscope } from "lucide-react";
import { Modal } from "../../components/ui/Modal";
import { Button } from "../../components/ui/Button";
import { FormField } from "../../components/ui/FormField";
import { DatePicker } from "../../components/ui/DatePicker";
import { Select } from "../../components/ui/Select";
import { TextArea } from "../../components/ui/TextArea";
import { validateTcKimlik } from "../../utils/tcKimlikValidator";
import {
  BloodType,
  Gender,
  InsuranceType,
  type CreatePatientDto,
  type Patient,
  type UpdatePatientDto,
} from "../../types";

interface FormValues {
  name: string;
  surname: string;
  nationalId: string;
  birthDate: string;
  gender: string;
  bloodType: string;
  insuranceType: string;
  phone: string;
  email: string;
  city: string;
  district: string;
  address: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  allergies: string;
  chronicDiseases: string;
}

interface Props {
  open: boolean;
  patient: Patient | null;
  onClose: () => void;
  onSubmit: (dto: CreatePatientDto | UpdatePatientDto, id?: number) => Promise<void>;
}

const GENDER_OPTIONS = [
  { value: String(Gender.Erkek), label: "Erkek" },
  { value: String(Gender.Kadın), label: "Kadın" },
  { value: String(Gender.Belirtilmemiş), label: "Belirtilmemiş" },
];

const BLOOD_TYPE_OPTIONS = [
  { value: "", label: "— Bilinmiyor —" },
  { value: String(BloodType.ARhPositive), label: "A Rh+" },
  { value: String(BloodType.ARhNegative), label: "A Rh-" },
  { value: String(BloodType.BRhPositive), label: "B Rh+" },
  { value: String(BloodType.BRhNegative), label: "B Rh-" },
  { value: String(BloodType.ABRhPositive), label: "AB Rh+" },
  { value: String(BloodType.ABRhNegative), label: "AB Rh-" },
  { value: String(BloodType.ORhPositive), label: "0 Rh+" },
  { value: String(BloodType.ORhNegative), label: "0 Rh-" },
];

const INSURANCE_OPTIONS = [
  { value: String(InsuranceType.SGK), label: "SGK" },
  { value: String(InsuranceType.Ozel), label: "Özel Sigorta" },
  { value: String(InsuranceType.Yabanci), label: "Yabancı Uyruklu" },
  { value: String(InsuranceType.Yok), label: "Yok" },
];

const nullable = (s: string) => {
  const t = s.trim();
  return t.length === 0 ? null : t;
};

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
      gender: String(patient?.gender ?? Gender.Belirtilmemiş),
      bloodType:
        patient?.bloodType !== null && patient?.bloodType !== undefined
          ? String(patient.bloodType)
          : "",
      insuranceType: String(patient?.insuranceType ?? InsuranceType.SGK),
      phone: patient?.phone ?? "",
      email: patient?.email ?? "",
      city: patient?.city ?? "",
      district: patient?.district ?? "",
      address: patient?.address ?? "",
      emergencyContactName: patient?.emergencyContactName ?? "",
      emergencyContactPhone: patient?.emergencyContactPhone ?? "",
      allergies: patient?.allergies ?? "",
      chronicDiseases: patient?.chronicDiseases ?? "",
    });
  }, [open, patient, reset]);

  const submit = handleSubmit(async (values) => {
    const base = {
      name: values.name.trim(),
      surname: values.surname.trim(),
      birthDate: new Date(values.birthDate).toISOString(),
      gender: Number(values.gender) as Gender,
      bloodType:
        values.bloodType === "" ? null : (Number(values.bloodType) as BloodType),
      insuranceType: Number(values.insuranceType) as InsuranceType,
      phone: values.phone.trim(),
      email: nullable(values.email),
      city: nullable(values.city),
      district: nullable(values.district),
      address: nullable(values.address),
      emergencyContactName: nullable(values.emergencyContactName),
      emergencyContactPhone: nullable(values.emergencyContactPhone),
      allergies: nullable(values.allergies),
      chronicDiseases: nullable(values.chronicDiseases),
    };

    if (isEdit) {
      await onSubmit(base as UpdatePatientDto, patient!.id);
    } else {
      await onSubmit({
        ...base,
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
        isEdit
          ? `Protokol: ${patient!.protocolNumber} — TC: ${patient!.nationalId}`
          : "Yeni hasta kaydı oluşturun. Protokol numarası otomatik atanır."
      }
      size="lg"
    >
      <form
        onSubmit={submit}
        className="space-y-5 max-h-[70vh] overflow-y-auto -mx-6 px-6 pb-1"
      >
        <Section title="Kişisel Bilgiler" icon={<User className="w-4 h-4" />}>
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
                validate: (v) =>
                  isEdit || !v
                    ? true
                    : validateTcKimlik(v) || "Geçersiz TC Kimlik Numarası.",
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Controller
              control={control}
              name="gender"
              render={({ field }) => (
                <Select
                  label="Cinsiyet"
                  value={field.value}
                  onChange={field.onChange}
                  options={GENDER_OPTIONS}
                />
              )}
            />
            <Controller
              control={control}
              name="bloodType"
              render={({ field }) => (
                <Select
                  label="Kan Grubu"
                  value={field.value}
                  onChange={field.onChange}
                  options={BLOOD_TYPE_OPTIONS}
                  placeholder="— Bilinmiyor —"
                />
              )}
            />
            <Controller
              control={control}
              name="insuranceType"
              render={({ field }) => (
                <Select
                  label="Sigorta Türü"
                  value={field.value}
                  onChange={field.onChange}
                  options={INSURANCE_OPTIONS}
                />
              )}
            />
          </div>
        </Section>

        <Section title="İletişim" icon={<Phone className="w-4 h-4" />}>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="İl" {...register("city", { maxLength: 100 })} />
            <FormField label="İlçe" {...register("district", { maxLength: 100 })} />
          </div>

          <TextArea
            label="Açık Adres"
            rows={2}
            placeholder="Mahalle, sokak, no, daire..."
            {...register("address", { maxLength: 500 })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              label="Acil Durumda Aranacak Kişi"
              placeholder="Yakınının adı"
              {...register("emergencyContactName", { maxLength: 200 })}
            />
            <FormField
              label="Acil İletişim Telefonu"
              placeholder="05XX XXX XX XX"
              error={errors.emergencyContactPhone?.message}
              {...register("emergencyContactPhone", {
                maxLength: 15,
                pattern: {
                  value: /^[0-9+()\s-]{7,15}$/,
                  message: "Geçerli bir telefon formatı giriniz.",
                },
              })}
            />
          </div>
        </Section>

        <Section title="Tıbbi Bilgiler" icon={<Stethoscope className="w-4 h-4" />}>
          <TextArea
            label="Alerjiler"
            rows={2}
            placeholder="Bilinen ilaç, gıda veya çevresel alerjiler..."
            {...register("allergies", { maxLength: 1000 })}
          />
          <TextArea
            label="Kronik Hastalıklar"
            rows={2}
            placeholder="Diyabet, hipertansiyon, astım vb."
            {...register("chronicDiseases", { maxLength: 1000 })}
          />
        </Section>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 sticky bottom-0 bg-white">
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

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-medical-700">
        <span className="w-6 h-6 rounded-md bg-medical-50 flex items-center justify-center text-medical-600">
          {icon}
        </span>
        {title}
      </div>
      <div className="space-y-3 pl-1">{children}</div>
    </section>
  );
}
