import { requirePermission } from "@/lib/guard";
import Link from "next/link";
import {
  startOfWeek,
  endOfWeek,
  addWeeks,
  eachDayOfInterval,
  format,
  isToday,
  differenceInMinutes,
  startOfDay,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getEntriesInRange } from "@/lib/queries";
import { entryDurationSeconds, formatDuration } from "@/lib/time";
import { PageHeader } from "@/components/layout/page-header";

export const dynamic = "force-dynamic";

const weekOpts = { weekStartsOn: 1 as const };
const HOUR_HEIGHT = 44; // px por hora
const DAY_HEIGHT = HOUR_HEIGHT * 24;

function parseWeekStart(raw?: string): Date {
  if (raw && /^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return startOfWeek(new Date(raw + "T00:00:00"), weekOpts);
  }
  return startOfWeek(new Date(), weekOpts);
}

export default async function CalendarioPage({
  searchParams,
}: {
  searchParams: Promise<{ start?: string }>;
}) {
  await requirePermission("calendar");

  const params = await searchParams;
  const weekStart = parseWeekStart(params.start);
  const weekEnd = endOfWeek(weekStart, weekOpts);
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const entries = await getEntriesInRange(
    weekStart.toISOString(),
    weekEnd.toISOString()
  );

  const prev = format(addWeeks(weekStart, -1), "yyyy-MM-dd");
  const next = format(addWeeks(weekStart, 1), "yyyy-MM-dd");
  const rangeLabel = `${format(weekStart, "d MMM", { locale: ptBR })} – ${format(weekEnd, "d MMM yyyy", { locale: ptBR })}`;

  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="mx-auto max-w-6xl p-6">
      <PageHeader
        title="Calendário"
        description="Visualize suas entradas de tempo ao longo da semana."
      />

      <div className="mb-4 flex items-center gap-2">
        <Link
          href={`/calendario?start=${prev}`}
          className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <Link
          href={`/calendario?start=${next}`}
          className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
        >
          <ChevronRight className="h-4 w-4" />
        </Link>
        <Link
          href="/calendario"
          className="flex h-9 items-center rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 hover:bg-slate-100"
        >
          Hoje
        </Link>
        <span className="ml-2 text-sm font-medium text-slate-700">
          {rangeLabel}
        </span>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        {/* Cabeçalho dos dias */}
        <div className="flex border-b border-slate-200 bg-[#F3F4F6]">
          <div className="w-14 shrink-0 border-r border-slate-200" />
          {days.map((d) => {
            const total = entries
              .filter(
                (e) =>
                  format(new Date(e.start_time), "yyyy-MM-dd") ===
                  format(d, "yyyy-MM-dd")
              )
              .reduce(
                (acc, e) => acc + entryDurationSeconds(e.start_time, e.end_time),
                0
              );
            return (
              <div
                key={d.toISOString()}
                className="flex-1 border-r border-slate-200 px-2 py-2 text-center last:border-r-0"
              >
                <div
                  className={`text-xs font-semibold capitalize ${
                    isToday(d) ? "text-[#03A9F4]" : "text-slate-600"
                  }`}
                >
                  {format(d, "EEE", { locale: ptBR })} {format(d, "dd/MM")}
                </div>
                <div className="mt-0.5 font-mono text-xs tabular-nums text-slate-500">
                  {total > 0 ? formatDuration(total) : "0:00:00"}
                </div>
              </div>
            );
          })}
        </div>

        {/* Grade de horas */}
        <div className="flex max-h-[70vh] overflow-y-auto">
          {/* Coluna de horas */}
          <div className="w-14 shrink-0 border-r border-slate-200">
            {hours.map((h) => (
              <div
                key={h}
                style={{ height: HOUR_HEIGHT }}
                className="relative border-b border-slate-100"
              >
                <span className="absolute -top-2 right-1 text-[10px] text-slate-400">
                  {String(h).padStart(2, "0")}:00
                </span>
              </div>
            ))}
          </div>

          {/* Colunas dos dias */}
          {days.map((d) => {
            const dayEntries = entries.filter(
              (e) =>
                format(new Date(e.start_time), "yyyy-MM-dd") ===
                format(d, "yyyy-MM-dd")
            );
            const dayStart = startOfDay(d);
            return (
              <div
                key={d.toISOString()}
                className="relative flex-1 border-r border-slate-200 last:border-r-0"
                style={{ height: DAY_HEIGHT }}
              >
                {hours.map((h) => (
                  <div
                    key={h}
                    style={{ height: HOUR_HEIGHT }}
                    className="border-b border-slate-100"
                  />
                ))}
                {dayEntries.map((e) => {
                  const startMin = Math.max(
                    0,
                    differenceInMinutes(new Date(e.start_time), dayStart)
                  );
                  const durMin = Math.max(
                    15,
                    Math.round(
                      entryDurationSeconds(e.start_time, e.end_time) / 60
                    )
                  );
                  const top = (startMin / 60) * HOUR_HEIGHT;
                  const height = Math.min(
                    (durMin / 60) * HOUR_HEIGHT,
                    DAY_HEIGHT - top
                  );
                  const color = e.project?.color ?? "#03A9F4";
                  return (
                    <div
                      key={e.id}
                      className="absolute left-0.5 right-0.5 overflow-hidden rounded-md px-1.5 py-1 text-[11px] leading-tight text-white shadow-sm"
                      style={{
                        top,
                        height,
                        backgroundColor: color,
                      }}
                      title={`${e.description || "Sem descrição"} · ${formatDuration(
                        entryDurationSeconds(e.start_time, e.end_time)
                      )}`}
                    >
                      <div className="truncate font-medium">
                        {e.description || "Sem descrição"}
                      </div>
                      {e.project && (
                        <div className="truncate opacity-90">
                          {e.project.name}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
