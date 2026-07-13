"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Plus, Trash2, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { AlertItem } from "@/lib/queries";
import { createAlert, deleteAlert, markAlertsRead } from "@/lib/actions/alerts";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function AlertsMenu({
  alerts,
  isAdmin,
}: {
  alerts: AlertItem[];
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [composing, setComposing] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const unread = alerts.filter((a) => !a.is_read).length;

  async function onOpenChange(open: boolean) {
    // Abriu com algo por ler: marca tudo como lido.
    if (open && unread > 0) {
      await markAlertsRead();
      router.refresh();
    }
  }

  async function send() {
    setSaving(true);
    setError(null);
    const fd = new FormData();
    fd.set("title", title);
    fd.set("message", message);
    const res = await createAlert(fd);
    setSaving(false);
    if (res?.error) {
      setError(res.error);
      return;
    }
    setTitle("");
    setMessage("");
    setComposing(false);
    router.refresh();
  }

  async function remove(id: string) {
    await deleteAlert(id);
    router.refresh();
  }

  return (
    <>
      <DropdownMenu onOpenChange={onOpenChange}>
        <DropdownMenuTrigger
          title="Alertas"
          className="relative flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
        >
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-80 p-0">
          <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2">
            <span className="text-sm font-semibold text-slate-700">Alertas</span>
            {isAdmin && (
              <button
                type="button"
                onClick={() => setComposing(true)}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-[#03A9F4] hover:bg-[#03A9F4]/10"
              >
                <Plus className="h-3.5 w-3.5" /> Novo
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {alerts.length === 0 ? (
              <div className="px-3 py-8 text-center">
                <Bell className="mx-auto h-6 w-6 text-slate-300" />
                <p className="mt-2 text-sm text-slate-500">Nenhum alerta</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {isAdmin
                    ? "Envie um aviso para a equipe."
                    : "Avisos do administrador aparecem aqui."}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {alerts.map((a) => (
                  <div
                    key={a.id}
                    className={
                      a.is_read
                        ? "flex gap-2 px-3 py-2.5"
                        : "flex gap-2 bg-[#03A9F4]/5 px-3 py-2.5"
                    }
                  >
                    {!a.is_read && (
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#03A9F4]" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-800">
                        {a.title}
                      </p>
                      {a.message && (
                        <p className="mt-0.5 whitespace-pre-wrap text-xs text-slate-600">
                          {a.message}
                        </p>
                      )}
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {formatDistanceToNow(new Date(a.created_at), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => remove(a.id)}
                        title="Excluir alerta"
                        className="h-6 w-6 shrink-0 rounded text-slate-400 hover:bg-slate-100 hover:text-red-600"
                      >
                        <Trash2 className="mx-auto h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={composing} onOpenChange={setComposing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar alerta para a equipe</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="rounded-md bg-slate-50 p-3 text-xs text-muted-foreground">
              Todos os colaboradores do workspace verão este aviso no sininho.
            </p>
            <div className="space-y-1.5">
              <Label>Título</Label>
              <Input
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex.: Fechamento de horas na sexta"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Mensagem (opcional)</Label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                placeholder="Detalhe o aviso..."
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setComposing(false)}>
              <X className="mr-1 h-4 w-4" /> Cancelar
            </Button>
            <Button onClick={send} disabled={saving || !title.trim()}>
              {saving ? "Enviando..." : "Enviar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
