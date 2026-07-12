"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Clock, DollarSign, FolderKanban, ListChecks } from "lucide-react";
import { formatDurationShort } from "@/lib/time";

type ChartPoint = { label: string; horas: number };
type BreakdownItem = { name: string; color: string; seconds: number };

export function DashboardView({
  totalSeconds,
  billableSeconds,
  entryCount,
  projectCount,
  chartData,
  breakdown,
}: {
  totalSeconds: number;
  billableSeconds: number;
  entryCount: number;
  projectCount: number;
  chartData: ChartPoint[];
  breakdown: BreakdownItem[];
}) {
  const cards = [
    {
      icon: Clock,
      label: "Total de horas",
      value: formatDurationShort(totalSeconds),
      accent: "text-slate-900",
    },
    {
      icon: DollarSign,
      label: "Horas faturáveis",
      value: formatDurationShort(billableSeconds),
      accent: "text-[#03A9F4]",
    },
    {
      icon: ListChecks,
      label: "Entradas",
      value: String(entryCount),
      accent: "text-slate-900",
    },
    {
      icon: FolderKanban,
      label: "Projetos ativos",
      value: String(projectCount),
      accent: "text-slate-900",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div
              key={c.label}
              className="rounded-lg border border-slate-200 bg-white p-5"
            >
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Icon className="h-4 w-4" /> {c.label}
              </div>
              <p className={`mt-2 text-2xl font-bold ${c.accent}`}>{c.value}</p>
            </div>
          );
        })}
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold text-slate-700">
          Horas por dia (esta semana)
        </h2>
        {chartData.every((d) => d.horas === 0) ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            Nenhuma entrada nesta semana.
          </p>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e2e8f0"
                />
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

      <div className="rounded-lg border border-slate-200 bg-white p-5">
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
