"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  Crown,
  UserRound,
} from "lucide-react";
import type { TeamMember, TeamMemberRole } from "@/lib/types";
import { inviteMember, updateMember, removeMember } from "@/lib/actions/team";
import { cn } from "@/lib/utils";
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

const ROLE_LABELS: Record<TeamMemberRole, string> = {
  admin: "Administrador",
  member: "Membro",
};

function initials(value: string): string {
  const base = value.split("@")[0] ?? value;
  const parts = base.split(/[.\-_\s]/).filter(Boolean);
  const chars = (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
  return (chars || base.slice(0, 2) || "?").toUpperCase();
}

export function TeamClient({
  members,
  ownerEmail,
}: {
  members: TeamMember[];
  ownerEmail: string;
}) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TeamMember | null>(null);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<TeamMemberRole>("member");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function openInvite() {
    setEditing(null);
    setEmail("");
    setName("");
    setRole("member");
    setError(null);
    setDialogOpen(true);
  }
  function openEdit(m: TeamMember) {
    setEditing(m);
    setEmail(m.email);
    setName(m.name ?? "");
    setRole(m.role);
    setError(null);
    setDialogOpen(true);
  }

  async function save() {
    setSaving(true);
    setError(null);
    const fd = new FormData();
    fd.set("email", email);
    fd.set("name", name);
    fd.set("role", role);
    const res = editing
      ? await updateMember(editing.id, fd)
      : await inviteMember(fd);
    setSaving(false);
    if (res?.error) {
      setError(res.error);
      return;
    }
    setDialogOpen(false);
    router.refresh();
  }

  async function remove(m: TeamMember) {
    if (!confirm(`Remover ${m.name || m.email} da equipe?`)) return;
    await removeMember(m.id);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Gestão de equipe do workspace. Convide pessoas e defina papéis.
        </p>
        <Button onClick={openInvite} className="gap-1">
          <Plus className="h-4 w-4" /> Convidar
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="divide-y divide-slate-100">
          {/* Proprietário */}
          <div className="flex items-center gap-3 px-4 py-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#03A9F4] text-sm font-semibold text-white">
              {initials(ownerEmail)}
            </span>
            <div className="min-w-0 flex-1">
              {/* O e-mail precisa estar num span próprio: texto solto dentro de
                  um flex não trunca e transborda por cima dos selos. */}
              <div className="flex min-w-0 items-center gap-2">
                <span className="truncate font-medium text-slate-800">
                  {ownerEmail}
                </span>
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                  <Crown className="h-3 w-3" /> Proprietário
                </span>
              </div>
              <p className="truncate text-xs text-muted-foreground">
                Administrador · Você
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-medium text-green-700">
              Ativo
            </span>
          </div>

          {/* Membros convidados */}
          {members.map((m) => (
            <div key={m.id} className="flex items-center gap-3 px-4 py-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-600">
                {initials(m.name || m.email)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="truncate font-medium text-slate-800">
                    {m.name || m.email}
                  </span>
                  <UserRound className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                </div>
                <p className="truncate text-xs text-muted-foreground">
                  {m.email} · {ROLE_LABELS[m.role]}
                </p>
              </div>
              <span
                className={cn(
                  "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium",
                  m.status === "active"
                    ? "bg-green-100 text-green-700"
                    : "bg-slate-100 text-slate-500"
                )}
              >
                {m.status === "active" ? "Ativo" : "Convidado"}
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-slate-100">
                  <MoreVertical className="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => openEdit(m)}>
                    <Pencil className="mr-2 h-4 w-4" /> Editar papel
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => remove(m)}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> Remover
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Editar membro" : "Convidar membro"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>E-mail</Label>
              <Input
                autoFocus
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="pessoa@empresa.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Nome</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nome (opcional)"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Papel</Label>
              <Select
                value={role}
                onValueChange={(v) => setRole((v ?? "member") as TeamMemberRole)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Membro</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving ? "Salvando..." : editing ? "Salvar" : "Convidar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
