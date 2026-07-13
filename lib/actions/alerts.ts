"use server";

import { revalidatePath } from "next/cache";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { requireWorkspace } from "@/lib/workspace";
import type { ActionResult } from "./result";

/** Publica um aviso para todo o workspace. Só admin (o RLS também exige). */
export async function createAlert(formData: FormData): Promise<ActionResult> {
  const [supabase, user, workspace] = await Promise.all([
    createClient(),
    getCurrentUser(),
    requireWorkspace(),
  ]);

  if (workspace.role !== "admin") {
    return { error: "Apenas administradores podem enviar alertas." };
  }

  const title = String(formData.get("title") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (!title) return { error: "O título é obrigatório." };

  const { error } = await supabase.from("workspace_alerts").insert({
    workspace_id: workspace.id,
    created_by: user?.id ?? null,
    title,
    message,
  });
  if (error) return { error: "Não foi possível enviar o alerta." };

  revalidatePath("/", "layout");
  return { ok: true, message: "Alerta enviado para a equipe." };
}

export async function deleteAlert(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("workspace_alerts")
    .delete()
    .eq("id", id);
  if (error) return { error: "Não foi possível excluir o alerta." };

  revalidatePath("/", "layout");
  return { ok: true };
}

/** Marca todos como lidos (só para quem chamou). */
export async function markAlertsRead(): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("mark_alerts_read");
  if (error) return { error: "Não foi possível marcar como lidos." };

  revalidatePath("/", "layout");
  return { ok: true };
}
