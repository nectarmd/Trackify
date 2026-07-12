"use server";

import { revalidatePath } from "next/cache";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { requireWorkspace } from "@/lib/workspace";
import { sendInviteEmail } from "@/lib/email";
import type { ActionResult } from "./result";

async function requireAdmin() {
  const [supabase, user, workspace] = await Promise.all([
    createClient(),
    getCurrentUser(),
    requireWorkspace(),
  ]);
  if (!user) throw new Error("Não autenticado");
  if (workspace.role !== "admin") {
    return { error: "Apenas administradores podem gerenciar a equipe." };
  }
  return { supabase, user, workspace };
}

/**
 * Convida alguém para ESTE workspace. Não cria conta: grava um convite.
 * Quem já tem conta é vinculado no próximo acesso; quem ainda não tem é
 * vinculado ao se cadastrar com o mesmo e-mail (gatilho no banco).
 */
export async function inviteMember(formData: FormData): Promise<ActionResult> {
  const ctx = await requireAdmin();
  if ("error" in ctx) return { error: ctx.error };
  const { supabase, user, workspace } = ctx;

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const name = String(formData.get("name") ?? "").trim() || null;
  const roleRaw = String(formData.get("role") ?? "member");
  const role: "admin" | "member" = roleRaw === "admin" ? "admin" : "member";

  if (!email) return { error: "O e-mail é obrigatório." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return { error: "Informe um e-mail válido." };

  const { data: already } = await supabase
    .from("workspace_members")
    .select("id")
    .eq("workspace_id", workspace.id)
    .ilike("email", email)
    .maybeSingle();
  if (already) return { error: "Esta pessoa já faz parte da equipe." };

  const { data: pending } = await supabase
    .from("workspace_invites")
    .select("id")
    .eq("workspace_id", workspace.id)
    .eq("status", "pending")
    .ilike("email", email)
    .maybeSingle();
  if (pending) return { error: "Esta pessoa já tem um convite pendente." };

  const { error } = await supabase.from("workspace_invites").insert({
    workspace_id: workspace.id,
    email,
    name,
    role,
    invited_by: user.id,
  });
  if (error) return { error: "Não foi possível convidar." };

  revalidatePath("/equipes");

  // O e-mail é um aviso, não a fonte da verdade: o convite já vale no sistema.
  // Se o envio falhar, não desfazemos nada — só avisamos que é preciso avisar
  // a pessoa manualmente.
  const mail = await sendInviteEmail(email, workspace.name);
  if (!mail.sent) {
    return {
      ok: true,
      message: `Convite criado, mas o e-mail não foi enviado (${mail.error}). Avise ${email} manualmente.`,
    };
  }

  return { ok: true, message: `Convite enviado para ${email}.` };
}

/** Muda o papel de um membro já vinculado. */
export async function updateMemberRole(
  memberId: string,
  roleRaw: string
): Promise<ActionResult> {
  const ctx = await requireAdmin();
  if ("error" in ctx) return { error: ctx.error };
  const { supabase, workspace } = ctx;

  const role: "admin" | "member" = roleRaw === "admin" ? "admin" : "member";

  const { error } = await supabase
    .from("workspace_members")
    .update({ role })
    .eq("id", memberId)
    .eq("workspace_id", workspace.id);
  if (error) return { error: "Não foi possível atualizar o papel." };

  revalidatePath("/equipes");
  return { ok: true };
}

/** Remove o membro do workspace (a conta dele continua existindo). */
export async function removeMember(memberId: string): Promise<ActionResult> {
  const ctx = await requireAdmin();
  if ("error" in ctx) return { error: ctx.error };
  const { supabase, workspace } = ctx;

  const { error } = await supabase
    .from("workspace_members")
    .delete()
    .eq("id", memberId)
    .eq("workspace_id", workspace.id);
  if (error) return { error: "Não foi possível remover o membro." };

  revalidatePath("/equipes");
  return { ok: true };
}

/** Cancela um convite ainda não aceito. */
export async function cancelInvite(inviteId: string): Promise<ActionResult> {
  const ctx = await requireAdmin();
  if ("error" in ctx) return { error: ctx.error };
  const { supabase, workspace } = ctx;

  const { error } = await supabase
    .from("workspace_invites")
    .delete()
    .eq("id", inviteId)
    .eq("workspace_id", workspace.id);
  if (error) return { error: "Não foi possível cancelar o convite." };

  revalidatePath("/equipes");
  return { ok: true };
}
