import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import toast from "react-hot-toast";
import { CalendarClock, Stethoscope, User } from "lucide-react";
import { Modal } from "../../components/ui/Modal";
import { Button } from "../../components/ui/Button";
import { TextArea } from "../../components/ui/TextArea";
import { medicalRecordService } from "../../services/medicalRecordService";
import type { Appointment, MedicalRecord } from "../../types";

interface FormValues {
  diagnosis: string;
  notes: string;
}

interface Props {
  open: boolean;
  appointment: Appointment | null;
  onClose: () => void;
  onSaved?: () => void;
  readonly?: boolean;
}

export function MedicalRecordModal({
  open,
  appointment,
  onClose,
  onSaved,
  readonly = false,
}: Props) {
  const [existing, setExisting] = useState<MedicalRecord | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>();

  useEffect(() => {
    if (!open || !appointment) return;
    setLoading(true);
    setExisting(null);
    reset({ diagnosis: "", notes: "" });

    medicalRecordService
      .getByAppointmentId(appointment.id)
      .then((record) => {
        if (record) {
          setExisting(record);
          reset({ diagnosis: record.diagnosis, notes: record.notes ?? "" });
        }
      })
      .finally(() => setLoading(false));
  }, [open, appointment, reset]);

  const isEdit = !!existing;

  const submit = handleSubmit(async (values) => {
    if (!appointment) return;
    try {
      if (isEdit) {
        await medicalRecordService.update(existing!.id, {
          diagnosis: values.diagnosis.trim(),
          notes: values.notes.trim() || null,
        });
        toast.success("Muayene kaydı güncellendi.");
      } else {
        await medicalRecordService.create({
          appointmentId: appointment.id,
          diagnosis: values.diagnosis.trim(),
          notes: values.notes.trim() || null,
        });
        toast.success("Muayene kaydı oluşturuldu.");
      }
      onSaved?.();
      onClose();
    } catch {
      /* interceptor */
    }
  });

  if (!appointment) return null;

  const apptDate = new Date(appointment.dateTime);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        readonly
          ? "Muayene Kaydı Detayı"
          : isEdit
          ? "Muayene Kaydını Düzenle"
          : "Muayene Kaydı Oluştur"
      }
      description={
        readonly
          ? "Muayene kaydı bilgileri."
          : isEdit
          ? "Mevcut kaydı güncelleyin."
          : "Bu randevu için tanı ve notları girin."
      }
      size="lg"
    >
      <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50/60 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          <InfoItem icon={<User className="w-4 h-4" />} label="Hasta" value={appointment.patientFullName} />
          <InfoItem
            icon={<Stethoscope className="w-4 h-4" />}
            label="Doktor"
            value={appointment.doctorName}
            sub={appointment.doctorBranch}
          />
          <InfoItem
            icon={<CalendarClock className="w-4 h-4" />}
            label="Randevu"
            value={format(apptDate, "dd MMM yyyy", { locale: tr })}
            sub={format(apptDate, "HH:mm")}
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          <div className="h-24 rounded-lg bg-slate-100 animate-pulse" />
          <div className="h-20 rounded-lg bg-slate-100 animate-pulse" />
        </div>
      ) : readonly ? (
        <div className="space-y-4">
          <ReadonlyField label="Tanı" value={existing?.diagnosis ?? ""} />
          <ReadonlyField label="Notlar" value={existing?.notes ?? ""} />

          <div className="flex justify-center pt-2 border-t border-slate-100 mt-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Kapat
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <TextArea
            label="Tanı"
            rows={3}
            placeholder="Örn: Üst solunum yolu enfeksiyonu"
            error={errors.diagnosis?.message}
            {...register("diagnosis", {
              required: "Tanı alanı zorunludur.",
              maxLength: { value: 500, message: "En fazla 500 karakter." },
            })}
          />

          <TextArea
            label="Notlar (opsiyonel)"
            rows={5}
            placeholder="Tedavi, öneriler, takip notları..."
            error={errors.notes?.message}
            {...register("notes", {
              maxLength: { value: 2000, message: "En fazla 2000 karakter." },
            })}
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 mt-2">
            <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
              Vazgeç
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {isEdit ? "Güncelle" : "Kaydet"}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}

function ReadonlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs font-medium text-slate-500 mb-1.5">{label}</div>
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm text-slate-800 whitespace-pre-wrap break-words min-h-[3rem]">
        {value.trim() ? value : <span className="text-slate-400">—</span>}
      </div>
    </div>
  );
}

function InfoItem({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="shrink-0 w-7 h-7 rounded-md bg-white border border-slate-200 text-slate-500 flex items-center justify-center">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">
          {label}
        </div>
        <div className="text-sm font-medium text-slate-900 truncate">{value}</div>
        {sub && <div className="text-xs text-slate-500">{sub}</div>}
      </div>
    </div>
  );
}
