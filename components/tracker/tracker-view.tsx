"use client";

import { useEffect, useState } from "react";
import type {
  ProjectWithClient,
  Tag,
  TimeEntryWithRelations,
} from "@/lib/types";
import { TrackerBar } from "./tracker-bar";
import { EntryList } from "./entry-list";

/**
 * A barra e a lista eram irmãs e liam os dados direto do servidor, então
 * qualquer ação só refletia na tela quando o revalidatePath voltava — daí a
 * demora. Aqui o estado é compartilhado e atualizado na hora (otimista);
 * quando a resposta do servidor chega, ela reconcilia.
 */
export function TrackerView({
  projects,
  tags,
  running,
  entries,
}: {
  projects: ProjectWithClient[];
  tags: Tag[];
  running: TimeEntryWithRelations | null;
  entries: TimeEntryWithRelations[];
}) {
  const [localEntries, setLocalEntries] = useState(entries);
  const [localRunning, setLocalRunning] = useState(running);

  useEffect(() => {
    setLocalEntries(entries);
  }, [entries]);

  useEffect(() => {
    setLocalRunning(running);
  }, [running]);

  function addEntry(entry: TimeEntryWithRelations) {
    setLocalEntries((prev) => [entry, ...prev.filter((e) => e.id !== entry.id)]);
  }

  // "Continuar": inicia um novo timer com os dados da entrada clicada.
  function continueFrom(entry: TimeEntryWithRelations) {
    setLocalRunning({
      ...entry,
      id: `temp-${entry.id}`,
      start_time: new Date().toISOString(),
      end_time: null,
    });
  }

  function removeEntry(id: string) {
    setLocalEntries((prev) => prev.filter((e) => e.id !== id));
  }

  return (
    <>
      <TrackerBar
        projects={projects}
        tags={tags}
        running={localRunning}
        onEntryFinished={addEntry}
      />
      <EntryList
        entries={localEntries}
        projects={projects}
        tags={tags}
        onContinue={continueFrom}
        onDeleted={removeEntry}
      />
    </>
  );
}
