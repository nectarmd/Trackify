import {
  format,
  isToday,
  isYesterday,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subWeeks,
  subMonths,
} from "date-fns";
import { ptBR } from "date-fns/locale";

/** Duração em segundos entre start e end (ou agora, se end for null). */
export function entryDurationSeconds(
  start: string,
  end: string | null
): number {
  const startMs = new Date(start).getTime();
  const endMs = end ? new Date(end).getTime() : Date.now();
  return Math.max(0, Math.floor((endMs - startMs) / 1000));
}

/** Formata segundos como hh:mm:ss. */
export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return [h, m, sec].map((n) => String(n).padStart(2, "0")).join(":");
}

/** Formata segundos como "1h 23min" (compacto). */
export function formatDurationShort(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h === 0 && m === 0) return "0min";
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

/** Horas decimais (para gráficos). */
export function toHours(totalSeconds: number): number {
  return totalSeconds / 3600;
}

/** Formata um valor em reais (BRL). */
export function formatMoney(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

/** HH:mm no fuso local. */
export function formatTime(date: string | Date): string {
  return format(new Date(date), "HH:mm");
}

/** Rótulo de dia para agrupamento: "Hoje", "Ontem" ou data por extenso. */
export function dayLabel(date: Date): string {
  if (isToday(date)) return "Hoje";
  if (isYesterday(date)) return "Ontem";
  return format(date, "EEEE, d 'de' MMMM", { locale: ptBR });
}

/** Chave de dia (yyyy-MM-dd) no fuso local. */
export function dayKey(date: string | Date): string {
  return format(new Date(date), "yyyy-MM-dd");
}

/** Para inputs datetime-local (yyyy-MM-ddTHH:mm) no fuso local. */
export function toDateTimeLocal(date: string | Date): string {
  return format(new Date(date), "yyyy-MM-dd'T'HH:mm");
}

/** Para input date (yyyy-MM-dd) no fuso local. */
export function toDateInput(date: string | Date): string {
  return format(new Date(date), "yyyy-MM-dd");
}

export type PeriodKey =
  | "this_week"
  | "last_week"
  | "this_month"
  | "last_month"
  | "custom";

/** Retorna [início, fim] de um período nomeado. Semana começa na segunda. */
export function periodRange(
  key: PeriodKey,
  customStart?: string,
  customEnd?: string
): { start: Date; end: Date } {
  const now = new Date();
  const weekOpts = { weekStartsOn: 1 as const };
  switch (key) {
    case "this_week":
      return { start: startOfWeek(now, weekOpts), end: endOfWeek(now, weekOpts) };
    case "last_week": {
      const d = subWeeks(now, 1);
      return { start: startOfWeek(d, weekOpts), end: endOfWeek(d, weekOpts) };
    }
    case "this_month":
      return { start: startOfMonth(now), end: endOfMonth(now) };
    case "last_month": {
      const d = subMonths(now, 1);
      return { start: startOfMonth(d), end: endOfMonth(d) };
    }
    case "custom": {
      const start = customStart ? new Date(customStart + "T00:00:00") : startOfWeek(now, weekOpts);
      const end = customEnd ? new Date(customEnd + "T23:59:59") : endOfWeek(now, weekOpts);
      return { start, end };
    }
  }
}
