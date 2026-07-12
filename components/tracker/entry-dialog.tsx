"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import type { ProjectWithClient, Tag, TimeEntryWithRelations } from "@/lib/types";
import { updateEntry } from "@/lib/actions/time-entries";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ProjectSelect } from "./project-select";
import { TagSelect } from "./tag-select";

function combine(dateStr: string, timeStr: string): string {
  return new Date(`${dateStr}T${timeStr}:00`).toISOString();
}

export function EntryDialog({
  entry,
  projects,
  tags,
  open,
  onOpenChange,
}: {
  entry: TimeEntryWithRelations;
  projects: ProjectWithClient[];
  tags: Tag[];
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const router = useRouter();
  const start = new Date(entry.start_time);
  const end = entry.end_time ? new Date(entry.end_time) : new Date();

  const [description, setDescription] = useState(entry.description);
  const [projectId, setProjectId] = useState<string | null>(entry.project_id);
  const [tagIds, setTagIds] = useState<string[]>(entry.tags.map((t) => t.id));
  const [billable, setBillable] = useState(entry.billable);
  const [date, setDate] = useState(format(start, "yyyy-MM-dd"));
  const [startTime, setStartTime] = useState(format(start, "HH:mm"));
  const [endTime, setEndTime] = useState(format(end, "HH:mm"));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    setError(null);
    setSaving(true);
    const res = await updateEntry(entry.id, {
      description,
      project_id: projectId,
      billable,
      tag_ids: tagIds,
      start_time: combine(date, startTime),
      end_time: combine(date, endTime),
    });
    setSaving(false);
    if (res?.error) {
      setError(res.error);
      return;
    }
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar entrada</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Descrição</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="No que você está trabalhando?"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <ProjectSelect
              projects={projects}
              value={projectId}
              onChange={setProjectId}
              className="min-w-48"
            />
            <TagSelect tags={tags} value={tagIds} onChange={setTagIds} />
          </div>
          {/* min-w-0 nas células E w-full nos inputs: sem isso o campo nativo de
              data tem largura mínima maior que a coluna e invade os vizinhos no
              celular. px-2 + text-sm para os três caberem lado a lado. */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <div className="min-w-0 space-y-1.5">
              <Label className="text-xs">Data</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full min-w-0 px-2 text-sm"
              />
            </div>
            <div className="min-w-0 space-y-1.5">
              <Label className="text-xs">Início</Label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full min-w-0 px-2 text-sm"
              />
            </div>
            <div className="min-w-0 space-y-1.5">
              <Label className="text-xs">Fim</Label>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full min-w-0 px-2 text-sm"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="billable"
              checked={billable}
              onCheckedChange={setBillable}
            />
            <Label htmlFor="billable">Faturável</Label>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
