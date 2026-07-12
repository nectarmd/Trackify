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

type ProjectInput = {
  name: string;
  color: string;
  client_id: string | null;
  billable_default: boolean;
};

function parseProject(formData: FormData): ProjectInput | { error: string } {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "O nome é obrigatório." };
  const color = String(formData.get("color") ?? "#03A9F4");
  const clientRaw = String(formData.get("client_id") ?? "");
  const client_id = clientRaw && clientRaw !== "none" ? clientRaw : null;
  const billable_default = formData.get("billable_default") === "on" ||
    formData.get("billable_default") === "true";
  return { name, color, client_id, billable_default };
}

export async function createProject(
  formData: FormData
): Promise<ActionResult> {
  const parsed = parseProject(formData);
  if ("error" in parsed) return parsed;

  const { supabase, user, workspace } = await requireUser();
  const { error } = await supabase
    .from("projects")
    .insert({ ...parsed, user_id: user.id, workspace_id: workspace.id });
  if (error) return { error: "Não foi possível criar o projeto." };

  revalidatePath("/projects");
  revalidatePath("/tracker");
  return { ok: true };
}

export async function updateProject(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  const parsed = parseProject(formData);
  if ("error" in parsed) return parsed;

  const { supabase } = await requireUser();
  const { error } = await supabase.from("projects").update(parsed).eq("id", id);
  if (error) return { error: "Não foi possível atualizar o projeto." };

  revalidatePath("/projects");
  revalidatePath("/tracker");
  return { ok: true };
}

export async function setProjectArchived(
  id: string,
  archived: boolean
): Promise<ActionResult> {
  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("projects")
    .update({ archived })
    .eq("id", id);
  if (error) return { error: "Não foi possível arquivar o projeto." };

  revalidatePath("/projects");
  revalidatePath("/tracker");
  return { ok: true };
}

export async function deleteProject(id: string): Promise<ActionResult> {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) return { error: "Não foi possível excluir o projeto." };

  revalidatePath("/projects");
  revalidatePath("/tracker");
  return { ok: true };
}
