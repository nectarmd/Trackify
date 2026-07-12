"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  DollarSign,
} from "lucide-react";
import type { ExpenseWithProject, ProjectWithClient } from "@/lib/types";
import {
  createExpense,
  updateExpense,
  deleteExpense,
} from "@/lib/actions/expenses";
import { formatMoney, periodRange, type PeriodKey } from "@/lib/time";
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
const ALL = "all";

const PERIOD_LABELS: Record<PeriodKey, string> = {
  this_week: "Esta semana",
  last_week: "Semana passada",
  this_month: "Este mês",
  last_month: "Mês passado",
  custom: "Todo o período",
};

export function ExpensesClient({
  expenses,
  projects,
}: {
  expenses: ExpenseWithProject[];
  projects: ProjectWithClient[];
}) {
  const router = useRouter();
  const [period, setPeriod] = useState<PeriodKey>("this_month");
  const [projectFilter, setProjectFilter] = useState<string>(ALL);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ExpenseWithProject | null>(null);
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [projectId, setProjectId] = useState<string>(NONE);
  const [billable, setBillable] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    let list = expenses;
    if (period !== "custom") {
      const { start, end } = periodRange(period);
      list = list.filter((e) => {
        const d = new Date(e.date + "T00:00:00").getTime();
        return d >= start.getTime() && d <= end.getTime();
      });
    }
    if (projectFilter !== ALL) {
      list = list.filter((e) => e.project_id === projectFilter);
    }
    return list;
  }, [expenses, period, projectFilter]);

  const total = useMemo(
    () => filtered.reduce((acc, e) => acc + Number(e.amount), 0),
    [filtered]
  );

  function openCreate() {
    setEditing(null);
    setDate(format(new Date(), "yyyy-MM-dd"));
    setCategory("");
    setDescription("");
    setAmount("");
    setProjectId(NONE);
    setBillable(false);
    setError(null);
    setDialogOpen(true);
  }
  function openEdit(e: ExpenseWithProject) {
    setEditing(e);
    setDate(e.date);
    setCategory(e.category);
    setDescription(e.description);
    setAmount(String(e.amount));
    setProjectId(e.project_id ?? NONE);
    setBillable(e.billable);
    setError(null);
    setDialogOpen(true);
  }

  async function save() {
    setSaving(true);
    setError(null);
    const fd = new FormData();
    fd.set("date", date);
    fd.set("category", category);
    fd.set("description", description);
    fd.set("amount", amount);
    fd.set("project_id", projectId);
    fd.set("billable", billable ? "true" : "false");
    const res = editing
      ? await updateExpense(editing.id, fd)
      : await createExpense(fd);
    setSaving(false);
    if (res?.error) {
      setError(res.error);
      return;
    }
    setDialogOpen(false);
    router.refresh();
  }

  async function remove(e: ExpenseWithProject) {
    if (!confirm(`Excluir a despesa "${e.description}"?`)) return;
    await deleteExpense(e.id);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            Período
          </label>
          <Select
            value={period}
            onValueChange={(v) => setPeriod((v ?? "this_month") as PeriodKey)}
          >
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(PERIOD_LABELS) as PeriodKey[]).map((k) => (
                <SelectItem key={k} value={k}>
                  {PERIOD_LABELS[k]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            Projeto
          </label>
          <Select
            value={projectFilter}
            onValueChange={(v) => setProjectFilter(v ?? ALL)}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todos os projetos</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={openCreate} className="ml-auto gap-1">
          <Plus className="h-4 w-4" /> Nova despesa
        </Button>
      </div>

      <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3">
        <span className="text-sm font-medium text-slate-600">
          Total do período
        </span>
        <span className="text-lg font-bold text-[#03A9F4]">
          {formatMoney(total)}
        </span>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm font-medium text-slate-700">
              Nenhuma despesa
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Registre despesas para acompanhar seus gastos por projeto.
            </p>
          </div>
        ) : (
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-[#F3F4F6] text-left text-xs uppercase text-slate-600">
                <th className="px-4 py-2 font-medium">Data</th>
                <th className="px-4 py-2 font-medium">Descrição</th>
                <th className="px-4 py-2 font-medium">Categoria</th>
                <th className="px-4 py-2 font-medium">Projeto</th>
                <th className="px-4 py-2 text-right font-medium">Valor</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-muted-foreground">
                    {format(new Date(e.date + "T00:00:00"), "dd/MM/yyyy")}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-800">
                    <span className="flex items-center gap-2">
                      {e.description}
                      {e.billable && (
                        <DollarSign className="h-3.5 w-3.5 text-[#03A9F4]" />
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {e.category || "—"}
                  </td>
                  <td className="px-4 py-3">
                    {e.project ? (
                      <span className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: e.project.color }}
                        />
                        {e.project.name}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-800">
                    {formatMoney(Number(e.amount))}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-slate-100">
                        <MoreVertical className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(e)}>
                          <Pencil className="mr-2 h-4 w-4" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => remove(e)}
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
              {editing ? "Editar despesa" : "Nova despesa"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Descrição</Label>
              <Input
                autoFocus
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex.: Passagem, software, material"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Data</Label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Valor (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0,00"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Categoria</Label>
              <Input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Ex.: Transporte, Software"
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
            <div className="flex items-center gap-2">
              <Switch
                id="expense-billable"
                checked={billable}
                onCheckedChange={setBillable}
              />
              <Label htmlFor="expense-billable">Faturável</Label>
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
