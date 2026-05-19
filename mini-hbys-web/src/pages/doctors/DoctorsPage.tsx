import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Pencil, Plus, Search, Stethoscope, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "../../components/ui/Button";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { Select } from "../../components/ui/Select";
import { BRANCH_FILTER_OPTIONS } from "../../constants/branches";
import { doctorService } from "../../services/doctorService";
import type { CreateDoctorDto, Doctor, UpdateDoctorDto } from "../../types";
import { DoctorFormModal } from "./DoctorFormModal";
import { useAuth } from "../../contexts/AuthContext";

const DAY_INITIALS = ["Pt", "Sa", "Ça", "Pe", "Cu", "Ct", "Pz"];

function ScheduleSummary({
  schedules,
}: {
  schedules: Doctor["schedules"];
}) {
  if (!schedules || schedules.length === 0) {
    return (
      <span className="text-xs text-slate-400">Mesai tanımlanmamış</span>
    );
  }
  const byDay = new Map(schedules.map((s) => [s.dayOfWeek, s]));
  return (
    <div className="flex flex-col gap-1">
      <div className="inline-flex gap-0.5">
        {[1, 2, 3, 4, 5, 6, 7].map((d) => {
          const active = byDay.has(d);
          return (
            <span
              key={d}
              title={
                active
                  ? `${DAY_INITIALS[d - 1]}: ${byDay.get(d)!.startTime}-${byDay.get(d)!.endTime}`
                  : `${DAY_INITIALS[d - 1]}: çalışmıyor`
              }
              className={`inline-flex items-center justify-center w-6 h-5 rounded text-[10px] font-medium ${
                active
                  ? "bg-medical-100 text-medical-800"
                  : "bg-slate-100 text-slate-400"
              }`}
            >
              {DAY_INITIALS[d - 1]}
            </span>
          );
        })}
      </div>
      <ScheduleHours schedules={schedules} />
    </div>
  );
}

function ScheduleHours({ schedules }: { schedules: Doctor["schedules"] }) {
  // Hours summary: if all working days have identical range, show "08:00-17:00"; otherwise "Değişken".
  const sorted = [...schedules].sort((a, b) => a.dayOfWeek - b.dayOfWeek);
  if (sorted.length === 0) return null;
  const sample = `${sorted[0].startTime}-${sorted[0].endTime}`;
  const allSame = sorted.every(
    (s) => `${s.startTime}-${s.endTime}` === sample
  );
  return (
    <span className="text-[11px] text-slate-500 tabular-nums">
      {allSame ? sample : "Değişken"}
    </span>
  );
}

const BRANCH_COLORS: Record<string, string> = {
  Dahiliye: "bg-blue-100 text-blue-800 ring-1 ring-inset ring-blue-200/60",
  Kardiyoloji: "bg-rose-100 text-rose-800 ring-1 ring-inset ring-rose-200/60",
  Ortopedi: "bg-orange-100 text-orange-800 ring-1 ring-inset ring-orange-200/60",
  Göz: "bg-emerald-100 text-emerald-800 ring-1 ring-inset ring-emerald-200/60",
  KBB: "bg-purple-100 text-purple-800 ring-1 ring-inset ring-purple-200/60",
};

export function DoctorsPage() {
  const { hasRole } = useAuth();
  const canManage = hasRole("Admin");
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Doctor | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Doctor | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setDoctors(await doctorService.list());
    } catch {
      /* interceptor */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLocaleLowerCase("tr-TR");
    return doctors.filter((d) => {
      if (branchFilter && d.branch !== branchFilter) return false;
      if (!q) return true;
      return (
        d.displayName.toLocaleLowerCase("tr-TR").includes(q) ||
        d.name.toLocaleLowerCase("tr-TR").includes(q) ||
        d.email.toLocaleLowerCase("tr-TR").includes(q)
      );
    });
  }, [doctors, search, branchFilter]);

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (d: Doctor) => {
    setEditing(d);
    setModalOpen(true);
  };

  const handleSubmit = async (
    dto: CreateDoctorDto | UpdateDoctorDto,
    id?: number
  ) => {
    try {
      if (id !== undefined) {
        await doctorService.update(id, dto as UpdateDoctorDto);
        toast.success("Doktor güncellendi.");
      } else {
        await doctorService.create(dto as CreateDoctorDto);
        toast.success("Doktor oluşturuldu.");
      }
      setModalOpen(false);
      await load();
    } catch {
      /* interceptor */
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await doctorService.remove(deleteTarget.id);
      toast.success("Doktor silindi.");
      setDeleteTarget(null);
      await load();
    } catch {
      /* interceptor */
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-end gap-3 justify-between">
        <div className="flex flex-col sm:flex-row gap-3 flex-1 max-w-2xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="İsim veya e-posta ile ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 bg-white
                         focus:outline-none focus:ring-2 focus:ring-medical-500/30 focus:border-medical-500
                         transition-colors"
            />
          </div>
          <Select
            value={branchFilter}
            onChange={setBranchFilter}
            options={BRANCH_FILTER_OPTIONS}
            placeholder="Branş"
            className="sm:w-48"
          />
        </div>
        {canManage && (
          <Button onClick={openCreate} icon={<Plus className="w-4 h-4" />}>
            Yeni Doktor Ekle
          </Button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left px-5 py-3 font-medium">Ad</th>
                <th className="text-center px-5 py-3 font-medium">Branş</th>
                <th className="text-left px-5 py-3 font-medium">E-posta</th>
                <th className="text-left px-5 py-3 font-medium">
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                    Mesai
                  </span>
                </th>
                {canManage && (
                  <th className="text-right px-5 py-3 font-medium">İşlemler</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: canManage ? 5 : 4 }).map((__, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-3 w-full max-w-[160px] bg-slate-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={canManage ? 5 : 4} className="px-5 py-16 text-center text-slate-500">
                    <Stethoscope className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    {search || branchFilter
                      ? "Arama kriterleriyle eşleşen doktor bulunamadı."
                      : "Henüz doktor kaydı yok."}
                  </td>
                </tr>
              ) : (
                filtered.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-slate-900">{d.displayName}</div>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span
                        className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-medium tracking-wide ${
                          BRANCH_COLORS[d.branch] || "bg-slate-100 text-slate-800 ring-1 ring-inset ring-slate-200/60"
                        }`}
                      >
                        {d.branch}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">{d.email}</td>
                    <td className="px-5 py-3.5">
                      <ScheduleSummary schedules={d.schedules} />
                    </td>
                    {canManage && (
                      <td className="px-5 py-3 text-right">
                        <div className="inline-flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<Pencil className="w-3.5 h-3.5" />}
                            onClick={() => openEdit(d)}
                          >
                            Düzenle
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-rose-600 hover:bg-rose-50"
                            icon={<Trash2 className="w-3.5 h-3.5" />}
                            onClick={() => setDeleteTarget(d)}
                          >
                            Sil
                          </Button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-slate-100 text-xs text-slate-500 bg-slate-50/50">
            Toplam {filtered.length} doktor
          </div>
        )}
      </div>

      {canManage && (
        <>
          <DoctorFormModal
            open={modalOpen}
            doctor={editing}
            onClose={() => setModalOpen(false)}
            onSubmit={handleSubmit}
            onScheduleUpdated={load}
          />

          <ConfirmDialog
            open={!!deleteTarget}
            title="Doktoru Sil"
            message={
              deleteTarget
                ? `${deleteTarget.displayName} adlı doktoru silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`
                : ""
            }
            loading={deleting}
            onConfirm={confirmDelete}
            onCancel={() => setDeleteTarget(null)}
          />
        </>
      )}
    </div>
  );
}
