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
 * A barra e a lista são irmãs e recebiam os dados direto do servidor, então a
 * lista só mudava quando o revalidatePath voltava — daí a demora ao parar o
 * timer. Aqui o estado é compartilhado: a entrada aparece na hora e é
 * reconciliada quando o servidor responde.
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

  // Reconcilia com a verdade do servidor quando ela chega.
  useEffect(() => {
    setLocalEntries(entries);
  }, [entries]);

  function addEntry(entry: TimeEntryWithRelations) {
    setLocalEntries((prev) => {
      const rest = prev.filter((e) => e.id !== entry.id);
      return [entry, ...rest];
    });
  }

  return (
    <>
      <TrackerBar
        projects={projects}
        tags={tags}
        running={running}
        onEntryFinished={addEntry}
      />
      <EntryList entries={localEntries} projects={projects} tags={tags} />
    </>
  );
}
