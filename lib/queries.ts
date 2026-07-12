import { subDays } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import type {
  Client,
  Tag,
  ProjectWithClient,
  TimeEntryWithRelations,
  ExpenseWithProject,
  PlanWithProject,
  WorkspaceMember,
  WorkspaceInvite,
} from "@/lib/types";

const ENTRY_SELECT = `
  id, user_id, project_id, description, start_time, end_time, billable, created_at,
  project:projects ( id, user_id, client_id, name, color, billable_default, archived, created_at,
    client:clients ( id, user_id, name, archived, created_at ) ),
  time_entry_tags ( tag:tags ( id, user_id, name, created_at ) )
`;

type RawEntry = Record<string, unknown> & {
  time_entry_tags?: { tag: Tag | null }[] | null;
};

function mapEntry(raw: RawEntry): TimeEntryWithRelations {
  const tags = (raw.time_entry_tags ?? [])
    .map((t) => t.tag)
    .filter((t): t is Tag => Boolean(t));
  const { time_entry_tags, ...rest } = raw;
  void time_entry_tags;
  return { ...(rest as object), tags } as TimeEntryWithRelations;
}

export async function getClients(
  includeArchived = false
): Promise<Client[]> {
  const supabase = await createClient();
  let q = supabase.from("clients").select("*").order("name");
  if (!includeArchived) q = q.eq("archived", false);
  const { data } = await q;
  return (data as Client[]) ?? [];
}

export async function getProjects(
  includeArchived = false
): Promise<ProjectWithClient[]> {
  const supabase = await createClient();
  let q = supabase
    .from("projects")
    .select("*, client:clients(*)")
    .order("name");
  if (!includeArchived) q = q.eq("archived", false);
  const { data } = await q;
  return (data as unknown as ProjectWithClient[]) ?? [];
}

export async function getTags(): Promise<Tag[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("tags").select("*").order("name");
  return (data as Tag[]) ?? [];
}

export async function getRunningEntry(): Promise<TimeEntryWithRelations | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("time_entries")
    .select(ENTRY_SELECT)
    .is("end_time", null)
    .order("start_time", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ? mapEntry(data as unknown as RawEntry) : null;
}

export async function getRecentEntries(
  days = 14
): Promise<TimeEntryWithRelations[]> {
  const supabase = await createClient();
  const since = subDays(new Date(), days).toISOString();
  const { data } = await supabase
    .from("time_entries")
    .select(ENTRY_SELECT)
    .not("end_time", "is", null)
    .gte("start_time", since)
    .order("start_time", { ascending: false });
  return ((data as unknown as RawEntry[]) ?? []).map(mapEntry);
}

export async function getEntriesInRange(
  startISO: string,
  endISO: string
): Promise<TimeEntryWithRelations[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("time_entries")
    .select(ENTRY_SELECT)
    .not("end_time", "is", null)
    .gte("start_time", startISO)
    .lte("start_time", endISO)
    .order("start_time", { ascending: false });
  return ((data as unknown as RawEntry[]) ?? []).map(mapEntry);
}

export async function getExpenses(): Promise<ExpenseWithProject[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("expenses")
    .select("*, project:projects(*, client:clients(*))")
    .order("date", { ascending: false });
  return (data as unknown as ExpenseWithProject[]) ?? [];
}

export async function getPlans(): Promise<PlanWithProject[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("plans")
    .select("*, project:projects(*, client:clients(*))")
    .order("start_date", { ascending: true });
  return (data as unknown as PlanWithProject[]) ?? [];
}

export async function getWorkspaceMembers(): Promise<WorkspaceMember[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("workspace_members")
    .select("*")
    .order("created_at", { ascending: true });
  return (data as WorkspaceMember[]) ?? [];
}

export async function getPendingInvites(): Promise<WorkspaceInvite[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("workspace_invites")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: true });
  return (data as WorkspaceInvite[]) ?? [];
}
