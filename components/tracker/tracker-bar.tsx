"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Clock, List, DollarSign, Play, Square, Plus } from "lucide-react";
import type { ProjectWithClient, Tag, TimeEntryWithRelations } from "@/lib/types";
import {
  startTimer,
  stopTimer,
  createManualEntry,
} from "@/lib/actions/time-entries";
import { entryDurationSeconds, formatDuration } from "@/lib/time";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ProjectSelect } from "./project-select";
import { TagSelect } from "./tag-select";

function combine(dateStr: string, timeStr: string): string {
  return new Date(`${dateStr}T${timeStr}:00`).toISOString();
}

export function TrackerBar({
  projects,
  tags,
  running,
  onEntryFinished,
  onStarted,
}: {
  projects: ProjectWithClient[];
  tags: Tag[];
  running: TimeEntryWithRelations | null;
  onEntryFinished?: (entry: TimeEntryWithRelations) => void;
  onStarted?: () => void;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"timer" | "manual">("timer");

  const [description, setDescription] = useState(running?.description ?? "");
  const [projectId, setProjectId] = useState<string | null>(
    running?.project_id ?? null
  );
  const [tagIds, setTagIds] = useState<string[]>(
    running?.tags.map((t) => t.id) ?? []
  );
  const [billable, setBillable] = useState(running?.billable ?? false);

  const now = new Date();
  const [date, setDate] = useState(format(now, "yyyy-MM-dd"));
  const [startTime, setStartTime] = useState(format(now, "HH:mm"));
  const [endTime, setEndTime] = useState(format(now, "HH:mm"));

  const [elapsed, setElapsed] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Espelho local do timer: permite reagir na hora ao clique (otimista) e
  // depois reconciliar com o que o servidor devolve.
  const [runningStart, setRunningStart] = useState<string | null>(
    running?.start_time ?? null
  );

  // Sincroniza estado quando o timer ativo muda (após refresh).
  useEffect(() => {
    setRunningStart(running?.start_time ?? null);
    if (running) {
      setDescription(running.description);
      setProjectId(running.project_id);
      setTagIds(running.tags.map((t) => t.id));
      setBillable(running.billable);
    }
  }, [running]);

  // Tick do timer.
  useEffect(() => {
    if (!runningStart) {
      setElapsed(0);
      return;
    }
    const update = () => setElapsed(entryDurationSeconds(runningStart, null));
    update();
    const i = setInterval(update, 1000);
    return () => clearInterval(i);
  }, [runningStart]);

  async function onStart() {
    if (busy) return;
    setBusy(true);
    setError(null);

    // Otimista: o cronômetro já começa a contar.
    const startedAt = new Date().toISOString();
    setRunningStart(startedAt);
    onStarted?.(); // o timer agora pertence à barra, não a um card

    const res = await startTimer({
      description,
      project_id: projectId,
      billable,
      tag_ids: tagIds,
    });
    setBusy(false);

    if (res?.error) {
      setRunningStart(null); // desfaz o otimismo
      setError(res.error);
    }
    // Sem router.refresh(): o revalidatePath da própria action já devolve a
    // árvore atualizada. Chamar os dois refazia todo o trabalho duas vezes.
  }

  async function onStop() {
    if (!running || busy) return;
    setBusy(true);

    // Otimista: para na hora, joga a entrada concluída na lista e limpa.
    setRunningStart(null);
    onEntryFinished?.({ ...running, end_time: new Date().toISOString() });
    setDescription("");
    setProjectId(null);
    setTagIds([]);
    setBillable(false);

    await stopTimer(running.id);
    setBusy(false);
  }

  async function onManualAdd() {
    setBusy(true);
    setError(null);

    const start = combine(date, startTime);
    const end = combine(date, endTime);

    const res = await createManualEntry({
      description,
      project_id: projectId,
      billable,
      tag_ids: tagIds,
      start_time: start,
      end_time: end,
    });
    setBusy(false);
    if (res?.error) {
      setError(res.error);
      return;
    }

    // Otimista: mostra a entrada na lista sem esperar o servidor re-renderizar.
    // O id vem da action; a reconciliação substitui este objeto pelo do servidor.
    onEntryFinished?.({
      id: res?.id ?? crypto.randomUUID(),
      user_id: "",
      created_at: new Date().toISOString(),
      description,
      project_id: projectId,
      start_time: start,
      end_time: end,
      billable,
      project: projects.find((p) => p.id === projectId) ?? null,
      tags: tags.filter((t) => tagIds.includes(t.id)),
    });

    setDescription("");
    setTagIds([]);
    router.refresh();
  }

  const isRunning = runningStart !== null;

  return (
    <div className="rounded-lg border bg-white shadow-sm">
      <div className="flex flex-col gap-3 p-3">
        {/* Título: sempre sozinho no topo. */}
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="No que você está trabalhando?"
          className="w-full border-0 text-base shadow-none focus-visible:ring-0"
          onKeyDown={(e) => {
            if (e.key === "Enter" && mode === "timer") {
              if (isRunning) onStop();
              else onStart();
            }
          }}
        />

        {/* Linha 1: projeto, tags, cifrão e o alternador relógio/lista.
            Sem flex-wrap e com shrink-0 nos ícones: a linha nunca quebra em
            telas estreitas (Safari/PWA); quem cede espaço é só o projeto. */}
        <div className="flex items-center gap-2">
          <ProjectSelect
            projects={projects}
            value={projectId}
            onChange={setProjectId}
            className="min-w-0 flex-1"
          />
          <TagSelect
            tags={tags}
            value={tagIds}
            onChange={setTagIds}
            className="shrink-0"
          />

          <button
            type="button"
            onClick={() => setBillable((b) => !b)}
            title="Faturável"
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-md border",
              billable
                ? "border-[#03A9F4] bg-[#03A9F4]/10 text-[#03A9F4]"
                : "border-input text-muted-foreground hover:bg-accent"
            )}
          >
            <DollarSign className="h-4 w-4" />
          </button>

          <div className="flex shrink-0 overflow-hidden rounded-md border">
            <button
              type="button"
              onClick={() => setMode("timer")}
              title="Modo timer"
              className={cn(
                "flex h-9 w-9 items-center justify-center",
                mode === "timer"
                  ? "bg-[#03A9F4] text-white"
                  : "text-muted-foreground hover:bg-accent"
              )}
            >
              <Clock className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setMode("manual")}
              title="Modo manual"
              className={cn(
                "flex h-9 w-9 items-center justify-center",
                mode === "manual"
                  ? "bg-[#03A9F4] text-white"
                  : "text-muted-foreground hover:bg-accent"
              )}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Linha de baixo: INICIAR à esquerda, cronômetro logo depois. */}
        <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-3">
          {mode === "timer" ? (
            <>
              {isRunning ? (
                <Button
                  onClick={onStop}
                  className="h-10 min-w-28 rounded-md bg-red-500 px-5 font-semibold hover:bg-red-600"
                >
                  <Square className="mr-1.5 h-4 w-4 fill-white" /> PARAR
                </Button>
              ) : (
                <Button
                  onClick={onStart}
                  className="h-10 min-w-28 rounded-md px-5 font-semibold"
                >
                  <Play className="mr-1.5 h-4 w-4 fill-white" /> INICIAR
                </Button>
              )}
              <span className="font-mono text-xl font-semibold tabular-nums text-slate-800">
                {formatDuration(elapsed)}
              </span>
            </>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-28"
              />
              <span className="text-muted-foreground">–</span>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-28"
              />
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-40"
              />
              <Button onClick={onManualAdd} disabled={busy} className="gap-1">
                <Plus className="h-4 w-4" /> Adicionar
              </Button>
            </div>
          )}
        </div>
      </div>
      {error && <p className="px-4 pb-3 text-sm text-red-600">{error}</p>}
    </div>
  );
}
