export type Client = {
  id: string;
  user_id: string;
  name: string;
  archived: boolean;
  created_at: string;
};

export type Project = {
  id: string;
  user_id: string;
  client_id: string | null;
  name: string;
  color: string;
  billable_default: boolean;
  archived: boolean;
  created_at: string;
};

export type Tag = {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
};

export type TimeEntry = {
  id: string;
  user_id: string;
  project_id: string | null;
  description: string;
  start_time: string;
  end_time: string | null;
  billable: boolean;
  created_at: string;
};

export type ProjectWithClient = Project & {
  client: Client | null;
};

export type TimeEntryWithRelations = TimeEntry & {
  project: ProjectWithClient | null;
  tags: Tag[];
};

export type Expense = {
  id: string;
  user_id: string;
  project_id: string | null;
  date: string;
  category: string;
  description: string;
  amount: number;
  billable: boolean;
  created_at: string;
};

export type ExpenseWithProject = Expense & {
  project: ProjectWithClient | null;
};

export type Plan = {
  id: string;
  user_id: string;
  project_id: string | null;
  title: string;
  start_date: string;
  end_date: string;
  notes: string | null;
  created_at: string;
};

export type PlanWithProject = Plan & {
  project: ProjectWithClient | null;
};

export type TeamMemberRole = "admin" | "member";

export type TeamMember = {
  id: string;
  user_id: string;
  email: string;
  name: string | null;
  role: TeamMemberRole;
  status: string;
  created_at: string;
};

export const PROJECT_COLORS = [
  "#03A9F4",
  "#4CAF50",
  "#F44336",
  "#FF9800",
  "#9C27B0",
  "#E91E63",
  "#009688",
  "#3F51B5",
  "#795548",
  "#607D8B",
];
