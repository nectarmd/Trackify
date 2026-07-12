"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "./result";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");
  return { supabase, user };
}

type MemberInput = {
  email: string;
  name: string | null;
  role: "admin" | "member";
};

function parseMember(formData: FormData): MemberInput | { error: string } {
  const email = String(formData.get("email") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const roleRaw = String(formData.get("role") ?? "member");
  const role: "admin" | "member" = roleRaw === "admin" ? "admin" : "member";

  if (!email) return { error: "O e-mail é obrigatório." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return { error: "Informe um e-mail válido." };

  return { email, name: name || null, role };
}

export async function inviteMember(formData: FormData): Promise<ActionResult> {
  const parsed = parseMember(formData);
  if ("error" in parsed) return parsed;

  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("team_members").insert({
    ...parsed,
    status: "invited",
    user_id: user.id,
  });
  if (error) return { error: "Não foi possível convidar o membro." };

  revalidatePath("/equipes");
  return { ok: true };
}

export async function updateMember(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  const parsed = parseMember(formData);
  if ("error" in parsed) return parsed;

  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("team_members")
    .update(parsed)
    .eq("id", id);
  if (error) return { error: "Não foi possível atualizar o membro." };

  revalidatePath("/equipes");
  return { ok: true };
}

export async function removeMember(id: string): Promise<ActionResult> {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("team_members").delete().eq("id", id);
  if (error) return { error: "Não foi possível remover o membro." };

  revalidatePath("/equipes");
  return { ok: true };
}
