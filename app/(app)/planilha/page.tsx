import { requirePermission } from "@/lib/guard";
import Link from "next/link";
import {
  startOfWeek,
  endOfWeek,
  addWeeks,
  eachDayOfInterval,
  format,
  isToday,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getEntriesInRange } from "@/lib/queries";
import { entryDurationSeconds } from "@/lib/time";
import { PageHeader } from "@/components/layout/page-header";

export const dynamic = "force-dynamic";

const weekOpts = { weekStartsOn: 1 as const };

function parseWeekStart(raw?: string): Date {
  if (raw && /^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return startOfWeek(new Date(raw + "T00:00:00"), weekOpts);
  }
  return startOfWeek(new Date(), weekOpts);
}

function hoursMinutes(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (seconds === 0) return "–";
  return `${h}:${String(m).padStart(2, "0")}`;
}

export default async function PlanilhaPage({
  searchParams,
}: {
  searchParams: Promise<{ start?: string }>;
}) {
  await requirePermission("timesheet");

  const params = await searchParams;
  const weekStart = parseWeekStart(params.start);
  const weekEnd = endOfWeek(weekStart, weekOpts);
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const entries = await getEntriesInRange(
    weekStart.toISOString(),
    weekEnd.toISOString()
  );

  // Agrupa por projeto -> por dia (chave yyyy-MM-dd)
  const rows = new Map<
    string,
    { name: string; color: string; perDay: Map<string, number>; total: number }
  >();
  for (const e of entries) {
    const key = e.project?.id ?? "none";
    if (!rows.has(key)) {
      rows.set(key, {
        name: e.project?.name ?? "Sem projeto",
        color: e.project?.color ?? "#94A3B8",
        perDay: new Map(),
        total: 0,
      });
    }
    const row = rows.get(key)!;
    const dayK = format(new Date(e.start_time), "yyyy-MM-dd");
    const secs = entryDurationSeconds(e.start_time, e.end_time);
    row.perDay.set(dayK, (row.perDay.get(dayK) ?? 0) + secs);
    row.total += secs;
  }

  const rowList = Array.from(rows.values()).sort((a, b) => b.total - a.total);
  const dayTotals = days.map((d) => {
    const dayK = format(d, "yyyy-MM-dd");
    return rowList.reduce((acc, r) => acc + (r.perDay.get(dayK) ?? 0), 0);
  });
  const grandTotal = dayTotals.reduce((a, b) => a + b, 0);

  const prev = format(addWeeks(weekStart, -1), "yyyy-MM-dd");
  const next = format(addWeeks(weekStart, 1), "yyyy-MM-dd");
  const rangeLabel = `${format(weekStart, "d MMM", { locale: ptBR })} – ${format(weekEnd, "d MMM yyyy", { locale: ptBR })}`;

  return (
    <div className="mx-auto max-w-6xl p-6">
      <PageHeader
        title="Planilha de horas"
        description="Some suas horas por projeto ao longo da semana."
      />

      <div className="mb-4 flex items-center gap-2">
        <Link
          href={`/planilha?start=${prev}`}
          className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <Link
          href={`/planilha?start=${next}`}
          className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
        >
          <ChevronRight className="h-4 w-4" />
        </Link>
        <Link
          href="/planilha"
          className="flex h-9 items-center rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 hover:bg-slate-100"
        >
          Hoje
        </Link>
        <span className="ml-2 text-sm font-medium text-slate-700">
          {rangeLabel}
        </span>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-[#F3F4F6] text-slate-600">
              <th className="px-4 py-3 text-left font-medium">Projeto</th>
              {days.map((d) => (
                <th
                  key={d.toISOString()}
                  className={`px-2 py-3 text-center font-medium capitalize ${
                    isToday(d) ? "text-[#03A9F4]" : ""
                  }`}
                >
                  <div>{format(d, "EEE", { locale: ptBR })}</div>
                  <div className="text-xs font-normal text-slate-400">
                    {format(d, "dd/MM")}
                  </div>
                </th>
              ))}
              <th className="px-4 py-3 text-right font-medium">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rowList.length === 0 ? (
              <tr>
                <td
                  colSpan={days.length + 2}
                  className="px-4 py-12 text-center text-muted-foreground"
                >
                  Nenhuma entrada nesta semana.
                </td>
              </tr>
            ) : (
              rowList.map((r) => (
                <tr key={r.name} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-2 font-medium text-slate-800">
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: r.color }}
                      />
                      {r.name}
                    </span>
                  </td>
                  {days.map((d) => {
                    const dayK = format(d, "yyyy-MM-dd");
                    const secs = r.perDay.get(dayK) ?? 0;
                    return (
                      <td
                        key={dayK}
                        className="px-2 py-3 text-center font-mono tabular-nums text-slate-600"
                      >
                        {hoursMinutes(secs)}
                      </td>
                    );
                  })}
                  <td className="px-4 py-3 text-right font-mono font-semibold tabular-nums text-slate-800">
                    {hoursMinutes(r.total)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot>
            <tr className="border-t border-slate-200 bg-[#F3F4F6] font-semibold text-slate-700">
              <td className="px-4 py-3">Total</td>
              {dayTotals.map((secs, i) => (
                <td
                  key={i}
                  className="px-2 py-3 text-center font-mono tabular-nums"
                >
                  {hoursMinutes(secs)}
                </td>
              ))}
              <td className="px-4 py-3 text-right font-mono tabular-nums text-[#03A9F4]">
                {hoursMinutes(grandTotal)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
