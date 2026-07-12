"use client";

import { useState } from "react";
import { DollarSign, Play, MoreVertical, Pencil, Copy, Trash2 } from "lucide-react";
import type { ProjectWithClient, Tag, TimeEntryWithRelations } from "@/lib/types";
import {
  continueEntry,
  duplicateEntry,
  deleteEntry,
} from "@/lib/actions/time-entries";
import { entryDurationSeconds, formatDuration, formatTime } from "@/lib/time";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EntryDialog } from "./entry-dialog";

export function EntryRow({
  entry,
  projects,
  tags,
  onContinue,
  onDeleted,
}: {
  entry: TimeEntryWithRelations;
  projects: ProjectWithClient[];
  tags: Tag[];
  onContinue?: (entry: TimeEntryWithRelations) => void;
  onDeleted?: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);

  const duration = entryDurationSeconds(entry.start_time, entry.end_time);

  // Todas as actions abaixo já chamam revalidatePath("/tracker"), que devolve a
  // árvore atualizada. O router.refresh() que existia aqui refazia a página
  // inteira uma segunda vez — era o que deixava o play do card lento.
  async function handleContinue() {
    if (busy) return;
    setBusy(true);
    onContinue?.(entry); // o timer no topo já começa a contar
    await continueEntry(entry.id);
    setBusy(false);
  }
  async function handleDuplicate() {
    if (busy) return;
    setBusy(true);
    await duplicateEntry(entry.id);
    setBusy(false);
  }
  async function handleDelete() {
    if (!confirm("Excluir esta entrada?")) return;
    setBusy(true);
    onDeleted?.(entry.id); // some da lista na hora
    await deleteEntry(entry.id);
    setBusy(false);
  }

  return (
    <>
      <div className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">
            {entry.description || (
              <span className="text-muted-foreground">Sem descrição</span>
            )}
          </p>
          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {entry.project && (
              <span className="flex items-center gap-1">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: entry.project.color }}
                />
                {entry.project.name}
                {entry.project.client && ` · ${entry.project.client.name}`}
              </span>
            )}
            {entry.tags.map((t) => (
              <span
                key={t.id}
                className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-600"
              >
                {t.name}
              </span>
            ))}
          </div>
        </div>

        {entry.billable && (
          <DollarSign className="h-4 w-4 shrink-0 text-[#03A9F4]" />
        )}

        <div className="hidden shrink-0 text-sm text-muted-foreground sm:block">
          {formatTime(entry.start_time)} – {formatTime(entry.end_time!)}
        </div>

        <div className="w-20 shrink-0 text-right font-mono text-sm font-semibold tabular-nums">
          {formatDuration(duration)}
        </div>

        <button
          type="button"
          onClick={handleContinue}
          disabled={busy}
          title="Continuar"
          className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-[#03A9F4]/10 hover:text-[#03A9F4]"
        >
          <Play className="h-4 w-4 fill-current" />
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-slate-100">
            <MoreVertical className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setEditing(true)}>
              <Pencil className="mr-2 h-4 w-4" /> Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDuplicate}>
              <Copy className="mr-2 h-4 w-4" /> Duplicar
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleDelete}
              className="text-red-600 focus:text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {editing && (
        <EntryDialog
          entry={entry}
          projects={projects}
          tags={tags}
          open={editing}
          onOpenChange={setEditing}
        />
      )}
    </>
  );
}
