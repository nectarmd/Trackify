import { eachDayOfInterval, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getEntriesInRange, getProjects } from "@/lib/queries";
import { periodRange, entryDurationSeconds, toHours } from "@/lib/time";
import { PageHeader } from "@/components/layout/page-header";
import { DashboardView } from "@/components/dashboard/dashboard-view";

export const dynamic = "force-dynamic";

export default async function PainelPage() {
  const { start, end } = periodRange("this_week");

  const [entries, projects] = await Promise.all([
    getEntriesInRange(start.toISOString(), end.toISOString()),
    getProjects(false),
  ]);

  const totalSeconds = entries.reduce(
    (acc, e) => acc + entryDurationSeconds(e.start_time, e.end_time),
    0
  );
  const billableSeconds = entries
    .filter((e) => e.billable)
    .reduce((acc, e) => acc + entryDurationSeconds(e.start_time, e.end_time), 0);

  const days = eachDayOfInterval({ start, end });
  const buckets = new Map<string, number>();
  for (const d of days) buckets.set(format(d, "yyyy-MM-dd"), 0);
  for (const e of entries) {
    const key = format(new Date(e.start_time), "yyyy-MM-dd");
    if (buckets.has(key)) {
      buckets.set(
        key,
        buckets.get(key)! + entryDurationSeconds(e.start_time, e.end_time)
      );
    }
  }
  const chartData = days.map((d) => ({
    label: format(d, "EEE", { locale: ptBR }),
    horas: Number(toHours(buckets.get(format(d, "yyyy-MM-dd")) ?? 0).toFixed(2)),
  }));

  const breakdownMap = new Map<
    string,
    { name: string; color: string; seconds: number }
  >();
  for (const e of entries) {
    const key = e.project?.id ?? "none";
    if (!breakdownMap.has(key)) {
      breakdownMap.set(key, {
        name: e.project?.name ?? "Sem projeto",
        color: e.project?.color ?? "#94A3B8",
        seconds: 0,
      });
    }
    breakdownMap.get(key)!.seconds += entryDurationSeconds(
      e.start_time,
      e.end_time
    );
  }
  const breakdown = Array.from(breakdownMap.values()).sort(
    (a, b) => b.seconds - a.seconds
  );

  return (
    <div className="mx-auto max-w-6xl p-6">
      <PageHeader
        title="Painel"
        description="Visão geral do seu tempo nesta semana."
      />
      <DashboardView
        totalSeconds={totalSeconds}
        billableSeconds={billableSeconds}
        entryCount={entries.length}
        projectCount={projects.length}
        chartData={chartData}
        breakdown={breakdown}
      />
    </div>
  );
}
