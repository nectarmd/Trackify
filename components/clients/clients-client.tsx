"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, MoreVertical, Pencil, Archive, ArchiveRestore, Trash2 } from "lucide-react";
import type { Client } from "@/lib/types";
import {
  createClientRecord,
  updateClientRecord,
  setClientArchived,
  deleteClientRecord,
} from "@/lib/actions/clients";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ClientsClient({ clients }: { clients: Client[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(
    () =>
      clients.filter(
        (c) =>
          c.archived === showArchived &&
          c.name.toLowerCase().includes(search.toLowerCase())
      ),
    [clients, search, showArchived]
  );

  function openCreate() {
    setEditing(null);
    setName("");
    setError(null);
    setDialogOpen(true);
  }
  function openEdit(c: Client) {
    setEditing(c);
    setName(c.name);
    setError(null);
    setDialogOpen(true);
  }

  async function save() {
    setSaving(true);
    setError(null);
    const fd = new FormData();
    fd.set("name", name);
    const res = editing
      ? await updateClientRecord(editing.id, fd)
      : await createClientRecord(fd);
    setSaving(false);
    if (res?.error) {
      setError(res.error);
      return;
    }
    setDialogOpen(false);
    router.refresh();
  }

  async function archive(c: Client) {
    await setClientArchived(c.id, !c.archived);
    router.refresh();
  }
  async function remove(c: Client) {
    if (!confirm(`Excluir o cliente "${c.name}"?`)) return;
    await deleteClientRecord(c.id);
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
            placeholder="Buscar clientes..."
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
          <Plus className="h-4 w-4" /> Novo cliente
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border bg-white">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm font-medium text-slate-700">
              {showArchived ? "Nenhum cliente arquivado" : "Nenhum cliente"}
            </p>
            {!showArchived && (
              <p className="mt-1 text-sm text-muted-foreground">
                Crie seu primeiro cliente para organizar seus projetos.
              </p>
            )}
          </div>
        ) : (
          <div className="divide-y">
            {filtered.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between px-4 py-3 hover:bg-slate-50"
              >
                <span className="text-sm font-medium">{c.name}</span>
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-slate-100">
                    <MoreVertical className="h-4 w-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openEdit(c)}>
                      <Pencil className="mr-2 h-4 w-4" /> Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => archive(c)}>
                      {c.archived ? (
                        <>
                          <ArchiveRestore className="mr-2 h-4 w-4" /> Desarquivar
                        </>
                      ) : (
                        <>
                          <Archive className="mr-2 h-4 w-4" /> Arquivar
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => remove(c)}
                      className="text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Editar cliente" : "Novo cliente"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label>Nome</Label>
            <Input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome do cliente"
              onKeyDown={(e) => e.key === "Enter" && save()}
            />
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
