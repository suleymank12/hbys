import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Filter, History, Search, ShieldCheck } from "lucide-react";
import { DatePicker } from "../components/ui/DatePicker";
import { Select } from "../components/ui/Select";
import { Button } from "../components/ui/Button";
import { auditService } from "../services/auditService";
import type { AuditLog } from "../types";

type ActionFilter =
  | "all"
  | "Create"
  | "Update"
  | "Delete"
  | "StatusChange"
  | "Login"
  | "LoginFailed"
  | "View";

const ACTION_OPTIONS = [
  { value: "all", label: "Tümü" },
  { value: "Create", label: "Oluşturma" },
  { value: "Update", label: "Güncelleme" },
  { value: "Delete", label: "Silme" },
  { value: "StatusChange", label: "Durum Değişikliği" },
  { value: "Login", label: "Giriş" },
  { value: "LoginFailed", label: "Başarısız Giriş" },
  { value: "View", label: "Görüntüleme" },
];

const ACTION_STYLES: Record<string, { row: string; chip: string; label: string }> = {
  Create: {
    row: "border-l-emerald-400 bg-emerald-50/30",
    chip: "bg-emerald-100 text-emerald-800 ring-emerald-200/60",
    label: "Oluşturma",
  },
  Update: {
    row: "border-l-blue-400 bg-blue-50/30",
    chip: "bg-blue-100 text-blue-800 ring-blue-200/60",
    label: "Güncelleme",
  },
  Delete: {
    row: "border-l-rose-400 bg-rose-50/30",
    chip: "bg-rose-100 text-rose-800 ring-rose-200/60",
    label: "Silme",
  },
  StatusChange: {
    row: "border-l-amber-400 bg-amber-50/30",
    chip: "bg-amber-100 text-amber-800 ring-amber-200/60",
    label: "Durum",
  },
  Login: {
    row: "border-l-purple-400 bg-purple-50/30",
    chip: "bg-purple-100 text-purple-800 ring-purple-200/60",
    label: "Giriş",
  },
  LoginFailed: {
    row: "border-l-rose-400 bg-rose-50/30",
    chip: "bg-rose-100 text-rose-800 ring-rose-200/60",
    label: "Başarısız Giriş",
  },
  View: {
    row: "border-l-slate-300 bg-slate-50/30",
    chip: "bg-slate-100 text-slate-700 ring-slate-200/60",
    label: "Görüntüleme",
  },
};

const DEFAULT_STYLE = {
  row: "border-l-slate-300",
  chip: "bg-slate-100 text-slate-700 ring-slate-200/60",
  label: "İşlem",
};

const DETAIL_MAX = 60;

export function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [userSearch, setUserSearch] = useState("");
  const [actionFilter, setActionFilter] = useState<ActionFilter>("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      setLogs(await auditService.recent(100));
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
    const q = userSearch.trim().toLocaleLowerCase("tr-TR");
    const from = fromDate ? new Date(fromDate + "T00:00:00") : null;
    const to = toDate ? new Date(toDate + "T23:59:59.999") : null;
    return logs.filter((l) => {
      if (q && !l.userName.toLocaleLowerCase("tr-TR").includes(q)) return false;
      if (actionFilter !== "all" && l.action !== actionFilter) return false;
      const t = new Date(l.timestamp);
      if (from && t < from) return false;
      if (to && t > to) return false;
      return true;
    });
  }, [logs, userSearch, actionFilter, fromDate, toDate]);

  const clearFilters = () => {
    setUserSearch("");
    setActionFilter("all");
    setFromDate("");
    setToDate("");
  };
  const hasFilter = !!userSearch || actionFilter !== "all" || !!fromDate || !!toDate;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <ShieldCheck className="w-4 h-4 text-medical-600" />
          <span>
            KVKK m.12 uyarınca hasta verisine erişim ve değişiklik denetim kayıtları.
          </span>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-medical-50 border border-medical-100 text-medical-700 text-xs font-medium">
          <History className="w-3.5 h-3.5" />
          Toplam {filtered.length} kayıt
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <Filter className="w-4 h-4 text-slate-500" />
            Filtreler
          </div>
          {hasFilter && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Temizle
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="block">
            <span className="block text-sm font-medium text-slate-700 mb-1.5">Kullanıcı</span>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="İsim ile ara..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 bg-white
                           focus:outline-none focus:ring-2 focus:ring-medical-500/30 focus:border-medical-500
                           transition-colors"
              />
            </div>
          </div>
          <Select
            label="İşlem"
            value={actionFilter}
            onChange={(v) => setActionFilter(v as ActionFilter)}
            options={ACTION_OPTIONS}
          />
          <DatePicker
            label="Başlangıç"
            value={fromDate}
            onChange={setFromDate}
            placeholder="Tüm tarihler"
          />
          <DatePicker
            label="Bitiş"
            value={toDate}
            onChange={setToDate}
            placeholder="Tüm tarihler"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Tarih & Saat</th>
                <th className="text-left px-4 py-3 font-medium">Kullanıcı</th>
                <th className="text-left px-4 py-3 font-medium">Rol</th>
                <th className="text-left px-4 py-3 font-medium">İşlem</th>
                <th className="text-left px-4 py-3 font-medium">Tablo</th>
                <th className="text-left px-4 py-3 font-medium">Kayıt</th>
                <th className="text-left px-4 py-3 font-medium">IP</th>
                <th className="text-left px-4 py-3 font-medium">Detay</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 8 }).map((__, j) => (
                      <td key={j} className="px-4 py-3.5">
                        <div className="h-3 w-full max-w-[140px] bg-slate-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center text-slate-500">
                    <ShieldCheck className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    {hasFilter
                      ? "Filtreyle eşleşen denetim kaydı bulunamadı."
                      : "Henüz denetim kaydı bulunmuyor."}
                  </td>
                </tr>
              ) : (
                filtered.map((l) => {
                  const style = ACTION_STYLES[l.action] ?? DEFAULT_STYLE;
                  const ts = new Date(l.timestamp);
                  const detail = l.details ?? "";
                  const detailOverflow = detail.length > DETAIL_MAX;
                  return (
                    <tr
                      key={l.id}
                      className={`hover:bg-slate-50/70 transition-colors border-l-2 ${style.row}`}
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-slate-900 tabular-nums font-medium">
                          {format(ts, "dd MMM yyyy", { locale: tr })}
                        </div>
                        <div className="text-xs text-slate-500 tabular-nums">
                          {format(ts, "HH:mm:ss")}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        <div className="font-medium">{l.userName}</div>
                        <div className="text-xs text-slate-400">#{l.userId}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 text-xs">{l.userRole}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ring-1 ring-inset ${style.chip}`}
                        >
                          {style.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-700 font-mono text-xs">
                        {l.entityType}
                      </td>
                      <td className="px-4 py-3 text-slate-500 tabular-nums text-xs">
                        {l.entityId > 0 ? `#${l.entityId}` : "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-500 font-mono text-[11px] tabular-nums">
                        {l.ipAddress ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-600 max-w-[280px]">
                        {detail ? (
                          <span className="group relative inline-block align-middle">
                            <span className="cursor-help break-all">
                              {detailOverflow ? detail.slice(0, DETAIL_MAX) + "…" : detail}
                            </span>
                            {detailOverflow && (
                              <span
                                role="tooltip"
                                className="pointer-events-none absolute right-0 top-full mt-1.5 z-20
                                           w-80 max-w-[20rem] px-3 py-2 rounded-md
                                           bg-slate-900 text-white text-xs leading-relaxed shadow-lg
                                           opacity-0 group-hover:opacity-100
                                           transition-opacity duration-150
                                           whitespace-pre-wrap break-words font-mono"
                              >
                                {detail}
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
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
            Son {logs.length} kayıt — {filtered.length} tanesi filtreyle eşleşti
          </div>
        )}
      </div>
    </div>
  );
}
