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

export async function createTag(formData: FormData): Promise<ActionResult> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "O nome é obrigatório." };

  const { supabase, user, workspace } = await requireUser();
  const { error } = await supabase
    .from("tags")
    .insert({ name, user_id: user.id, workspace_id: workspace.id });
  if (error) return { error: "Não foi possível criar a tag." };

  revalidatePath("/tags");
  revalidatePath("/tracker");
  return { ok: true };
}

export async function updateTag(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "O nome é obrigatório." };

  const { supabase } = await requireUser();
  const { error } = await supabase.from("tags").update({ name }).eq("id", id);
  if (error) return { error: "Não foi possível atualizar a tag." };

  revalidatePath("/tags");
  revalidatePath("/tracker");
  return { ok: true };
}

export async function deleteTag(id: string): Promise<ActionResult> {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("tags").delete().eq("id", id);
  if (error) return { error: "Não foi possível excluir a tag." };

  revalidatePath("/tags");
  revalidatePath("/tracker");
  return { ok: true };
}
