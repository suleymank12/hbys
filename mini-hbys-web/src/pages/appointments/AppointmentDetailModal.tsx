import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { CalendarDays, User, Stethoscope, Briefcase, Clock } from "lucide-react";
import { Modal } from "../../components/ui/Modal";
import { AppointmentTypeBadge, StatusBadge } from "../../components/ui/StatusBadge";
import type { Appointment } from "../../types";

interface Props {
  appointment: Appointment | null;
  onClose: () => void;
}

export function AppointmentDetailModal({ appointment, onClose }: Props) {
  const open = !!appointment;
  return (
    <Modal
      open={open}
      onClose={onClose}
      icon={CalendarDays}
      title="Randevu Detayı"
      description="Randevu ile ilgili bilgiler aşağıda listelenmiştir."
      size="sm"
    >
      {appointment && (
        <div className="space-y-3">
          <DetailRow
            icon={<CalendarDays className="w-4 h-4 text-medical-600" />}
            label="Tarih"
            value={format(new Date(appointment.dateTime), "dd MMMM yyyy, EEEE", {
              locale: tr,
            })}
          />
          <DetailRow
            icon={<Clock className="w-4 h-4 text-medical-600" />}
            label="Saat"
            value={format(new Date(appointment.dateTime), "HH:mm")}
          />
          <DetailRow
            icon={<User className="w-4 h-4 text-medical-600" />}
            label="Hasta"
            value={appointment.patientFullName}
          />
          <DetailRow
            icon={<Stethoscope className="w-4 h-4 text-medical-600" />}
            label="Doktor"
            value={appointment.doctorName}
          />
          <DetailRow
            icon={<Briefcase className="w-4 h-4 text-medical-600" />}
            label="Branş"
            value={appointment.doctorBranch}
          />
          <div className="flex items-center justify-between pt-3 mt-2 border-t border-slate-100">
            <span className="text-sm text-slate-500">Tip</span>
            <AppointmentTypeBadge type={appointment.type} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">Durum</span>
            <StatusBadge status={appointment.status} />
          </div>
        </div>
      )}
    </Modal>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 w-7 h-7 rounded-md bg-medical-50 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-slate-500">{label}</div>
        <div className="text-sm text-slate-900 font-medium break-words">{value}</div>
      </div>
    </div>
  );
}
