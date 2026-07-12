"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, MoreVertical, Pencil, Trash2, Tag as TagIcon } from "lucide-react";
import type { Tag } from "@/lib/types";
import { createTag, updateTag, deleteTag } from "@/lib/actions/tags";
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

export function TagsClient({ tags }: { tags: Tag[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Tag | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(
    () =>
      tags.filter((t) =>
        t.name.toLowerCase().includes(search.toLowerCase())
      ),
    [tags, search]
  );

  function openCreate() {
    setEditing(null);
    setName("");
    setError(null);
    setDialogOpen(true);
  }
  function openEdit(t: Tag) {
    setEditing(t);
    setName(t.name);
    setError(null);
    setDialogOpen(true);
  }

  async function save() {
    setSaving(true);
    setError(null);
    const fd = new FormData();
    fd.set("name", name);
    const res = editing
      ? await updateTag(editing.id, fd)
      : await createTag(fd);
    setSaving(false);
    if (res?.error) {
      setError(res.error);
      return;
    }
    setDialogOpen(false);
    router.refresh();
  }

  async function remove(t: Tag) {
    if (!confirm(`Excluir a tag "${t.name}"?`)) return;
    await deleteTag(t.id);
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
            placeholder="Buscar tags..."
            className="pl-9"
          />
        </div>
        <Button onClick={openCreate} className="gap-1">
          <Plus className="h-4 w-4" /> Nova tag
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border bg-white">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm font-medium text-slate-700">Nenhuma tag</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Crie tags para categorizar suas entradas de tempo.
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {filtered.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between px-4 py-3 hover:bg-slate-50"
              >
                <span className="flex items-center gap-2 text-sm font-medium">
                  <TagIcon className="h-4 w-4 text-muted-foreground" />
                  {t.name}
                </span>
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-slate-100">
                    <MoreVertical className="h-4 w-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openEdit(t)}>
                      <Pencil className="mr-2 h-4 w-4" /> Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => remove(t)}
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
            <DialogTitle>{editing ? "Editar tag" : "Nova tag"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label>Nome</Label>
            <Input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome da tag"
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
