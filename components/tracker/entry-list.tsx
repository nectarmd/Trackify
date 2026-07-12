"use client";

import { useMemo, useState } from "react";
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  format,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import type { ProjectWithClient, Tag, TimeEntryWithRelations } from "@/lib/types";
import {
  dayKey,
  dayLabel,
  entryDurationSeconds,
  formatDuration,
} from "@/lib/time";
import { cn } from "@/lib/utils";
import { EntryRow } from "./entry-row";

type GroupMode = "day" | "week" | "month";

const MODE_LABELS: Record<GroupMode, string> = {
  day: "Dia",
  week: "Semana",
  month: "Mês",
};

const weekOpts = { weekStartsOn: 1 as const, locale: ptBR };

function groupKeyFor(mode: GroupMode, date: Date): string {
  if (mode === "day") return dayKey(date);
  if (mode === "week")
    return format(startOfWeek(date, weekOpts), "yyyy-'W'II");
  return format(date, "yyyy-MM");
}

function groupLabelFor(mode: GroupMode, date: Date): string {
  if (mode === "day") return dayLabel(date);
  if (mode === "week") {
    const s = startOfWeek(date, weekOpts);
    const e = endOfWeek(date, weekOpts);
    return `${format(s, "d MMM", { locale: ptBR })} – ${format(e, "d MMM yyyy", { locale: ptBR })}`;
  }
  return format(date, "MMMM 'de' yyyy", { locale: ptBR });
}

export function EntryList({
  entries,
  projects,
  tags,
}: {
  entries: TimeEntryWithRelations[];
  projects: ProjectWithClient[];
  tags: Tag[];
}) {
  const [mode, setMode] = useState<GroupMode>("day");

  const { groups, periodTotal, periodLabel } = useMemo(() => {
    const map = new Map<
      string,
      { date: Date; items: TimeEntryWithRelations[]; total: number }
    >();
    for (const e of entries) {
      const d = new Date(e.start_time);
      const key = groupKeyFor(mode, d);
      if (!map.has(key)) map.set(key, { date: d, items: [], total: 0 });
      const g = map.get(key)!;
      g.items.push(e);
      g.total += entryDurationSeconds(e.start_time, e.end_time);
    }

    const now = new Date();
    let rangeStart: Date;
    let rangeEnd: Date;
    let label: string;
    if (mode === "day") {
      rangeStart = startOfWeek(now, weekOpts);
      rangeEnd = endOfWeek(now, weekOpts);
      label = "Total desta semana";
    } else if (mode === "week") {
      rangeStart = startOfWeek(now, weekOpts);
      rangeEnd = endOfWeek(now, weekOpts);
      label = "Total desta semana";
    } else {
      rangeStart = startOfMonth(now);
      rangeEnd = endOfMonth(now);
      label = "Total deste mês";
    }
    const periodTotal = entries
      .filter((e) => {
        const t = new Date(e.start_time).getTime();
        return t >= rangeStart.getTime() && t <= rangeEnd.getTime();
      })
      .reduce(
        (acc, e) => acc + entryDurationSeconds(e.start_time, e.end_time),
        0
      );

    return {
      groups: Array.from(map.values()),
      periodTotal,
      periodLabel: label,
    };
  }, [entries, mode]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 rounded-lg border border-slate-200 bg-white px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          {/* shrink-0: sem isso o flex espremia esta caixa e o overflow-hidden
              cortava o último botão ("Mês"). */}
          <div className="flex shrink-0 overflow-hidden rounded-md border border-slate-200">
            {(Object.keys(MODE_LABELS) as GroupMode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={cn(
                  "whitespace-nowrap px-3 py-1.5 text-sm font-medium transition-colors",
                  mode === m
                    ? "bg-[#03A9F4] text-white"
                    : "text-slate-600 hover:bg-slate-100"
                )}
              >
                {MODE_LABELS[m]}
              </button>
            ))}
          </div>
          <span className="truncate text-sm text-slate-500">{periodLabel}</span>
        </div>
        <span className="shrink-0 font-mono text-lg font-semibold tabular-nums text-slate-800">
          {formatDuration(periodTotal)}
        </span>
      </div>

      {entries.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-12 text-center">
          <p className="text-sm font-medium text-slate-700">
            Nenhuma entrada ainda
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Inicie o timer acima para registrar seu tempo.
          </p>
        </div>
      ) : (
        groups.map((g) => (
          <div
            key={g.date.toISOString() + mode}
            className="overflow-hidden rounded-lg border border-slate-200 bg-white"
          >
            <div className="flex items-center justify-between border-b border-slate-200 bg-[#F3F4F6] px-4 py-2">
              <span className="text-sm font-semibold capitalize text-slate-700">
                {groupLabelFor(mode, g.date)}
              </span>
              <span className="font-mono text-sm font-semibold tabular-nums text-slate-600">
                {formatDuration(g.total)}
              </span>
            </div>
            <div className="divide-y divide-slate-100">
              {g.items.map((e) => (
                <EntryRow
                  key={e.id}
                  entry={e}
                  projects={projects}
                  tags={tags}
                />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
