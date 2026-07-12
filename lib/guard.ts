import { redirect } from "next/navigation";
import { getPermissions } from "@/lib/permissions-server";
import type { PermissionKey } from "@/lib/permissions";

/**
 * Barra o acesso à página quando o usuário não tem a permissão.
 *
 * Esconder o item no menu não basta: sem isto, bastaria digitar a URL.
 * (O RLS já protege o DADO; isto evita a página quebrada/vazia.)
 */
export async function requirePermission(key: PermissionKey) {
  const perms = await getPermissions();
  if (!perms[key]) redirect("/tracker");
}
