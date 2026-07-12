import { getPlans, getProjects } from "@/lib/queries";
import { PageHeader } from "@/components/layout/page-header";
import { PlannerClient } from "@/components/planner/planner-client";

export const dynamic = "force-dynamic";

export default async function PlanejadorPage() {
  const [plans, projects] = await Promise.all([
    getPlans(),
    getProjects(false),
  ]);
  return (
    <div className="mx-auto max-w-4xl p-6">
      <PageHeader
        title="Planejador"
        description="Organize o trabalho planejado por projeto e semana."
      />
      <PlannerClient plans={plans} projects={projects} />
    </div>
  );
}
