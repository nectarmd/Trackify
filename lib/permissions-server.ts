import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentWorkspace } from "@/lib/workspace";
import {
  ALL_TRUE,
  ALL_FALSE,
  normalizePermissions,
  type Permissions,
} from "@/lib/permissions";

/**
 * Leitura das permissões no banco. Fica separado de lib/permissions.ts porque
 * aquele arquivo é importado por componentes de cliente (sidebar, menu
 * inferior) e não pode arrastar o cliente Supabase do servidor para o bundle.
 */

/** O que o admin configurou para os MEMBROS (não é o que o usuário atual pode). */
export const getMemberPermissions = cache(async (): Promise<Permissions> => {
  const workspace = await getCurrentWorkspace();
  if (!workspace) return ALL_FALSE;

  const supabase = await createClient();
  const { data } = await supabase
    .from("workspaces")
    .select("member_permissions")
    .eq("id", workspace.id)
    .maybeSingle();

  return normalizePermissions(data?.member_permissions);
});

/**
 * O que o USUÁRIO ATUAL pode. Admin pode tudo.
 * Espelha a função member_can() do banco: a interface é só o reflexo do que o
 * RLS já garante.
 */
export const getPermissions = cache(async (): Promise<Permissions> => {
  const workspace = await getCurrentWorkspace();
  if (!workspace) return ALL_FALSE;
  if (workspace.role === "admin") return ALL_TRUE;
  return getMemberPermissions();
});
