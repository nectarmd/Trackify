import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/server";
import { getCurrentWorkspace } from "@/lib/workspace";
import { getWorkspaceMembers, getPendingInvites } from "@/lib/queries";
import { PageHeader } from "@/components/layout/page-header";
import { TeamClient } from "@/components/team/team-client";

export const dynamic = "force-dynamic";

export default async function EquipesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const workspace = await getCurrentWorkspace();
  if (!workspace) redirect("/login");

  const [members, invites] = await Promise.all([
    getWorkspaceMembers(),
    getPendingInvites(),
  ]);

  return (
    <div className="mx-auto max-w-4xl p-4 sm:p-6">
      <PageHeader
        title="Equipes"
        description={`Membros de "${workspace.name}". Quem entra aqui enxerga os projetos e o tempo deste workspace — e de nenhum outro.`}
      />
      <TeamClient
        members={members}
        invites={invites}
        currentUserId={user.id}
        workspaceName={workspace.name}
        isAdmin={workspace.role === "admin"}
      />
    </div>
  );
}
