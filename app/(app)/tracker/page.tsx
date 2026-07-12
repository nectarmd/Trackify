import {
  getProjects,
  getTags,
  getRunningEntry,
  getRecentEntries,
} from "@/lib/queries";
import { TrackerBar } from "@/components/tracker/tracker-bar";
import { EntryList } from "@/components/tracker/entry-list";

export const dynamic = "force-dynamic";

export default async function TrackerPage() {
  const [projects, tags, running, entries] = await Promise.all([
    getProjects(),
    getTags(),
    getRunningEntry(),
    getRecentEntries(14),
  ]);

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <TrackerBar projects={projects} tags={tags} running={running} />
      <EntryList entries={entries} projects={projects} tags={tags} />
    </div>
  );
}
