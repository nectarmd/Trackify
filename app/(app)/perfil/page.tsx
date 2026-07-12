import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/server";
import { getCurrentWorkspace } from "@/lib/workspace";
import { PageHeader } from "@/components/layout/page-header";
import { ProfileClient } from "@/components/profile/profile-client";

export const dynamic = "force-dynamic";

export default async function PerfilPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const workspace = await getCurrentWorkspace();
  if (!workspace) redirect("/login");

  const meta = (user.user_metadata ?? {}) as {
    full_name?: string;
    avatar_url?: string;
  };

  return (
    <div className="mx-auto max-w-2xl p-4 sm:p-6">
      <PageHeader
        title="Perfil"
        description="Seus dados, sua foto e as configurações do workspace."
      />
      <ProfileClient
        email={user.email ?? ""}
        fullName={meta.full_name ?? ""}
        avatarUrl={meta.avatar_url ?? null}
        workspaceName={workspace.name}
        isAdmin={workspace.role === "admin"}
      />
    </div>
  );
}
