"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireWorkspace } from "@/lib/workspace";
import { PERMISSION_KEYS } from "@/lib/permissions";
import type { ActionResult } from "./result";

/**
 * Salva o que os MEMBROS podem acessar. Só admin.
 * A checagem aqui é conveniência: quem garante mesmo é o RLS (a policy de
 * update em workspaces exige is_workspace_admin).
 */
export async function updateMemberPermissions(
  formData: FormData
): Promise<ActionResult> {
  const [supabase, workspace] = await Promise.all([
    createClient(),
    requireWorkspace(),
  ]);

  if (workspace.role !== "admin") {
    return { error: "Apenas administradores podem alterar as permissões." };
  }

  const perms: Record<string, boolean> = {};
  for (const key of PERMISSION_KEYS) {
    perms[key] = formData.get(key) === "true";
  }

  const { error } = await supabase
    .from("workspaces")
    .update({ member_permissions: perms })
    .eq("id", workspace.id);

  if (error) return { error: "Não foi possível salvar as permissões." };

  // As permissões mudam o menu e o acesso às páginas: revalida tudo.
  revalidatePath("/", "layout");
  return { ok: true, message: "Permissões salvas." };
}
