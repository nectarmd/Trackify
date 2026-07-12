import { requirePermission } from "@/lib/guard";
import { getPlans, getProjects, getWorkspaceMembers } from "@/lib/queries";
import { getCurrentUser } from "@/lib/supabase/server";
import { getCurrentWorkspace } from "@/lib/workspace";
import { PageHeader } from "@/components/layout/page-header";
import { PlannerClient } from "@/components/planner/planner-client";

export const dynamic = "force-dynamic";

export default async function PlanejadorPage() {
  await requirePermission("planner");

  const [plans, projects, workspace, user] = await Promise.all([
    getPlans(),
    getProjects(false),
    getCurrentWorkspace(),
    getCurrentUser(),
  ]);

  const isAdmin = workspace?.role === "admin";
  // Só o admin planeja para outra pessoa, então só ele precisa da lista.
  const members = isAdmin ? await getWorkspaceMembers() : [];

  return (
    <div className="mx-auto max-w-4xl p-4 sm:p-6">
      <PageHeader
        title="Planejador"
        description={
          isAdmin
            ? "Planeje o trabalho da equipe. Cada colaborador vê apenas o que foi atribuído a ele."
            : "Seu trabalho planejado."
        }
      />
      <PlannerClient
        plans={plans}
        projects={projects}
        members={members}
        currentUserId={user?.id ?? ""}
        isAdmin={isAdmin}
      />
    </div>
  );
}
