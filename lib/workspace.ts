import { cache } from "react";
import { createClient, getCurrentUser } from "@/lib/supabase/server";

export type CurrentWorkspace = {
  id: string;
  name: string;
  role: "admin" | "member";
  isOwner: boolean;
};

/**
 * Workspace ativo do usuário.
 *
 * Antes de resolver, "reivindica" convites pendentes: quem JÁ tinha conta e foi
 * convidado por e-mail é vinculado aqui (o gatilho do banco só cobre quem se
 * cadastra depois do convite).
 *
 * cache(): uma resolução por requisição, mesmo com layout + página + actions
 * pedindo o workspace.
 */
export const getCurrentWorkspace = cache(
  async (): Promise<CurrentWorkspace | null> => {
    const user = await getCurrentUser();
    if (!user?.email) return null;

    const supabase = await createClient();

    // Vincula convites pendentes deste e-mail. Roda no banco (SECURITY DEFINER)
    // porque o convidado ainda não é membro e o RLS o barraria aqui.
    await supabase.rpc("claim_my_invites");

    // Preferência: o workspace que ele possui; senão, o primeiro em que é membro.
    const { data } = await supabase
      .from("workspace_members")
      .select("role, workspace:workspaces ( id, name, owner_id )")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    const rows = (data ?? []) as unknown as {
      role: "admin" | "member";
      workspace: { id: string; name: string; owner_id: string } | null;
    }[];

    const valid = rows.filter((r) => r.workspace);
    if (valid.length === 0) return null;

    const owned = valid.find((r) => r.workspace!.owner_id === user.id);
    const chosen = owned ?? valid[0];

    return {
      id: chosen.workspace!.id,
      name: chosen.workspace!.name,
      role: chosen.role,
      isOwner: chosen.workspace!.owner_id === user.id,
    };
  }
);

/** Igual ao acima, mas explode se não houver workspace (uso em Server Actions). */
export async function requireWorkspace(): Promise<CurrentWorkspace> {
  const ws = await getCurrentWorkspace();
  if (!ws) throw new Error("Nenhum workspace encontrado");
  return ws;
}
