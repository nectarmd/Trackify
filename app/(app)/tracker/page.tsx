import {
  getProjects,
  getTags,
  getRunningEntry,
  getRecentEntries,
  getWorkspaceMembers,
} from "@/lib/queries";
import { getCurrentUser } from "@/lib/supabase/server";
import { getCurrentWorkspace } from "@/lib/workspace";
import { TrackerView } from "@/components/tracker/tracker-view";

export const dynamic = "force-dynamic";

export default async function TrackerPage() {
  const [projects, tags, running, entries, workspace, user] = await Promise.all([
    getProjects(),
    getTags(),
    getRunningEntry(),
    getRecentEntries(14),
    getCurrentWorkspace(),
    getCurrentUser(),
  ]);

  const isAdmin = workspace?.role === "admin";

  // Só o admin lança tempo para outra pessoa, então só ele precisa da lista.
  const members = isAdmin ? await getWorkspaceMembers() : [];

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      <TrackerView
        projects={projects}
        tags={tags}
        running={running}
        entries={entries}
        members={members}
        currentUserId={user?.id ?? ""}
        isAdmin={isAdmin}
      />
    </div>
  );
}
