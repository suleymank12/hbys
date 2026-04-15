import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  ClipboardPlus,
  Filter,
  Plus,
  XCircle,
} from "lucide-react";
import { format, isSameDay } from "date-fns";
import { tr } from "date-fns/locale";
import toast from "react-hot-toast";
import { Button } from "../../components/ui/Button";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { DatePicker } from "../../components/ui/DatePicker";
import { Select } from "../../components/ui/Select";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { appointmentService } from "../../services/appointmentService";
import { doctorService } from "../../services/doctorService";
import { patientService } from "../../services/patientService";
import {
  AppointmentStatus,
  type Appointment,
  type CreateAppointmentDto,
  type Doctor,
  type Patient,
} from "../../types";
import { AppointmentFormModal } from "./AppointmentFormModal";
import { MedicalRecordModal } from "./MedicalRecordModal";

type StatusFilter = "all" | "pending" | "completed" | "cancelled";

const STATUS_OPTIONS = [
  { value: "all", label: "Tümü" },
  { value: "pending", label: "Bekliyor" },
  { value: "completed", label: "Tamamlandı" },
  { value: "cancelled", label: "İptal Edildi" },
];

export function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  const [filterDate, setFilterDate] = useState("");
  const [filterDoctor, setFilterDoctor] = useState("");
  const [filterStatus, setFilterStatus] = useState<StatusFilter>("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [recordTarget, setRecordTarget] = useState<Appointment | null>(null);
  const [statusTarget, setStatusTarget] = useState<{
    appt: Appointment;
    next: AppointmentStatus;
  } | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [a, p, d] = await Promise.all([
        appointmentService.list(),
        patientService.list(),
        doctorService.list(),
      ]);
      setAppointments(a);
      setPatients(p);
      setDoctors(d);
    } catch {
      /* interceptor */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const doctorOptions = useMemo(
    () => [
      { value: "", label: "Tüm doktorlar" },
      ...doctors.map((d) => ({
        value: String(d.id),
        label: `${d.name} — ${d.branch}`,
      })),
    ],
    [doctors]
  );

  const filtered = useMemo(() => {
    return appointments.filter((a) => {
      if (filterDate) {
        if (!isSameDay(new Date(a.dateTime), new Date(filterDate))) return false;
      }
      if (filterDoctor && String(a.doctorId) !== filterDoctor) return false;
      if (filterStatus !== "all") {
        if (filterStatus === "pending" && a.status !== AppointmentStatus.Bekliyor)
          return false;
        if (
          filterStatus === "completed" &&
          a.status !== AppointmentStatus.Tamamlandi
        )
          return false;
        if (
          filterStatus === "cancelled" &&
          a.status !== AppointmentStatus.IptalEdildi
        )
          return false;
      }
      return true;
    });
  }, [appointments, filterDate, filterDoctor, filterStatus]);

  const handleCreate = async (dto: CreateAppointmentDto) => {
    try {
      await appointmentService.create(dto);
      toast.success("Randevu oluşturuldu.");
      setModalOpen(false);
      await load();
    } catch {
      /* interceptor — conflict message shown via toast */
    }
  };

  const confirmStatusChange = async () => {
    if (!statusTarget) return;
    setStatusLoading(true);
    try {
      await appointmentService.updateStatus(statusTarget.appt.id, statusTarget.next);
      toast.success(
        statusTarget.next === AppointmentStatus.Tamamlandi
          ? "Randevu tamamlandı."
          : "Randevu iptal edildi."
      );
      setStatusTarget(null);
      await load();
    } catch {
      /* interceptor */
    } finally {
      setStatusLoading(false);
    }
  };

  const clearFilters = () => {
    setFilterDate("");
    setFilterDoctor("");
    setFilterStatus("all");
  };
  const hasFilter = !!filterDate || !!filterDoctor || filterStatus !== "all";

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <Filter className="w-4 h-4 text-slate-500" />
            Filtreler
          </div>
          <div className="flex items-center gap-2">
            {hasFilter && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Temizle
              </Button>
            )}
            <Button onClick={() => setModalOpen(true)} icon={<Plus className="w-4 h-4" />}>
              Yeni Randevu
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <DatePicker
            label="Tarih"
            value={filterDate}
            onChange={setFilterDate}
            placeholder="Tüm tarihler"
          />
          <Select
            label="Doktor"
            value={filterDoctor}
            onChange={setFilterDoctor}
            options={doctorOptions}
            placeholder="Tüm doktorlar"
          />
          <Select
            label="Durum"
            value={filterStatus}
            onChange={(v) => setFilterStatus(v as StatusFilter)}
            options={STATUS_OPTIONS}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left px-5 py-3 font-medium">Tarih & Saat</th>
                <th className="text-left px-5 py-3 font-medium">Hasta</th>
                <th className="text-left px-5 py-3 font-medium">Doktor</th>
                <th className="text-center px-5 py-3 font-medium">Durum</th>
                <th className="text-right px-5 py-3 font-medium">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 5 }).map((__, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-3 w-full max-w-[160px] bg-slate-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-16 text-center text-slate-500">
                    <CalendarDays className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    {hasFilter
                      ? "Filtreyle eşleşen randevu bulunamadı."
                      : "Henüz randevu yok."}
                  </td>
                </tr>
              ) : (
                filtered.map((a) => {
                  const dt = new Date(a.dateTime);
                  return (
                    <tr key={a.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-medium text-slate-900 tabular-nums">
                          {format(dt, "dd MMM yyyy", { locale: tr })}
                        </div>
                        <div className="text-xs text-slate-500 tabular-nums">
                          {format(dt, "HH:mm", { locale: tr })}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-700">{a.patientFullName}</td>
                      <td className="px-5 py-3.5">
                        <div className="text-slate-700">{a.doctorName}</div>
                        <div className="text-xs text-slate-500">{a.doctorBranch}</div>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <StatusBadge status={a.status} />
                      </td>
                      <td className="px-5 py-3 text-right">
                        <AppointmentActions
                          appointment={a}
                          onComplete={() =>
                            setStatusTarget({
                              appt: a,
                              next: AppointmentStatus.Tamamlandi,
                            })
                          }
                          onCancel={() =>
                            setStatusTarget({
                              appt: a,
                              next: AppointmentStatus.IptalEdildi,
                            })
                          }
                          onAddRecord={() => setRecordTarget(a)}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {!loading && filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-slate-100 text-xs text-slate-500 bg-slate-50/50">
            Toplam {filtered.length} randevu
          </div>
        )}
      </div>

      <AppointmentFormModal
        open={modalOpen}
        patients={patients}
        doctors={doctors}
        appointments={appointments}
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreate}
      />

      <MedicalRecordModal
        open={!!recordTarget}
        appointment={recordTarget}
        onClose={() => setRecordTarget(null)}
      />

      <ConfirmDialog
        open={!!statusTarget}
        title={
          statusTarget?.next === AppointmentStatus.Tamamlandi
            ? "Randevuyu Tamamla"
            : "Randevuyu İptal Et"
        }
        message={
          statusTarget
            ? statusTarget.next === AppointmentStatus.Tamamlandi
              ? `${statusTarget.appt.patientFullName} adlı hastanın randevusunu tamamlandı olarak işaretlemek istiyor musunuz?`
              : `${statusTarget.appt.patientFullName} adlı hastanın randevusunu iptal etmek istiyor musunuz?`
            : ""
        }
        confirmText={
          statusTarget?.next === AppointmentStatus.Tamamlandi ? "Tamamla" : "İptal Et"
        }
        loading={statusLoading}
        onConfirm={confirmStatusChange}
        onCancel={() => setStatusTarget(null)}
      />
    </div>
  );
}

function AppointmentActions({
  appointment,
  onComplete,
  onCancel,
  onAddRecord,
}: {
  appointment: Appointment;
  onComplete: () => void;
  onCancel: () => void;
  onAddRecord: () => void;
}) {
  if (appointment.status === AppointmentStatus.Bekliyor) {
    return (
      <div className="inline-flex gap-1">
        <Button
          variant="ghost"
          size="sm"
          icon={<CheckCircle2 className="w-3.5 h-3.5" />}
          className="text-emerald-700 hover:bg-emerald-50"
          onClick={onComplete}
        >
          Tamamla
        </Button>
        <Button
          variant="ghost"
          size="sm"
          icon={<XCircle className="w-3.5 h-3.5" />}
          className="text-rose-600 hover:bg-rose-50"
          onClick={onCancel}
        >
          İptal
        </Button>
      </div>
    );
  }
  if (appointment.status === AppointmentStatus.Tamamlandi) {
    return (
      <Button
        variant="ghost"
        size="sm"
        icon={<ClipboardPlus className="w-3.5 h-3.5" />}
        className="text-medical-700 hover:bg-medical-50"
        onClick={onAddRecord}
      >
        Muayene Kaydı
      </Button>
    );
  }
  return <span className="text-xs text-slate-400">—</span>;
}
