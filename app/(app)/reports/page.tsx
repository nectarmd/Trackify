import { getEntriesInRange, getProjects } from "@/lib/queries";
import { periodRange, type PeriodKey } from "@/lib/time";
import { PageHeader } from "@/components/layout/page-header";
import { ReportsView } from "@/components/reports/reports-view";

export const dynamic = "force-dynamic";

const VALID_PERIODS: PeriodKey[] = [
  "this_week",
  "last_week",
  "this_month",
  "last_month",
  "custom",
];

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{
    period?: string;
    project?: string;
    start?: string;
    end?: string;
  }>;
}) {
  const params = await searchParams;
  const period: PeriodKey = VALID_PERIODS.includes(params.period as PeriodKey)
    ? (params.period as PeriodKey)
    : "this_week";
  const customStart = params.start ?? "";
  const customEnd = params.end ?? "";
  const projectFilter = params.project ?? "all";

  const { start, end } = periodRange(period, customStart, customEnd);

  const [allEntries, projects] = await Promise.all([
    getEntriesInRange(start.toISOString(), end.toISOString()),
    getProjects(true),
  ]);

  const entries =
    projectFilter === "all"
      ? allEntries
      : allEntries.filter((e) => e.project_id === projectFilter);

  return (
    <div className="mx-auto max-w-5xl p-6">
      <PageHeader
        title="Relatórios"
        description="Analise como você usou seu tempo."
      />
      <ReportsView
        entries={entries}
        projects={projects}
        rangeStart={start.toISOString()}
        rangeEnd={end.toISOString()}
        period={period}
        projectFilter={projectFilter}
        customStart={customStart}
        customEnd={customEnd}
      />
    </div>
  );
}
