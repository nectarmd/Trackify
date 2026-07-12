import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { normalizePermissions, type Permissions } from "@/lib/permissions";

export type CurrentWorkspace = {
  id: string;
  name: string;
  role: "admin" | "member";
  isOwner: boolean;
};

export type WorkspaceContext = CurrentWorkspace & {
  /** O que os MEMBROS podem. Admin não é afetado por isto. */
  memberPermissions: Permissions;
};

/**
 * Contexto do workspace numa ÚNICA ida ao banco.
 *
 * Antes eram três, em série (~0,3s cada), a cada carregamento de página:
 * vincular convites pendentes, descobrir o workspace e ler as permissões.
 * A função my_workspace() faz os três no banco e devolve tudo junto.
 *
 * cache(): uma chamada por requisição, mesmo com layout, página e actions
 * pedindo o contexto.
 */
export const getWorkspaceContext = cache(
  async (): Promise<WorkspaceContext | null> => {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("my_workspace");

    if (error) return null;

    const row = (Array.isArray(data) ? data[0] : data) as
      | {
          id: string;
          name: string;
          role: "admin" | "member";
          is_owner: boolean;
          member_permissions: unknown;
        }
      | undefined;

    if (!row?.id) return null;

    return {
      id: row.id,
      name: row.name,
      role: row.role,
      isOwner: row.is_owner,
      memberPermissions: normalizePermissions(row.member_permissions),
    };
  }
);

export const getCurrentWorkspace = cache(
  async (): Promise<CurrentWorkspace | null> => {
    const ctx = await getWorkspaceContext();
    if (!ctx) return null;
    const { memberPermissions, ...ws } = ctx;
    void memberPermissions;
    return ws;
  }
);

/** Igual ao acima, mas explode se não houver workspace (uso em Server Actions). */
export async function requireWorkspace(): Promise<CurrentWorkspace> {
  const ws = await getCurrentWorkspace();
  if (!ws) throw new Error("Nenhum workspace encontrado");
  return ws;
}
