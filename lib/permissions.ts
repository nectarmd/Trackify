/**
 * Tipos e rótulos das permissões. Este arquivo é IMPORTADO POR COMPONENTES DE
 * CLIENTE (sidebar, menu inferior, configurações), então não pode tocar em
 * nada server-only — as funções que leem o banco vivem em permissions-server.ts.
 */

export const PERMISSION_KEYS = [
  "see_all_time",
  "reports",
  "timesheet",
  "calendar",
  "expenses",
  "planner",
  "projects_manage",
  "tags_manage",
] as const;

export type PermissionKey = (typeof PERMISSION_KEYS)[number];
export type Permissions = Record<PermissionKey, boolean>;

export const PERMISSION_LABELS: Record<
  PermissionKey,
  { title: string; description: string }
> = {
  see_all_time: {
    title: "Ver o tempo de toda a equipe",
    description:
      "Se desligado, o colaborador só enxerga as próprias entradas de tempo.",
  },
  reports: {
    title: "Relatórios e Painel",
    description: "Acesso aos totais, gráficos e exportação.",
  },
  timesheet: {
    title: "Planilha",
    description: "Grade semanal de horas por projeto.",
  },
  calendar: {
    title: "Calendário",
    description: "Visão semanal das entradas em blocos.",
  },
  expenses: {
    title: "Despesas",
    description: "Ver e lançar despesas do workspace.",
  },
  planner: {
    title: "Planejador",
    description: "Ver e criar planejamentos.",
  },
  projects_manage: {
    title: "Gerenciar projetos e clientes",
    description:
      "Criar, editar e arquivar. Mesmo desligado, o colaborador continua vendo os projetos para apontar o tempo.",
  },
  tags_manage: {
    title: "Gerenciar tags",
    description: "Criar, renomear e excluir tags.",
  },
};

export const ALL_TRUE: Permissions = {
  see_all_time: true,
  reports: true,
  timesheet: true,
  calendar: true,
  expenses: true,
  planner: true,
  projects_manage: true,
  tags_manage: true,
};

export const ALL_FALSE: Permissions = {
  see_all_time: false,
  reports: false,
  timesheet: false,
  calendar: false,
  expenses: false,
  planner: false,
  projects_manage: false,
  tags_manage: false,
};

export function normalizePermissions(raw: unknown): Permissions {
  const obj = (raw ?? {}) as Record<string, unknown>;
  const out = { ...ALL_FALSE };
  for (const k of PERMISSION_KEYS) out[k] = obj[k] === true;
  return out;
}
