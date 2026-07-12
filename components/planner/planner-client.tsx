"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { format, startOfWeek, endOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, MoreVertical, Pencil, Trash2, CalendarRange } from "lucide-react";
import type { PlanWithProject, ProjectWithClient } from "@/lib/types";
import { createPlan, updatePlan, deletePlan } from "@/lib/actions/plans";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const NONE = "none";
const weekOpts = { weekStartsOn: 1 as const, locale: ptBR };

export function PlannerClient({
  plans,
  projects,
}: {
  plans: PlanWithProject[];
  projects: ProjectWithClient[];
}) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PlanWithProject | null>(null);
  const [title, setTitle] = useState("");
  const [projectId, setProjectId] = useState<string>(NONE);
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const groups = useMemo(() => {
    const map = new Map<string, { label: string; items: PlanWithProject[] }>();
    for (const p of plans) {
      const d = new Date(p.start_date + "T00:00:00");
      const ws = startOfWeek(d, weekOpts);
      const key = format(ws, "yyyy-'W'II");
      if (!map.has(key)) {
        const we = endOfWeek(d, weekOpts);
        map.set(key, {
          label: `${format(ws, "d MMM", { locale: ptBR })} – ${format(we, "d MMM yyyy", { locale: ptBR })}`,
          items: [],
        });
      }
      map.get(key)!.items.push(p);
    }
    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([, v]) => v);
  }, [plans]);

  function openCreate() {
    setEditing(null);
    setTitle("");
    setProjectId(NONE);
    setStartDate(format(new Date(), "yyyy-MM-dd"));
    setEndDate(format(new Date(), "yyyy-MM-dd"));
    setNotes("");
    setError(null);
    setDialogOpen(true);
  }
  function openEdit(p: PlanWithProject) {
    setEditing(p);
    setTitle(p.title);
    setProjectId(p.project_id ?? NONE);
    setStartDate(p.start_date);
    setEndDate(p.end_date);
    setNotes(p.notes ?? "");
    setError(null);
    setDialogOpen(true);
  }

  async function save() {
    setSaving(true);
    setError(null);
    const fd = new FormData();
    fd.set("title", title);
    fd.set("project_id", projectId);
    fd.set("start_date", startDate);
    fd.set("end_date", endDate);
    fd.set("notes", notes);
    const res = editing
      ? await updatePlan(editing.id, fd)
      : await createPlan(fd);
    setSaving(false);
    if (res?.error) {
      setError(res.error);
      return;
    }
    setDialogOpen(false);
    router.refresh();
  }

  async function remove(p: PlanWithProject) {
    if (!confirm(`Excluir o planejamento "${p.title}"?`)) return;
    await deletePlan(p.id);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openCreate} className="gap-1">
          <Plus className="h-4 w-4" /> Novo planejamento
        </Button>
      </div>

      {plans.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-12 text-center">
          <p className="text-sm font-medium text-slate-700">
            Nenhum planejamento
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Planeje o trabalho da semana criando itens por projeto.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((g) => (
            <div
              key={g.label}
              className="overflow-hidden rounded-lg border border-slate-200 bg-white"
            >
              <div className="flex items-center gap-2 border-b border-slate-200 bg-[#F3F4F6] px-4 py-2">
                <CalendarRange className="h-4 w-4 text-slate-500" />
                <span className="text-sm font-semibold capitalize text-slate-700">
                  Semana de {g.label}
                </span>
              </div>
              <div className="divide-y divide-slate-100">
                {g.items.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50"
                  >
                    <span
                      className="mt-1.5 h-3 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: p.project?.color ?? "#94A3B8" }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-800">{p.title}</p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span>{p.project?.name ?? "Sem projeto"}</span>
                        <span>·</span>
                        <span>
                          {format(
                            new Date(p.start_date + "T00:00:00"),
                            "dd/MM"
                          )}{" "}
                          –{" "}
                          {format(
                            new Date(p.end_date + "T00:00:00"),
                            "dd/MM/yyyy"
                          )}
                        </span>
                      </div>
                      {p.notes && (
                        <p className="mt-1 text-sm text-slate-600">{p.notes}</p>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-slate-100">
                        <MoreVertical className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(p)}>
                          <Pencil className="mr-2 h-4 w-4" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => remove(p)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Editar planejamento" : "Novo planejamento"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Título</Label>
              <Input
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex.: Sprint de design"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Projeto</Label>
              <Select
                value={projectId}
                onValueChange={(v) => setProjectId(v ?? NONE)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Sem projeto</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Início</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Fim</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Notas</Label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observações (opcional)"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
