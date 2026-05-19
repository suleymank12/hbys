import { useEffect, useRef, useState } from "react";
import { ClipboardList, Pencil, Plus, Search, Trash2, Users } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Button } from "../../components/ui/Button";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { Pagination } from "../../components/ui/Pagination";
import { patientService } from "../../services/patientService";
import type {
  CreatePatientDto,
  Patient,
  UpdatePatientDto,
} from "../../types";
import { PatientFormModal } from "./PatientFormModal";
import { PatientHistoryModal } from "./PatientHistoryModal";
import { useAuth } from "../../contexts/AuthContext";
import { ExportButton } from "../../components/ui/ExportButton";
import { exportService } from "../../services/exportService";

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 300;

export function PatientsPage() {
  const { hasRole } = useAuth();
  const canWrite = hasRole("Admin", "Sekreter");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Patient | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Patient | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [historyTarget, setHistoryTarget] = useState<Patient | null>(null);
  const debounceTimer = useRef<number | null>(null);

  useEffect(() => {
    if (debounceTimer.current !== null) {
      window.clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = window.setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      if (debounceTimer.current !== null) {
        window.clearTimeout(debounceTimer.current);
      }
    };
  }, [search]);

  const load = async (currentPage = page, currentSearch = debouncedSearch) => {
    setLoading(true);
    try {
      const result = await patientService.list({
        page: currentPage,
        pageSize: PAGE_SIZE,
        search: currentSearch || undefined,
      });
      setPatients(result.items);
      setTotalCount(result.totalCount);
      setTotalPages(result.totalPages);
    } catch {
      /* toast handled by interceptor */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(page, debouncedSearch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, debouncedSearch]);

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (p: Patient) => {
    setEditing(p);
    setModalOpen(true);
  };

  const handleSubmit = async (
    dto: CreatePatientDto | UpdatePatientDto,
    id?: number
  ) => {
    try {
      if (id !== undefined) {
        await patientService.update(id, dto as UpdatePatientDto);
        toast.success("Hasta güncellendi.");
      } else {
        await patientService.create(dto as CreatePatientDto);
        toast.success("Hasta oluşturuldu.");
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
      await patientService.remove(deleteTarget.id);
      toast.success("Hasta silindi.");
      setDeleteTarget(null);
      await load();
    } catch {
      /* interceptor */
    } finally {
      setDeleting(false);
    }
  };

  const hasNoResults = !loading && patients.length === 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Protokol, TC veya isim ile ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 bg-white
                       focus:outline-none focus:ring-2 focus:ring-medical-500/30 focus:border-medical-500
                       transition-colors"
          />
        </div>
        {canWrite && (
          <div className="flex items-center gap-2">
            <ExportButton onExport={() => exportService.patients()} />
            <Button onClick={openCreate} icon={<Plus className="w-4 h-4" />}>
              Yeni Hasta Ekle
            </Button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left px-5 py-3 font-medium">Protokol No</th>
                <th className="text-left px-5 py-3 font-medium">Ad Soyad</th>
                <th className="text-left px-5 py-3 font-medium">TC Kimlik No</th>
                <th className="text-left px-5 py-3 font-medium">Doğum Tarihi</th>
                <th className="text-left px-5 py-3 font-medium">Cinsiyet</th>
                <th className="text-left px-5 py-3 font-medium">Telefon</th>
                <th className="text-left px-5 py-3 font-medium">Sigorta</th>
                <th className="text-right px-5 py-3 font-medium">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 8 }).map((__, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-3 w-full max-w-[160px] bg-slate-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : hasNoResults ? (
                <tr>
                  <td colSpan={8} className="px-5 py-16 text-center text-slate-500">
                    <Users className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    {debouncedSearch ? "Aramayla eşleşen hasta bulunamadı." : "Henüz hasta kaydı yok."}
                  </td>
                </tr>
              ) : (
                patients.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5 text-medical-700 font-mono text-xs tabular-nums">
                      {p.protocolNumber}
                    </td>
                    <td className="px-5 py-3.5">
                      <Link
                        to={`/patients/${p.id}`}
                        className="font-medium text-slate-900 hover:text-medical-700 transition-colors"
                      >
                        {p.fullName}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 tabular-nums">
                      {p.nationalId}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">
                      {format(new Date(p.birthDate), "dd MMM yyyy", { locale: tr })}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">{p.genderText}</td>
                    <td className="px-5 py-3.5 text-slate-600 tabular-nums">{p.phone}</td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
                        {p.insuranceTypeText}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="inline-flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-medical-700 hover:bg-medical-50"
                          icon={<ClipboardList className="w-3.5 h-3.5" />}
                          onClick={() => setHistoryTarget(p)}
                        >
                          Geçmiş
                        </Button>
                        {canWrite && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={<Pencil className="w-3.5 h-3.5" />}
                              onClick={() => openEdit(p)}
                            >
                              Düzenle
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-rose-600 hover:bg-rose-50"
                              icon={<Trash2 className="w-3.5 h-3.5" />}
                              onClick={() => setDeleteTarget(p)}
                            >
                              Sil
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && totalCount > 0 && (
          <Pagination
            page={page}
            totalPages={totalPages}
            totalCount={totalCount}
            onPageChange={setPage}
            itemLabel="hasta"
          />
        )}
      </div>

      {canWrite && (
        <PatientFormModal
          open={modalOpen}
          patient={editing}
          onClose={() => setModalOpen(false)}
          onSubmit={handleSubmit}
        />
      )}

      <PatientHistoryModal
        open={!!historyTarget}
        patient={historyTarget}
        onClose={() => setHistoryTarget(null)}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Hastayı Sil"
        message={
          deleteTarget
            ? `${deleteTarget.fullName} adlı hastayı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`
            : ""
        }
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
