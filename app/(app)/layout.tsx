import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/server";
import { getCurrentWorkspace } from "@/lib/workspace";
import { AppShell } from "@/components/layout/app-shell";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const workspace = await getCurrentWorkspace();

  const meta = (user.user_metadata ?? {}) as {
    full_name?: string;
    avatar_url?: string;
  };

  return (
    <AppShell
      email={user.email ?? ""}
      fullName={meta.full_name}
      avatarUrl={meta.avatar_url ?? null}
      workspaceName={workspace?.name}
    >
      {children}
    </AppShell>
  );
}
