"use client";

import { useState } from "react";
import type {
  ProjectWithClient,
  Tag,
  TimeEntryWithRelations,
  WorkspaceMember,
} from "@/lib/types";
import { stopCurrentTimer } from "@/lib/actions/time-entries";
import { TrackerBar } from "./tracker-bar";
import { EntryList } from "./entry-list";

/**
 * Estado compartilhado entre a barra e a lista: as ações refletem na tela na
 * hora (otimista) e reconciliam quando o servidor responde.
 *
 * `startedFromRowId` guarda DE ONDE o timer foi acionado. Se veio de um card,
 * o pause aparece naquele próprio card e a barra do topo fica ociosa; se veio
 * da barra, o controle fica só lá em cima.
 */
export function TrackerView({
  projects,
  tags,
  running,
  entries,
  members = [],
  currentUserId = "",
  isAdmin = false,
}: {
  projects: ProjectWithClient[];
  tags: Tag[];
  running: TimeEntryWithRelations | null;
  entries: TimeEntryWithRelations[];
  members?: WorkspaceMember[];
  currentUserId?: string;
  isAdmin?: boolean;
}) {
  const [localEntries, setLocalEntries] = useState(entries);
  const [localRunning, setLocalRunning] = useState(running);
  const [startedFromRowId, setStartedFromRowId] = useState<string | null>(null);

  // Reconciliação com o servidor DURANTE a renderização — não num efeito.
  // Sincronizar prop→estado via useEffect provoca um render extra em cascata
  // (React re-renderiza, roda o efeito, muda o estado, re-renderiza de novo).
  // Comparar com o valor anterior aqui resolve num único passe.
  const [prevEntries, setPrevEntries] = useState(entries);
  if (prevEntries !== entries) {
    setPrevEntries(entries);
    setLocalEntries(entries);
  }

  const [prevRunning, setPrevRunning] = useState(running);
  if (prevRunning !== running) {
    setPrevRunning(running);
    setLocalRunning(running);
    // Sem timer ativo no servidor, não há origem a lembrar.
    if (!running) setStartedFromRowId(null);
  }

  function addEntry(entry: TimeEntryWithRelations) {
    setLocalEntries((prev) => [entry, ...prev.filter((e) => e.id !== entry.id)]);
  }

  function removeEntry(id: string) {
    setLocalEntries((prev) => prev.filter((e) => e.id !== id));
  }

  // "Continuar" a partir de um card: o timer passa a rodar naquele card.
  function continueFrom(entry: TimeEntryWithRelations) {
    setStartedFromRowId(entry.id);
    setLocalRunning({
      ...entry,
      id: `temp-${entry.id}`,
      start_time: new Date().toISOString(),
      end_time: null,
    });
  }

  // Pause acionado no próprio card.
  async function stopFromRow() {
    const current = localRunning;
    setStartedFromRowId(null);
    setLocalRunning(null);
    if (current) {
      addEntry({ ...current, end_time: new Date().toISOString() });
    }
    await stopCurrentTimer();
  }

  return (
    <>
      <TrackerBar
        projects={projects}
        tags={tags}
        // Se o timer nasceu num card, a barra do topo não o assume.
        running={startedFromRowId ? null : localRunning}
        members={members}
        currentUserId={currentUserId}
        isAdmin={isAdmin}
        onEntryFinished={addEntry}
        onStarted={() => setStartedFromRowId(null)}
      />
      <EntryList
        entries={localEntries}
        projects={projects}
        tags={tags}
        runningRowId={startedFromRowId}
        runningStart={localRunning?.start_time ?? null}
        onContinue={continueFrom}
        onStopRow={stopFromRow}
        onDeleted={removeEntry}
      />
    </>
  );
}
