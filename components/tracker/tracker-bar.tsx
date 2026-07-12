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
}: {
  projects: ProjectWithClient[];
  tags: Tag[];
  running: TimeEntryWithRelations | null;
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

  // Sincroniza estado quando o timer ativo muda (após refresh).
  useEffect(() => {
    if (running) {
      setDescription(running.description);
      setProjectId(running.project_id);
      setTagIds(running.tags.map((t) => t.id));
      setBillable(running.billable);
    }
  }, [running]);

  // Tick do timer.
  useEffect(() => {
    if (!running) {
      setElapsed(0);
      return;
    }
    const update = () =>
      setElapsed(entryDurationSeconds(running.start_time, null));
    update();
    const i = setInterval(update, 1000);
    return () => clearInterval(i);
  }, [running]);

  async function onStart() {
    setBusy(true);
    setError(null);
    const res = await startTimer({
      description,
      project_id: projectId,
      billable,
      tag_ids: tagIds,
    });
    setBusy(false);
    if (res?.error) setError(res.error);
    else router.refresh();
  }

  async function onStop() {
    if (!running) return;
    setBusy(true);
    await stopTimer(running.id);
    setBusy(false);
    setDescription("");
    setProjectId(null);
    setTagIds([]);
    setBillable(false);
    router.refresh();
  }

  async function onManualAdd() {
    setBusy(true);
    setError(null);
    const res = await createManualEntry({
      description,
      project_id: projectId,
      billable,
      tag_ids: tagIds,
      start_time: combine(date, startTime),
      end_time: combine(date, endTime),
    });
    setBusy(false);
    if (res?.error) {
      setError(res.error);
      return;
    }
    setDescription("");
    setTagIds([]);
    router.refresh();
  }

  const isRunning = Boolean(running);

  return (
    <div className="rounded-lg border bg-white shadow-sm">
      <div className="flex flex-col gap-3 p-3 lg:flex-row lg:items-center">
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="No que você está trabalhando?"
          className="flex-1 border-0 text-base shadow-none focus-visible:ring-0"
          onKeyDown={(e) => {
            if (e.key === "Enter" && mode === "timer") {
              if (isRunning) onStop();
              else onStart();
            }
          }}
        />

        <div className="flex flex-wrap items-center gap-2">
          <ProjectSelect
            projects={projects}
            value={projectId}
            onChange={setProjectId}
            className="min-w-40"
          />
          <TagSelect tags={tags} value={tagIds} onChange={setTagIds} />

          <button
            type="button"
            onClick={() => setBillable((b) => !b)}
            title="Faturável"
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-md border",
              billable
                ? "border-[#03A9F4] bg-[#03A9F4]/10 text-[#03A9F4]"
                : "border-input text-muted-foreground hover:bg-accent"
            )}
          >
            <DollarSign className="h-4 w-4" />
          </button>

          <div className="mx-1 h-8 w-px bg-border" />

          {mode === "timer" ? (
            <div className="flex items-center gap-3">
              <span className="min-w-24 text-center font-mono text-lg font-semibold tabular-nums">
                {formatDuration(elapsed)}
              </span>
              {isRunning ? (
                <Button
                  onClick={onStop}
                  disabled={busy}
                  className="h-10 min-w-24 rounded-md bg-red-500 px-5 font-semibold hover:bg-red-600"
                >
                  <Square className="mr-1.5 h-4 w-4 fill-white" /> PARAR
                </Button>
              ) : (
                <Button
                  onClick={onStart}
                  disabled={busy}
                  className="h-10 min-w-24 rounded-md px-5 font-semibold"
                >
                  <Play className="mr-1.5 h-4 w-4 fill-white" /> INICIAR
                </Button>
              )}
            </div>
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

          <div className="ml-1 flex overflow-hidden rounded-md border">
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
      </div>
      {error && (
        <p className="px-4 pb-3 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
