"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  MoreVertical,
  Trash2,
  Crown,
  MailQuestion,
  X,
} from "lucide-react";
import type {
  WorkspaceMember,
  WorkspaceInvite,
  TeamMemberRole,
} from "@/lib/types";
import {
  inviteMember,
  updateMemberRole,
  removeMember,
  cancelInvite,
} from "@/lib/actions/team";
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
  invites,
  currentUserId,
  workspaceName,
  isAdmin,
}: {
  members: WorkspaceMember[];
  invites: WorkspaceInvite[];
  currentUserId: string;
  workspaceName: string;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<TeamMemberRole>("member");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function openInvite() {
    setEmail("");
    setName("");
    setRole("member");
    setError(null);
    setOpen(true);
  }

  async function save() {
    setSaving(true);
    setError(null);
    const fd = new FormData();
    fd.set("email", email);
    fd.set("name", name);
    fd.set("role", role);
    const res = await inviteMember(fd);
    setSaving(false);
    if (res?.error) {
      setError(res.error);
      return;
    }
    setOpen(false);
    router.refresh();
  }

  async function changeRole(m: WorkspaceMember, next: TeamMemberRole) {
    await updateMemberRole(m.id, next);
    router.refresh();
  }

  async function remove(m: WorkspaceMember) {
    if (!confirm(`Remover ${m.name || m.email} de ${workspaceName}?`)) return;
    await removeMember(m.id);
    router.refresh();
  }

  async function drop(i: WorkspaceInvite) {
    if (!confirm(`Cancelar o convite de ${i.email}?`)) return;
    await cancelInvite(i.id);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {isAdmin
            ? "Convide pessoas por e-mail. Elas ganham acesso apenas a este workspace."
            : "Você é membro deste workspace. Apenas administradores podem convidar."}
        </p>
        {isAdmin && (
          <Button onClick={openInvite} className="shrink-0 gap-1">
            <Plus className="h-4 w-4" /> Convidar
          </Button>
        )}
      </div>

      {/* Membros com acesso */}
      <div>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Membros ({members.length})
        </h2>
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="divide-y divide-slate-100">
            {members.map((m) => {
              const isMe = m.user_id === currentUserId;
              return (
                <div key={m.id} className="flex items-center gap-3 px-4 py-3">
                  <span
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                      m.role === "admin"
                        ? "bg-[#03A9F4] text-white"
                        : "bg-slate-200 text-slate-600"
                    )}
                  >
                    {initials(m.name || m.email || "?")}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="truncate font-medium text-slate-800">
                        {m.name || m.email}
                      </span>
                      {m.role === "admin" && (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                          <Crown className="h-3 w-3" /> Admin
                        </span>
                      )}
                      {isMe && (
                        <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                          Você
                        </span>
                      )}
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {m.email} · {ROLE_LABELS[m.role]}
                    </p>
                  </div>

                  {isAdmin && !isMe && (
                    <DropdownMenu>
                      <DropdownMenuTrigger className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-slate-100">
                        <MoreVertical className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() =>
                            changeRole(
                              m,
                              m.role === "admin" ? "member" : "admin"
                            )
                          }
                        >
                          <Crown className="mr-2 h-4 w-4" />
                          {m.role === "admin"
                            ? "Tornar membro"
                            : "Tornar administrador"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => remove(m)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Remover do
                          workspace
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Convites que ainda não viraram acesso */}
      {invites.length > 0 && (
        <div>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Convites pendentes ({invites.length})
          </h2>
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <div className="divide-y divide-slate-100">
              {invites.map((i) => (
                <div key={i.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                    <MailQuestion className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-slate-700">
                      {i.email}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      Entra como {ROLE_LABELS[i.role]} ao criar a conta com este
                      e-mail
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                    Aguardando
                  </span>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => drop(i)}
                      title="Cancelar convite"
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-slate-100"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convidar para {workspaceName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="rounded-md bg-slate-50 p-3 text-xs text-muted-foreground">
              A pessoa cria a conta em <strong>/signup</strong> usando
              exatamente este e-mail e já entra neste workspace — sem acesso a
              nenhum outro. Se ela já tiver conta, o acesso aparece no próximo
              login.
            </p>
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
              <Label>Nome (opcional)</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nome da pessoa"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Papel</Label>
              <Select
                value={role}
                onValueChange={(v) =>
                  setRole((v ?? "member") as TeamMemberRole)
                }
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
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving ? "Convidando..." : "Convidar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
