"use server";

import { revalidatePath } from "next/cache";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { requireWorkspace } from "@/lib/workspace";
import type { ActionResult } from "./result";

function revalidateAll() {
  // O nome/foto aparecem na topbar, que vive no layout de todas as páginas.
  revalidatePath("/", "layout");
}

/** Nome de exibição — guardado no metadata do usuário (sem tabela extra). */
export async function updateDisplayName(
  formData: FormData
): Promise<ActionResult> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "O nome é obrigatório." };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    data: { full_name: name },
  });
  if (error) return { error: "Não foi possível salvar o nome." };

  revalidateAll();
  return { ok: true };
}

/** Nome do workspace. Só admin — o RLS também barra no banco. */
export async function updateWorkspaceName(
  formData: FormData
): Promise<ActionResult> {
  const name = String(formData.get("workspace_name") ?? "").trim();
  if (!name) return { error: "O nome do workspace é obrigatório." };

  const [supabase, workspace] = await Promise.all([
    createClient(),
    requireWorkspace(),
  ]);
  if (workspace.role !== "admin") {
    return { error: "Apenas administradores podem renomear o workspace." };
  }

  const { error } = await supabase
    .from("workspaces")
    .update({ name })
    .eq("id", workspace.id);
  if (error) return { error: "Não foi possível renomear o workspace." };

  revalidateAll();
  return { ok: true };
}

/**
 * Troca de e-mail. O Supabase envia um link de confirmação para o NOVO
 * endereço; a troca só vale depois que a pessoa confirmar.
 */
export async function updateEmail(formData: FormData): Promise<ActionResult> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  if (!email) return { error: "O e-mail é obrigatório." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return { error: "Informe um e-mail válido." };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ email });
  if (error) return { error: "Não foi possível alterar o e-mail." };

  revalidateAll();
  return {
    ok: true,
    message: "Enviamos um link de confirmação para o novo e-mail.",
  };
}

export async function updatePassword(
  formData: FormData
): Promise<ActionResult> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (password.length < 6)
    return { error: "A senha deve ter pelo menos 6 caracteres." };
  if (password !== confirm) return { error: "As senhas não coincidem." };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: "Não foi possível alterar a senha." };

  return { ok: true, message: "Senha alterada." };
}

/**
 * Foto de perfil. Sobe para o bucket "avatars" numa pasta com o id do usuário
 * — o RLS do Storage só deixa escrever na própria pasta.
 */
export async function updateAvatar(formData: FormData): Promise<ActionResult> {
  const file = formData.get("avatar");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Escolha uma imagem." };
  }
  if (!file.type.startsWith("image/")) {
    return { error: "O arquivo precisa ser uma imagem." };
  }
  if (file.size > 2 * 1024 * 1024) {
    return { error: "A imagem deve ter no máximo 2 MB." };
  }

  const [supabase, user] = await Promise.all([createClient(), getCurrentUser()]);
  if (!user) return { error: "Não autenticado." };

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${user.id}/avatar-${Date.now()}.${ext}`;

  const { error: upErr } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true, contentType: file.type });

  if (upErr) {
    return {
      error:
        "Não foi possível enviar a imagem. Confirme que a migração 004 (bucket de avatares) foi executada no Supabase.",
    };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(path);

  const { error } = await supabase.auth.updateUser({
    data: { avatar_url: publicUrl },
  });
  if (error) return { error: "Não foi possível salvar a foto." };

  revalidateAll();
  return { ok: true };
}

export async function removeAvatar(): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    data: { avatar_url: null },
  });
  if (error) return { error: "Não foi possível remover a foto." };

  revalidateAll();
  return { ok: true };
}
