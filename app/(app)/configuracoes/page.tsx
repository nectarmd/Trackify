import { redirect } from "next/navigation";
import { getCurrentWorkspace } from "@/lib/workspace";
import { getMemberPermissions } from "@/lib/permissions-server";
import { PageHeader } from "@/components/layout/page-header";
import { SettingsClient } from "@/components/settings/settings-client";

export const dynamic = "force-dynamic";

export default async function ConfiguracoesPage() {
  const workspace = await getCurrentWorkspace();
  if (!workspace) redirect("/login");

  // Página de admin. Membro nem chega aqui (o menu esconde, e isto barra).
  if (workspace.role !== "admin") redirect("/tracker");

  const permissions = await getMemberPermissions();

  return (
    <div className="mx-auto max-w-2xl p-4 sm:p-6">
      <PageHeader
        title="Configurações"
        description={`Defina o que os colaboradores de "${workspace.name}" podem acessar. Administradores sempre têm acesso completo.`}
      />
      <SettingsClient
        permissions={permissions}
        workspaceName={workspace.name}
      />
    </div>
  );
}
