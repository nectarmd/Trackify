import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getTeamMembers } from "@/lib/queries";
import { PageHeader } from "@/components/layout/page-header";
import { TeamClient } from "@/components/team/team-client";

export const dynamic = "force-dynamic";

export default async function EquipesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const members = await getTeamMembers();

  return (
    <div className="mx-auto max-w-4xl p-6">
      <PageHeader
        title="Equipes"
        description="Gerencie os membros do seu workspace."
      />
      <TeamClient members={members} ownerEmail={user.email ?? ""} />
    </div>
  );
}
