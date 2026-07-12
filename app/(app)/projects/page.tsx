import { getProjects, getClients } from "@/lib/queries";
import { PageHeader } from "@/components/layout/page-header";
import { ProjectsClient } from "@/components/projects/projects-client";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const [projects, clients] = await Promise.all([
    getProjects(true),
    getClients(false),
  ]);
  return (
    <div className="mx-auto max-w-4xl p-6">
      <PageHeader
        title="Projetos"
        description="Gerencie os projetos que você rastreia."
      />
      <ProjectsClient projects={projects} clients={clients} />
    </div>
  );
}
