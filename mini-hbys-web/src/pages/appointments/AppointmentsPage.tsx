import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardPlus,
  Eye,
  Filter,
  LayoutList,
  LogIn,
  CalendarRange,
  Plus,
  Stethoscope,
  UserX,
  XCircle,
} from "lucide-react";
import { format, isSameDay } from "date-fns";
import { tr } from "date-fns/locale";
import toast from "react-hot-toast";
import { Button } from "../../components/ui/Button";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { DatePicker } from "../../components/ui/DatePicker";
import { Pagination } from "../../components/ui/Pagination";
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
import { AppointmentCalendar } from "./AppointmentCalendar";
import { AppointmentDetailModal } from "./AppointmentDetailModal";
import { MedicalRecordModal } from "./MedicalRecordModal";
import { useAuth } from "../../contexts/AuthContext";
import { ExportButton } from "../../components/ui/ExportButton";
import { exportService } from "../../services/exportService";

type StatusFilter =
  | "all"
  | "pending"
  | "arrived"
  | "inExam"
  | "completed"
  | "cancelled"
  | "noShow";
type ViewMode = "list" | "calendar";

const STATUS_OPTIONS = [
  { value: "all", label: "Tümü" },
  { value: "pending", label: "Bekliyor" },
  { value: "arrived", label: "Geldi" },
  { value: "inExam", label: "Muayenede" },
  { value: "completed", label: "Tamamlandı" },
  { value: "cancelled", label: "İptal Edildi" },
  { value: "noShow", label: "Gelmedi" },
];

const STATUS_FILTER_MAP: Record<Exclude<StatusFilter, "all">, AppointmentStatus> = {
  pending: AppointmentStatus.Bekliyor,
  arrived: AppointmentStatus.Geldi,
  inExam: AppointmentStatus.MuayenedeAlindi,
  completed: AppointmentStatus.Tamamlandi,
  cancelled: AppointmentStatus.IptalEdildi,
  noShow: AppointmentStatus.Gelmedi,
};

const TRANSITION_TEXT: Record<
  number,
  { title: string; message: (name: string) => string; confirmLabel: string }
> = {
  [AppointmentStatus.Geldi]: {
    title: "Hasta Geldi",
    message: (name) => `${name} adlı hastayı 'Geldi' olarak işaretlemek istiyor musunuz?`,
    confirmLabel: "Geldi",
  },
  [AppointmentStatus.MuayenedeAlindi]: {
    title: "Muayeneye Al",
    message: (name) => `${name} adlı hastayı muayeneye almak istiyor musunuz?`,
    confirmLabel: "Muayeneye Al",
  },
  [AppointmentStatus.Tamamlandi]: {
    title: "Muayeneyi Tamamla",
    message: (name) => `${name} adlı hastanın muayenesini tamamlamak istiyor musunuz?`,
    confirmLabel: "Tamamla",
  },
  [AppointmentStatus.IptalEdildi]: {
    title: "Randevuyu İptal Et",
    message: (name) => `${name} adlı hastanın randevusunu iptal etmek istiyor musunuz?`,
    confirmLabel: "İptal Et",
  },
  [AppointmentStatus.Gelmedi]: {
    title: "Gelmedi Olarak İşaretle",
    message: (name) =>
      `${name} adlı hastanın randevusunu 'Gelmedi' olarak işaretlemek istiyor musunuz?`,
    confirmLabel: "Gelmedi",
  },
};

const startOfWeekMonday = (d: Date): Date => {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  const day = date.getDay(); // 0=Sun, 1=Mon..6=Sat
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return date;
};

const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

const successToast = (next: AppointmentStatus): string => {
  switch (next) {
    case AppointmentStatus.Geldi:
      return "Hasta 'Geldi' olarak işaretlendi.";
    case AppointmentStatus.MuayenedeAlindi:
      return "Hasta muayeneye alındı.";
    case AppointmentStatus.Tamamlandi:
      return "Muayene tamamlandı.";
    case AppointmentStatus.IptalEdildi:
      return "Randevu iptal edildi.";
    case AppointmentStatus.Gelmedi:
      return "Randevu 'Gelmedi' olarak işaretlendi.";
    default:
      return "Randevu durumu güncellendi.";
  }
};

const formatWeekLabel = (weekStart: Date): string => {
  const end = addDays(weekStart, 4);
  if (weekStart.getMonth() === end.getMonth()) {
    return `${format(weekStart, "d", { locale: tr })}-${format(end, "d MMMM yyyy", {
      locale: tr,
    })}`;
  }
  if (weekStart.getFullYear() === end.getFullYear()) {
    return `${format(weekStart, "d MMM", { locale: tr })} – ${format(
      end,
      "d MMM yyyy",
      { locale: tr }
    )}`;
  }
  return `${format(weekStart, "d MMM yyyy", { locale: tr })} – ${format(
    end,
    "d MMM yyyy",
    { locale: tr }
  )}`;
};

const toDateInputValue = (d: Date) => format(d, "yyyy-MM-dd");
const toTimeInputValue = (d: Date) => format(d, "HH:mm");

const LIST_PAGE_SIZE = 20;
const CALENDAR_FETCH_SIZE = 10000;
const FORM_PATIENT_FETCH_SIZE = 10000;

export function AppointmentsPage() {
  const { user, hasRole } = useAuth();
  const isDoctor = hasRole("Doktor");
  const canCreate = hasRole("Admin", "Sekreter");
  const canSecretarial = hasRole("Admin", "Sekreter");

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  const [filterDate, setFilterDate] = useState("");
  const [filterDoctor, setFilterDoctor] = useState("");
  const [filterStatus, setFilterStatus] = useState<StatusFilter>("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [modalInitial, setModalInitial] = useState<{ date: string; time: string } | null>(
    null
  );
  const [recordTarget, setRecordTarget] = useState<Appointment | null>(null);
  const [statusTarget, setStatusTarget] = useState<{
    appt: Appointment;
    next: AppointmentStatus;
  } | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);

  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeekMonday(new Date()));
  const [detailTarget, setDetailTarget] = useState<Appointment | null>(null);

  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const load = async (
    currentPage = page,
    currentView: ViewMode = viewMode
  ) => {
    setLoading(true);
    try {
      if (isDoctor && user?.doctorId) {
        // Doctor scope is naturally bounded — no pagination needed.
        const a = await appointmentService.listByDoctor(user.doctorId);
        setAppointments(a);
        setTotalCount(a.length);
        setTotalPages(1);
        setPatients([]);
        setDoctors([]);
      } else {
        const fetchSize = currentView === "calendar" ? CALENDAR_FETCH_SIZE : LIST_PAGE_SIZE;
        const fetchPage = currentView === "calendar" ? 1 : currentPage;
        const [aResult, pResult, d] = await Promise.all([
          appointmentService.list({ page: fetchPage, pageSize: fetchSize }),
          patientService.list({ page: 1, pageSize: FORM_PATIENT_FETCH_SIZE }),
          doctorService.list(),
        ]);
        setAppointments(aResult.items);
        setTotalCount(aResult.totalCount);
        setTotalPages(aResult.totalPages);
        setPatients(pResult.items);
        setDoctors(d);
      }
    } catch {
      /* interceptor */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    load(1, viewMode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDoctor, user?.doctorId, viewMode]);

  useEffect(() => {
    if (viewMode !== "list") return;
    load(page, "list");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

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
      if (!isDoctor && filterDoctor && String(a.doctorId) !== filterDoctor) return false;
      if (filterStatus !== "all" && a.status !== STATUS_FILTER_MAP[filterStatus])
        return false;
      return true;
    });
  }, [appointments, filterDate, filterDoctor, filterStatus, isDoctor]);

  const handleCreate = async (dto: CreateAppointmentDto) => {
    try {
      await appointmentService.create(dto);
      toast.success("Randevu oluşturuldu.");
      setModalOpen(false);
      setModalInitial(null);
      await load();
    } catch {
      /* interceptor — conflict message shown via toast */
    }
  };

  const openCreateModal = (initial?: { date: string; time: string }) => {
    setModalInitial(initial ?? null);
    setModalOpen(true);
  };

  const closeCreateModal = () => {
    setModalOpen(false);
    setModalInitial(null);
  };

  const calendarAppointments = useMemo(() => {
    return appointments.filter((a) => {
      if (!isDoctor && filterDoctor && String(a.doctorId) !== filterDoctor) return false;
      if (filterStatus !== "all" && a.status !== STATUS_FILTER_MAP[filterStatus])
        return false;
      return true;
    });
  }, [appointments, filterDoctor, filterStatus, isDoctor]);

  const goToday = () => setWeekStart(startOfWeekMonday(new Date()));
  const prevWeek = () => setWeekStart((d) => addDays(d, -7));
  const nextWeek = () => setWeekStart((d) => addDays(d, 7));

  const confirmStatusChange = async () => {
    if (!statusTarget) return;
    setStatusLoading(true);
    try {
      await appointmentService.updateStatus(statusTarget.appt.id, statusTarget.next);
      toast.success(
        successToast(statusTarget.next)
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
  const hasFilter = !!filterDate || (!isDoctor && !!filterDoctor) || filterStatus !== "all";

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <Filter className="w-4 h-4 text-slate-500" />
            Filtreler
            {isDoctor && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-medical-50 text-medical-700">
                Sadece kendi randevularınız
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {hasFilter && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Temizle
              </Button>
            )}
            <ExportButton
              onExport={() =>
                exportService.appointments(
                  filterDate ? { startDate: filterDate, endDate: filterDate } : {}
                )
              }
            />
            {canCreate && (
              <Button onClick={() => openCreateModal()} icon={<Plus className="w-4 h-4" />}>
                Yeni Randevu
              </Button>
            )}
          </div>
        </div>

        <div
          className={`grid grid-cols-1 gap-3 ${
            viewMode === "calendar"
              ? isDoctor
                ? "sm:grid-cols-1"
                : "sm:grid-cols-2"
              : isDoctor
              ? "sm:grid-cols-2"
              : "sm:grid-cols-3"
          }`}
        >
          {viewMode === "list" && (
            <DatePicker
              label="Tarih"
              value={filterDate}
              onChange={setFilterDate}
              placeholder="Tüm tarihler"
            />
          )}
          {!isDoctor && (
            <Select
              label="Doktor"
              value={filterDoctor}
              onChange={setFilterDoctor}
              options={doctorOptions}
              placeholder="Tüm doktorlar"
            />
          )}
          <Select
            label="Durum"
            value={filterStatus}
            onChange={(v) => setFilterStatus(v as StatusFilter)}
            options={STATUS_OPTIONS}
          />
        </div>
      </div>

      <ViewModeToolbar
        viewMode={viewMode}
        onChange={setViewMode}
        weekStart={weekStart}
        onPrev={prevWeek}
        onNext={nextWeek}
        onToday={goToday}
      />

      {viewMode === "calendar" ? (
        <AppointmentCalendar
          appointments={calendarAppointments}
          weekStart={weekStart}
          canCreate={canCreate}
          onAppointmentClick={(a) => setDetailTarget(a)}
          onSlotClick={(d) => {
            if (!canCreate) return;
            openCreateModal({
              date: toDateInputValue(d),
              time: toTimeInputValue(d),
            });
          }}
        />
      ) : (
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
                      : isDoctor
                      ? "Size atanmış randevu bulunmuyor."
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
                          isDoctor={isDoctor}
                          canSecretarial={canSecretarial}
                          onStatusChange={(next) =>
                            setStatusTarget({ appt: a, next })
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

        {!loading && totalCount > 0 && (
          isDoctor ? (
            <div className="px-5 py-3 border-t border-slate-100 text-xs text-slate-500 bg-slate-50/50">
              Toplam {filtered.length} randevu
            </div>
          ) : (
            <Pagination
              page={page}
              totalPages={totalPages}
              totalCount={totalCount}
              onPageChange={setPage}
              itemLabel="randevu"
            />
          )
        )}
      </div>
      )}

      <AppointmentDetailModal
        appointment={detailTarget}
        onClose={() => setDetailTarget(null)}
      />

      {canCreate && (
        <AppointmentFormModal
          open={modalOpen}
          patients={patients}
          doctors={doctors}
          appointments={appointments}
          onClose={closeCreateModal}
          onSubmit={handleCreate}
          initialDate={modalInitial?.date}
          initialTime={modalInitial?.time}
        />
      )}

      <MedicalRecordModal
        open={!!recordTarget}
        appointment={recordTarget}
        readonly={!isDoctor}
        onClose={() => setRecordTarget(null)}
      />

      <ConfirmDialog
        open={!!statusTarget}
        title={statusTarget ? TRANSITION_TEXT[statusTarget.next]?.title ?? "Randevu Durumu" : ""}
        message={
          statusTarget
            ? TRANSITION_TEXT[statusTarget.next]?.message(
                statusTarget.appt.patientFullName
              ) ?? ""
            : ""
        }
        confirmText={
          statusTarget ? TRANSITION_TEXT[statusTarget.next]?.confirmLabel ?? "Onayla" : ""
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
  isDoctor,
  canSecretarial,
  onStatusChange,
  onAddRecord,
}: {
  appointment: Appointment;
  isDoctor: boolean;
  canSecretarial: boolean;
  onStatusChange: (next: AppointmentStatus) => void;
  onAddRecord: () => void;
}) {
  if (appointment.status === AppointmentStatus.Bekliyor) {
    if (!canSecretarial) return <span className="text-xs text-slate-400">—</span>;
    return (
      <div className="inline-flex gap-1">
        <Button
          variant="ghost"
          size="sm"
          icon={<LogIn className="w-3.5 h-3.5" />}
          className="text-blue-700 hover:bg-blue-50"
          onClick={() => onStatusChange(AppointmentStatus.Geldi)}
        >
          Geldi
        </Button>
        <Button
          variant="ghost"
          size="sm"
          icon={<UserX className="w-3.5 h-3.5" />}
          className="text-slate-600 hover:bg-slate-100"
          onClick={() => onStatusChange(AppointmentStatus.Gelmedi)}
        >
          Gelmedi
        </Button>
        <Button
          variant="ghost"
          size="sm"
          icon={<XCircle className="w-3.5 h-3.5" />}
          className="text-rose-600 hover:bg-rose-50"
          onClick={() => onStatusChange(AppointmentStatus.IptalEdildi)}
        >
          İptal
        </Button>
      </div>
    );
  }

  if (appointment.status === AppointmentStatus.Geldi) {
    if (!isDoctor) return <span className="text-xs text-slate-400">—</span>;
    return (
      <Button
        variant="ghost"
        size="sm"
        icon={<Stethoscope className="w-3.5 h-3.5" />}
        className="text-purple-700 hover:bg-purple-50"
        onClick={() => onStatusChange(AppointmentStatus.MuayenedeAlindi)}
      >
        Muayeneye Al
      </Button>
    );
  }

  if (appointment.status === AppointmentStatus.MuayenedeAlindi) {
    if (!isDoctor) return <span className="text-xs text-slate-400">—</span>;
    return (
      <Button
        variant="ghost"
        size="sm"
        icon={<CheckCircle2 className="w-3.5 h-3.5" />}
        className="text-emerald-700 hover:bg-emerald-50"
        onClick={() => onStatusChange(AppointmentStatus.Tamamlandi)}
      >
        Tamamla
      </Button>
    );
  }

  if (appointment.status === AppointmentStatus.Tamamlandi) {
    return (
      <Button
        variant="ghost"
        size="sm"
        icon={
          isDoctor ? (
            <ClipboardPlus className="w-3.5 h-3.5" />
          ) : (
            <Eye className="w-3.5 h-3.5" />
          )
        }
        className="text-medical-700 hover:bg-medical-50"
        onClick={onAddRecord}
      >
        {isDoctor ? "Muayene Kaydı" : "Görüntüle"}
      </Button>
    );
  }

  return <span className="text-xs text-slate-400">—</span>;
}

function ViewModeToolbar({
  viewMode,
  onChange,
  weekStart,
  onPrev,
  onNext,
  onToday,
}: {
  viewMode: ViewMode;
  onChange: (v: ViewMode) => void;
  weekStart: Date;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 shadow-sm self-start">
        <ToggleButton
          active={viewMode === "list"}
          onClick={() => onChange("list")}
          icon={<LayoutList className="w-3.5 h-3.5" />}
        >
          Liste
        </ToggleButton>
        <ToggleButton
          active={viewMode === "calendar"}
          onClick={() => onChange("calendar")}
          icon={<CalendarRange className="w-3.5 h-3.5" />}
        >
          Takvim
        </ToggleButton>
      </div>

      {viewMode === "calendar" && (
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={onPrev} icon={<ChevronLeft className="w-3.5 h-3.5" />}>
            <span className="hidden sm:inline">Önceki Hafta</span>
          </Button>
          <div className="px-3 py-1.5 rounded-md bg-white border border-slate-200 text-sm font-medium text-slate-700 min-w-[180px] text-center">
            {formatWeekLabel(weekStart)}
          </div>
          <Button variant="secondary" size="sm" onClick={onNext}>
            <span className="hidden sm:inline">Sonraki Hafta</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onToday}>
            Bugün
          </Button>
        </div>
      )}
    </div>
  );
}

function ToggleButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium
        transition-colors
        ${
          active
            ? "bg-medical-600 text-white shadow-sm"
            : "text-slate-600 hover:bg-slate-50"
        }
      `}
    >
      {icon}
      {children}
    </button>
  );
}
