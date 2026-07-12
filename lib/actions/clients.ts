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

export async function createClientRecord(
  formData: FormData
): Promise<ActionResult> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "O nome é obrigatório." };

  const { supabase, user, workspace } = await requireUser();
  const { error } = await supabase
    .from("clients")
    .insert({ name, user_id: user.id, workspace_id: workspace.id });
  if (error) return { error: "Não foi possível criar o cliente." };

  revalidatePath("/clients");
  revalidatePath("/tracker");
  return { ok: true };
}

export async function updateClientRecord(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "O nome é obrigatório." };

  const { supabase } = await requireUser();
  const { error } = await supabase.from("clients").update({ name }).eq("id", id);
  if (error) return { error: "Não foi possível atualizar o cliente." };

  revalidatePath("/clients");
  revalidatePath("/tracker");
  return { ok: true };
}

export async function setClientArchived(
  id: string,
  archived: boolean
): Promise<ActionResult> {
  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("clients")
    .update({ archived })
    .eq("id", id);
  if (error) return { error: "Não foi possível arquivar o cliente." };

  revalidatePath("/clients");
  return { ok: true };
}

export async function deleteClientRecord(id: string): Promise<ActionResult> {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("clients").delete().eq("id", id);
  if (error) return { error: "Não foi possível excluir o cliente." };

  revalidatePath("/clients");
  revalidatePath("/projects");
  return { ok: true };
}
