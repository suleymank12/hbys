import { useEffect, useState } from "react";
import { Sector } from "recharts";
import {
  Users,
  Stethoscope,
  Calendar,
  Clock,
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
import { dashboardService } from "../services/dashboardService";
import type { DashboardStats } from "../types";
import { StatCard, StatCardSkeleton } from "../components/ui/StatCard";

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
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    dashboardService
      .getStats()
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
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
