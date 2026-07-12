/**
 * Tipos e rótulos das permissões. Este arquivo é IMPORTADO POR COMPONENTES DE
 * CLIENTE (sidebar, menu inferior, configurações), então não pode tocar em
 * nada server-only — as funções que leem o banco vivem em permissions-server.ts.
 *
 * Regra do produto: o colaborador entra vendo só o BÁSICO (Rastreador +
 * Planilha, e apenas o próprio tempo). Todo o resto é liberado pelo admin.
 */

export const PERMISSION_KEYS = [
  // Dados
  "see_all_time",
  // Páginas de trabalho
  "timesheet",
  "calendar",
  "planner",
  "expenses",
  "time_off",
  // Análise
  "reports",
  "activity",
  // Gerenciar
  "projects_view",
  "projects_manage",
  "clients_view",
  "tags_view",
  "tags_manage",
  "team_view",
  "approvals",
  "kiosks",
] as const;

export type PermissionKey = (typeof PERMISSION_KEYS)[number];
export type Permissions = Record<PermissionKey, boolean>;

export type PermissionGroup = "Dados" | "Trabalho" | "Análise" | "Gerenciar";

export const PERMISSION_LABELS: Record<
  PermissionKey,
  { title: string; description: string; group: PermissionGroup }
> = {
  see_all_time: {
    group: "Dados",
    title: "Ver o tempo de toda a equipe",
    description:
      "Desligado, o colaborador só enxerga as próprias entradas — no Rastreador, na Planilha e em qualquer relatório.",
  },

  timesheet: {
    group: "Trabalho",
    title: "Planilha",
    description: "Grade semanal de horas por projeto.",
  },
  calendar: {
    group: "Trabalho",
    title: "Calendário",
    description: "Visão semanal das entradas em blocos.",
  },
  planner: {
    group: "Trabalho",
    title: "Planejador",
    description: "Ver os planejamentos atribuídos a ele.",
  },
  expenses: {
    group: "Trabalho",
    title: "Despesas",
    description: "Ver e lançar despesas do workspace.",
  },
  time_off: {
    group: "Trabalho",
    title: "Folgas",
    description: "Acesso à página de folgas.",
  },

  reports: {
    group: "Análise",
    title: "Relatórios e Painel",
    description: "Totais, gráficos e exportação.",
  },
  activity: {
    group: "Análise",
    title: "Atividade",
    description: "Acesso à página de atividade.",
  },

  projects_view: {
    group: "Gerenciar",
    title: "Ver a página de Projetos",
    description:
      "Mesmo desligado, o colaborador continua escolhendo o projeto no Rastreador — sem isso ele não teria como apontar o tempo.",
  },
  projects_manage: {
    group: "Gerenciar",
    title: "Criar e editar projetos e clientes",
    description: "Criar, editar e arquivar.",
  },
  clients_view: {
    group: "Gerenciar",
    title: "Ver a página de Clientes",
    description: "Lista de clientes do workspace.",
  },
  tags_view: {
    group: "Gerenciar",
    title: "Ver a página de Tags",
    description:
      "Mesmo desligado, ele continua podendo aplicar as tags existentes numa entrada.",
  },
  tags_manage: {
    group: "Gerenciar",
    title: "Criar e editar tags",
    description: "Criar, renomear e excluir tags.",
  },
  team_view: {
    group: "Gerenciar",
    title: "Ver a equipe",
    description:
      "Ver quem são os colegas do workspace. Desligado, ele não enxerga os outros membros.",
  },
  approvals: {
    group: "Gerenciar",
    title: "Aprovações",
    description: "Acesso à página de aprovações.",
  },
  kiosks: {
    group: "Gerenciar",
    title: "Quiosques",
    description: "Acesso à página de quiosques.",
  },
};

export const PERMISSION_GROUPS: PermissionGroup[] = [
  "Dados",
  "Trabalho",
  "Análise",
  "Gerenciar",
];

export const ALL_TRUE: Permissions = PERMISSION_KEYS.reduce(
  (acc, k) => ({ ...acc, [k]: true }),
  {} as Permissions
);

export const ALL_FALSE: Permissions = PERMISSION_KEYS.reduce(
  (acc, k) => ({ ...acc, [k]: false }),
  {} as Permissions
);

export function normalizePermissions(raw: unknown): Permissions {
  const obj = (raw ?? {}) as Record<string, unknown>;
  const out = { ...ALL_FALSE };
  for (const k of PERMISSION_KEYS) out[k] = obj[k] === true;
  return out;
}
