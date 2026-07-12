"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  MoreVertical,
  Pencil,
  Archive,
  ArchiveRestore,
  Trash2,
  DollarSign,
} from "lucide-react";
import type { Client, ProjectWithClient } from "@/lib/types";
import { PROJECT_COLORS } from "@/lib/types";
import {
  createProject,
  updateProject,
  setProjectArchived,
  deleteProject,
} from "@/lib/actions/projects";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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

export function ProjectsClient({
  projects,
  clients,
}: {
  projects: ProjectWithClient[];
  clients: Client[];
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ProjectWithClient | null>(null);

  const [name, setName] = useState("");
  const [color, setColor] = useState(PROJECT_COLORS[0]);
  const [clientId, setClientId] = useState<string>(NONE);
  const [billable, setBillable] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(
    () =>
      projects.filter(
        (p) =>
          p.archived === showArchived &&
          p.name.toLowerCase().includes(search.toLowerCase())
      ),
    [projects, search, showArchived]
  );

  function openCreate() {
    setEditing(null);
    setName("");
    setColor(PROJECT_COLORS[0]);
    setClientId(NONE);
    setBillable(false);
    setError(null);
    setDialogOpen(true);
  }
  function openEdit(p: ProjectWithClient) {
    setEditing(p);
    setName(p.name);
    setColor(p.color);
    setClientId(p.client_id ?? NONE);
    setBillable(p.billable_default);
    setError(null);
    setDialogOpen(true);
  }

  async function save() {
    setSaving(true);
    setError(null);
    const fd = new FormData();
    fd.set("name", name);
    fd.set("color", color);
    fd.set("client_id", clientId);
    fd.set("billable_default", billable ? "true" : "false");
    const res = editing
      ? await updateProject(editing.id, fd)
      : await createProject(fd);
    setSaving(false);
    if (res?.error) {
      setError(res.error);
      return;
    }
    setDialogOpen(false);
    router.refresh();
  }

  async function archive(p: ProjectWithClient) {
    await setProjectArchived(p.id, !p.archived);
    router.refresh();
  }
  async function remove(p: ProjectWithClient) {
    if (!confirm(`Excluir o projeto "${p.name}"?`)) return;
    await deleteProject(p.id);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar projetos..."
            className="pl-9"
          />
        </div>
        <div className="flex overflow-hidden rounded-md border">
          <button
            onClick={() => setShowArchived(false)}
            className={`px-3 py-2 text-sm ${!showArchived ? "bg-[#03A9F4] text-white" : "hover:bg-accent"}`}
          >
            Ativos
          </button>
          <button
            onClick={() => setShowArchived(true)}
            className={`px-3 py-2 text-sm ${showArchived ? "bg-[#03A9F4] text-white" : "hover:bg-accent"}`}
          >
            Arquivados
          </button>
        </div>
        <Button onClick={openCreate} className="gap-1">
          <Plus className="h-4 w-4" /> Novo projeto
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border bg-white">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm font-medium text-slate-700">
              {showArchived ? "Nenhum projeto arquivado" : "Nenhum projeto"}
            </p>
            {!showArchived && (
              <p className="mt-1 text-sm text-muted-foreground">
                Crie um projeto para começar a rastrear tempo.
              </p>
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-slate-50 text-left text-xs uppercase text-muted-foreground">
                <th className="px-4 py-2 font-medium">Projeto</th>
                <th className="px-4 py-2 font-medium">Cliente</th>
                <th className="px-4 py-2 font-medium">Faturável</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-2 font-medium">
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: p.color }}
                      />
                      {p.name}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {p.client?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    {p.billable_default ? (
                      <DollarSign className="h-4 w-4 text-[#03A9F4]" />
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-slate-100">
                          <MoreVertical className="h-4 w-4" />
                        </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(p)}>
                          <Pencil className="mr-2 h-4 w-4" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => archive(p)}>
                          {p.archived ? (
                            <>
                              <ArchiveRestore className="mr-2 h-4 w-4" />{" "}
                              Desarquivar
                            </>
                          ) : (
                            <>
                              <Archive className="mr-2 h-4 w-4" /> Arquivar
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => remove(p)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Editar projeto" : "Novo projeto"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nome</Label>
              <Input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nome do projeto"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Cor</Label>
              <div className="flex flex-wrap gap-2">
                {PROJECT_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={cn(
                      "h-7 w-7 rounded-full border-2 transition",
                      color === c
                        ? "border-slate-900 scale-110"
                        : "border-transparent"
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Cliente</Label>
              <Select
                value={clientId}
                onValueChange={(v) => setClientId(v ?? NONE)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Sem cliente</SelectItem>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="billable-default"
                checked={billable}
                onCheckedChange={setBillable}
              />
              <Label htmlFor="billable-default">Faturável por padrão</Label>
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
