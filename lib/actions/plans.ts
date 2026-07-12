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

type PlanInput = {
  project_id: string | null;
  title: string;
  start_date: string;
  end_date: string;
  notes: string | null;
};

function parsePlan(formData: FormData): PlanInput | { error: string } {
  const title = String(formData.get("title") ?? "").trim();
  const start_date = String(formData.get("start_date") ?? "").trim();
  const end_date = String(formData.get("end_date") ?? "").trim();
  const notesRaw = String(formData.get("notes") ?? "").trim();
  const projectRaw = String(formData.get("project_id") ?? "");
  const project_id = projectRaw && projectRaw !== "none" ? projectRaw : null;

  if (!title) return { error: "O título é obrigatório." };
  if (!start_date || !end_date)
    return { error: "As datas de início e fim são obrigatórias." };
  if (end_date < start_date)
    return { error: "A data de fim deve ser igual ou depois do início." };

  return {
    project_id,
    title,
    start_date,
    end_date,
    notes: notesRaw || null,
  };
}

export async function createPlan(formData: FormData): Promise<ActionResult> {
  const parsed = parsePlan(formData);
  if ("error" in parsed) return parsed;

  const { supabase, user, workspace } = await requireUser();
  const { error } = await supabase
    .from("plans")
    .insert({ ...parsed, user_id: user.id, workspace_id: workspace.id });
  if (error) return { error: "Não foi possível criar o planejamento." };

  revalidatePath("/planejador");
  return { ok: true };
}

export async function updatePlan(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  const parsed = parsePlan(formData);
  if ("error" in parsed) return parsed;

  const { supabase } = await requireUser();
  const { error } = await supabase.from("plans").update(parsed).eq("id", id);
  if (error) return { error: "Não foi possível atualizar o planejamento." };

  revalidatePath("/planejador");
  return { ok: true };
}

export async function deletePlan(id: string): Promise<ActionResult> {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("plans").delete().eq("id", id);
  if (error) return { error: "Não foi possível excluir o planejamento." };

  revalidatePath("/planejador");
  return { ok: true };
}
