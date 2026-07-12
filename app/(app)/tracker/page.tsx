import {
  getProjects,
  getTags,
  getRunningEntry,
  getRecentEntries,
} from "@/lib/queries";
import { TrackerView } from "@/components/tracker/tracker-view";

export const dynamic = "force-dynamic";

export default async function TrackerPage() {
  const [projects, tags, running, entries] = await Promise.all([
    getProjects(),
    getTags(),
    getRunningEntry(),
    getRecentEntries(14),
  ]);

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      <TrackerView
        projects={projects}
        tags={tags}
        running={running}
        entries={entries}
      />
    </div>
  );
}
