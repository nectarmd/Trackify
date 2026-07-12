"use client";

import { useMemo } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { eachDayOfInterval, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Download, Clock, DollarSign } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import type { ProjectWithClient, TimeEntryWithRelations } from "@/lib/types";
import {
  entryDurationSeconds,
  formatDurationShort,
  formatTime,
  toHours,
  type PeriodKey,
} from "@/lib/time";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PERIOD_LABELS: Record<PeriodKey, string> = {
  this_week: "Esta semana",
  last_week: "Semana passada",
  this_month: "Este mês",
  last_month: "Mês passado",
  custom: "Personalizado",
};

const ALL = "all";

function csvEscape(v: string): string {
  if (/[",\n;]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

export function ReportsView({
  entries,
  projects,
  rangeStart,
  rangeEnd,
  period,
  projectFilter,
  customStart,
  customEnd,
}: {
  entries: TimeEntryWithRelations[];
  projects: ProjectWithClient[];
  rangeStart: string;
  rangeEnd: string;
  period: PeriodKey;
  projectFilter: string;
  customStart: string;
  customEnd: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function updateParam(patch: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === "") params.delete(k);
      else params.set(k, v);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  const totalSeconds = useMemo(
    () =>
      entries.reduce(
        (acc, e) => acc + entryDurationSeconds(e.start_time, e.end_time),
        0
      ),
    [entries]
  );
  const billableSeconds = useMemo(
    () =>
      entries
        .filter((e) => e.billable)
        .reduce(
          (acc, e) => acc + entryDurationSeconds(e.start_time, e.end_time),
          0
        ),
    [entries]
  );

  const chartData = useMemo(() => {
    const days = eachDayOfInterval({
      start: new Date(rangeStart),
      end: new Date(rangeEnd),
    });
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
    return days.map((d) => ({
      label: format(d, "dd/MM"),
      horas: Number(toHours(buckets.get(format(d, "yyyy-MM-dd")) ?? 0).toFixed(2)),
    }));
  }, [entries, rangeStart, rangeEnd]);

  const breakdown = useMemo(() => {
    const map = new Map<
      string,
      { name: string; color: string; seconds: number }
    >();
    for (const e of entries) {
      const key = e.project?.id ?? "none";
      if (!map.has(key)) {
        map.set(key, {
          name: e.project?.name ?? "Sem projeto",
          color: e.project?.color ?? "#94A3B8",
          seconds: 0,
        });
      }
      map.get(key)!.seconds += entryDurationSeconds(e.start_time, e.end_time);
    }
    return Array.from(map.values()).sort((a, b) => b.seconds - a.seconds);
  }, [entries]);

  function exportCsv() {
    const header = [
      "Data",
      "Descrição",
      "Projeto",
      "Cliente",
      "Tags",
      "Início",
      "Fim",
      "Duração",
      "Faturável",
    ];
    const rows = entries.map((e) => {
      const seconds = entryDurationSeconds(e.start_time, e.end_time);
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      return [
        format(new Date(e.start_time), "dd/MM/yyyy"),
        e.description,
        e.project?.name ?? "",
        e.project?.client?.name ?? "",
        e.tags.map((t) => t.name).join(", "),
        formatTime(e.start_time),
        e.end_time ? formatTime(e.end_time) : "",
        `${h}:${String(m).padStart(2, "0")}`,
        e.billable ? "Sim" : "Não",
      ]
        .map((c) => csvEscape(String(c)))
        .join(";");
    });
    const csv = [header.join(";"), ...rows].join("\n");
    const blob = new Blob(["﻿" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `trackify-relatorio-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const rangeLabel = `${format(new Date(rangeStart), "d MMM", { locale: ptBR })} – ${format(new Date(rangeEnd), "d MMM yyyy", { locale: ptBR })}`;

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            Período
          </label>
          <Select
            value={period}
            onValueChange={(v) => updateParam({ period: v })}
          >
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(PERIOD_LABELS) as PeriodKey[]).map((k) => (
                <SelectItem key={k} value={k}>
                  {PERIOD_LABELS[k]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {period === "custom" && (
          <>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                De
              </label>
              <Input
                type="date"
                value={customStart}
                onChange={(e) => updateParam({ start: e.target.value })}
                className="w-40"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Até
              </label>
              <Input
                type="date"
                value={customEnd}
                onChange={(e) => updateParam({ end: e.target.value })}
                className="w-40"
              />
            </div>
          </>
        )}

        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            Projeto
          </label>
          <Select
            value={projectFilter}
            onValueChange={(v) => updateParam({ project: v === ALL ? null : v })}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todos os projetos</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="ml-auto">
          <Button variant="outline" onClick={exportCsv} className="gap-1">
            <Download className="h-4 w-4" /> Exportar CSV
          </Button>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">{rangeLabel}</p>

      {/* Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border bg-white p-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" /> Total de horas
          </div>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {formatDurationShort(totalSeconds)}
          </p>
        </div>
        <div className="rounded-lg border bg-white p-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <DollarSign className="h-4 w-4" /> Total faturável
          </div>
          <p className="mt-2 text-3xl font-bold text-[#03A9F4]">
            {formatDurationShort(billableSeconds)}
          </p>
        </div>
      </div>

      {/* Gráfico */}
      <div className="rounded-lg border bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold text-slate-700">
          Horas por dia
        </h2>
        {entries.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            Nenhuma entrada no período selecionado.
          </p>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12, fill: "#64748b" }}
                  tickLine={false}
                  axisLine={{ stroke: "#e2e8f0" }}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "#64748b" }}
                  tickLine={false}
                  axisLine={false}
                  width={40}
                  label={{
                    value: "horas",
                    angle: -90,
                    position: "insideLeft",
                    style: { fontSize: 11, fill: "#94a3b8" },
                  }}
                />
                <Tooltip
                  formatter={(value) => [`${value} h`, "Horas"]}
                  cursor={{ fill: "#f1f5f9" }}
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid #e2e8f0",
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="horas" fill="#03A9F4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Breakdown por projeto */}
      <div className="rounded-lg border bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold text-slate-700">
          Por projeto
        </h2>
        {breakdown.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Sem dados.
          </p>
        ) : (
          <div className="space-y-3">
            {breakdown.map((b) => {
              const pct =
                totalSeconds > 0 ? (b.seconds / totalSeconds) * 100 : 0;
              return (
                <div key={b.name}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: b.color }}
                      />
                      {b.name}
                    </span>
                    <span className="text-muted-foreground">
                      {formatDurationShort(b.seconds)} · {pct.toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, backgroundColor: b.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
