"use server";

import { revalidatePath } from "next/cache";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { requireWorkspace } from "@/lib/workspace";
import type { ActionResult } from "./result";

async function requireUser() {
  const [supabase, user, workspace] = await Promise.all([
    createClient(),
    getCurrentUser(),
    requireWorkspace(),
  ]);
  if (!user) throw new Error("Não autenticado");
  return { supabase, user, workspace };
}

type ExpenseInput = {
  project_id: string | null;
  date: string;
  category: string;
  description: string;
  amount: number;
  billable: boolean;
};

function parseExpense(formData: FormData): ExpenseInput | { error: string } {
  const description = String(formData.get("description") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const date = String(formData.get("date") ?? "").trim();
  const amount = Number(formData.get("amount") ?? 0);
  const projectRaw = String(formData.get("project_id") ?? "");
  const project_id = projectRaw && projectRaw !== "none" ? projectRaw : null;
  const billable =
    formData.get("billable") === "on" || formData.get("billable") === "true";

  if (!description) return { error: "A descrição é obrigatória." };
  if (!date) return { error: "A data é obrigatória." };
  if (!Number.isFinite(amount) || amount <= 0)
    return { error: "O valor deve ser maior que zero." };

  return { project_id, date, category, description, amount, billable };
}

export async function createExpense(formData: FormData): Promise<ActionResult> {
  const parsed = parseExpense(formData);
  if ("error" in parsed) return parsed;

  const { supabase, user, workspace } = await requireUser();
  const { error } = await supabase
    .from("expenses")
    .insert({ ...parsed, user_id: user.id, workspace_id: workspace.id });
  if (error) return { error: "Não foi possível criar a despesa." };

  revalidatePath("/despesas");
  return { ok: true };
}

export async function updateExpense(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  const parsed = parseExpense(formData);
  if ("error" in parsed) return parsed;

  const { supabase } = await requireUser();
  const { error } = await supabase.from("expenses").update(parsed).eq("id", id);
  if (error) return { error: "Não foi possível atualizar a despesa." };

  revalidatePath("/despesas");
  return { ok: true };
}

export async function deleteExpense(id: string): Promise<ActionResult> {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("expenses").delete().eq("id", id);
  if (error) return { error: "Não foi possível excluir a despesa." };

  revalidatePath("/despesas");
  return { ok: true };
}
