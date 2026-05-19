import { useEffect, useState } from "react";
import { Sector } from "recharts";
import { Link } from "react-router-dom";
import {
  Users,
  Stethoscope,
  Calendar,
  Clock,
  ArrowRight,
  CalendarDays,
  ClipboardList,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { dashboardService } from "../services/dashboardService";
import type {
  DashboardStats,
  RecentMedicalRecord,
  TodayAppointment,
} from "../types";
import { StatCard, StatCardSkeleton } from "../components/ui/StatCard";
import { AppointmentTypeBadge, StatusBadge } from "../components/ui/StatusBadge";

const STATUS_COLORS = {
  Bekliyor: "#f59e0b",
  Tamamlandı: "#10b981",
  "İptal Edildi": "#ef4444",
};

const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  return (
    <Sector
      cx={cx}
      cy={cy}
      innerRadius={innerRadius}
      outerRadius={outerRadius + 8}
      startAngle={startAngle}
      endAngle={endAngle}
      fill={fill}
    />
  );
};

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [todayAppointments, setTodayAppointments] = useState<TodayAppointment[]>([]);
  const [recentRecords, setRecentRecords] = useState<RecentMedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [listsLoading, setListsLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    dashboardService
      .getStats()
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setLoading(false));

    Promise.all([
      dashboardService.getTodayAppointments(),
      dashboardService.getRecentMedicalRecords(5),
    ])
      .then(([appts, records]) => {
        setTodayAppointments(appts);
        setRecentRecords(records);
      })
      .catch(() => {
        setTodayAppointments([]);
        setRecentRecords([]);
      })
      .finally(() => setListsLoading(false));
  }, []);

  const statusData = stats
    ? [
        { name: "Bekliyor", value: stats.pendingAppointments },
        { name: "Tamamlandı", value: stats.completedAppointments },
        { name: "İptal Edildi", value: stats.cancelledAppointments },
      ].filter((d) => d.value > 0)
    : [];

  const branchData = stats?.branchStats ?? [];

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {loading || !stats ? (
          Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatCard label="Toplam Hasta" value={stats.totalPatients} icon={Users} accent="blue" />
            <StatCard label="Toplam Doktor" value={stats.totalDoctors} icon={Stethoscope} accent="emerald" />
            <StatCard label="Bugünkü Randevular" value={stats.todayAppointments} icon={Calendar} accent="amber" />
            <StatCard label="Bekleyen Randevular" value={stats.pendingAppointments} icon={Clock} accent="rose" />
          </>
        )}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Randevu Durumu Dağılımı" loading={loading}>
          {statusData.length === 0 ? (
            <EmptyChart message="Henüz randevu verisi yok." />
          ) : (
            <div
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => {
                setIsHovering(false);
                setActiveIndex(undefined);
              }}
            >
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  {...({
                    activeIndex: activeIndex ?? -1,
                    activeShape: renderActiveShape,
                  } as object)}
                  data={statusData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={95}
                  innerRadius={55}
                  paddingAngle={2}
                  label={
                    isHovering
                      ? false
                      : ({ name, value }) => `${name}: ${value}`
                  }
                  labelLine={!isHovering}
                  isAnimationActive={false}
                  onMouseEnter={(_, i) => setActiveIndex(i)}
                >
                  {statusData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={STATUS_COLORS[entry.name as keyof typeof STATUS_COLORS]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
            </div>
          )}
        </ChartCard>

        <ChartCard title="Branş Bazlı Randevular" loading={loading}>
          {branchData.length === 0 ? (
            <EmptyChart message="Henüz branş verisi yok." />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={branchData} margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="branch" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid #e2e8f0",
                    fontSize: 13,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 13 }} />
                <Bar dataKey="appointmentCount" name="Randevu" fill="#2563eb" radius={[6, 6, 0, 0]} />
                <Bar dataKey="doctorCount" name="Doktor" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <TodayAppointmentsCard
          loading={listsLoading}
          appointments={todayAppointments}
        />
        <RecentMedicalRecordsCard
          loading={listsLoading}
          records={recentRecords}
        />
      </section>
    </div>
  );
}

function TodayAppointmentsCard({
  loading,
  appointments,
}: {
  loading: boolean;
  appointments: TodayAppointment[];
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-medical-600" />
          <h3 className="text-base font-semibold text-slate-900">
            Bugünkü Randevular
          </h3>
        </div>
        <Link
          to="/appointments"
          className="inline-flex items-center gap-1 text-xs font-medium text-medical-700 hover:text-medical-800 transition-colors"
        >
          Tümünü Gör
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {loading ? (
        <div className="px-5 py-4 space-y-2.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-8 bg-slate-100 rounded animate-pulse" />
          ))}
        </div>
      ) : appointments.length === 0 ? (
        <div className="px-5 py-12 text-center text-sm text-slate-500">
          <CalendarDays className="w-10 h-10 mx-auto mb-2 text-slate-300" />
          Bugün randevu yok.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left px-5 py-2.5 font-medium">Saat</th>
                <th className="text-left px-5 py-2.5 font-medium">Hasta</th>
                <th className="text-left px-5 py-2.5 font-medium">Doktor</th>
                <th className="text-center px-5 py-2.5 font-medium">Tip</th>
                <th className="text-center px-5 py-2.5 font-medium">Durum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {appointments.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-5 py-2.5 font-medium text-slate-900 tabular-nums">
                    {format(new Date(a.dateTime), "HH:mm")}
                  </td>
                  <td className="px-5 py-2.5 text-slate-700">
                    {a.patientFullName}
                  </td>
                  <td className="px-5 py-2.5">
                    <div className="text-slate-700">{a.doctorName}</div>
                    <div className="text-xs text-slate-500">{a.doctorBranch}</div>
                  </td>
                  <td className="px-5 py-2.5 text-center">
                    <AppointmentTypeBadge type={a.type} />
                  </td>
                  <td className="px-5 py-2.5 text-center">
                    <StatusBadge status={a.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function RecentMedicalRecordsCard({
  loading,
  records,
}: {
  loading: boolean;
  records: RecentMedicalRecord[];
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-medical-600" />
          <h3 className="text-base font-semibold text-slate-900">
            Son Muayene Kayıtları
          </h3>
        </div>
        <Link
          to="/medical-records"
          className="inline-flex items-center gap-1 text-xs font-medium text-medical-700 hover:text-medical-800 transition-colors"
        >
          Tümünü Gör
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {loading ? (
        <div className="px-5 py-4 space-y-2.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-8 bg-slate-100 rounded animate-pulse" />
          ))}
        </div>
      ) : records.length === 0 ? (
        <div className="px-5 py-12 text-center text-sm text-slate-500">
          <ClipboardList className="w-10 h-10 mx-auto mb-2 text-slate-300" />
          Henüz muayene kaydı yok.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left px-5 py-2.5 font-medium">Tarih</th>
                <th className="text-left px-5 py-2.5 font-medium">Hasta</th>
                <th className="text-left px-5 py-2.5 font-medium">Doktor</th>
                <th className="text-left px-5 py-2.5 font-medium">Tanı</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {records.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-5 py-2.5 text-slate-700 tabular-nums whitespace-nowrap">
                    {format(new Date(r.appointmentDate), "dd MMM yyyy", {
                      locale: tr,
                    })}
                  </td>
                  <td className="px-5 py-2.5 text-slate-700">
                    {r.patientFullName}
                  </td>
                  <td className="px-5 py-2.5">
                    <div className="text-slate-700">{r.doctorName}</div>
                    <div className="text-xs text-slate-500">{r.doctorBranch}</div>
                  </td>
                  <td className="px-5 py-2.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      {r.diagnosisCode && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-mono font-medium bg-indigo-100 text-indigo-800 ring-1 ring-inset ring-indigo-200/60">
                          {r.diagnosisCode}
                        </span>
                      )}
                      <span className="text-slate-700">{r.diagnosis}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ChartCard({
  title,
  loading,
  children,
}: {
  title: string;
  loading: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <h3 className="text-base font-semibold text-slate-900 mb-4">{title}</h3>
      {loading ? (
        <div className="h-[300px] rounded-lg bg-slate-100 animate-pulse" />
      ) : (
        children
      )}
    </div>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="h-[300px] flex items-center justify-center text-sm text-slate-400">
      {message}
    </div>
  );
}
