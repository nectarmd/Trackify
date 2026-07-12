import "server-only";
import { cache } from "react";
import { getWorkspaceContext } from "@/lib/workspace";
import { ALL_TRUE, ALL_FALSE, type Permissions } from "@/lib/permissions";

/**
 * Leitura das permissões. Fica separado de lib/permissions.ts porque aquele
 * arquivo é importado por componentes de cliente (sidebar, menu inferior) e não
 * pode arrastar o cliente Supabase do servidor para o bundle.
 *
 * Nenhuma das funções abaixo faz consulta própria: as permissões já vêm no
 * mesmo pacote do workspace (getWorkspaceContext), que é cacheado por requisição.
 */

/** O que o admin configurou para os MEMBROS (não é o que o usuário atual pode). */
export const getMemberPermissions = cache(async (): Promise<Permissions> => {
  const ctx = await getWorkspaceContext();
  return ctx?.memberPermissions ?? ALL_FALSE;
});

/**
 * O que o USUÁRIO ATUAL pode. Admin pode tudo.
 * Espelha a função member_can() do banco: a interface é só o reflexo do que o
 * RLS já garante.
 */
export const getPermissions = cache(async (): Promise<Permissions> => {
  const ctx = await getWorkspaceContext();
  if (!ctx) return ALL_FALSE;
  if (ctx.role === "admin") return ALL_TRUE;
  return ctx.memberPermissions;
});
