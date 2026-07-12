"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Clock,
  Table2,
  Calendar,
  ClipboardList,
  Receipt,
  Plane,
  LayoutDashboard,
  BarChart3,
  Activity,
  FolderKanban,
  Users,
  Tag as TagIcon,
  UsersRound,
  ClipboardCheck,
  Monitor,
  Building2,
  Settings,
  type LucideIcon,
} from "lucide-react";
import type { PermissionKey, Permissions } from "@/lib/permissions";
import { cn } from "@/lib/utils";

/** `need` = permissão exigida; `adminOnly` = só admin vê. */
type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  need?: PermissionKey;
  adminOnly?: boolean;
};

const mainNav: NavItem[] = [
  // Rastreador é a página inicial do app: vem primeiro.
  { href: "/tracker", label: "RASTREADOR", icon: Clock },
  { href: "/planilha", label: "PLANILHA", icon: Table2, need: "timesheet" },
  { href: "/calendario", label: "CALENDÁRIO", icon: Calendar, need: "calendar" },
  {
    href: "/planejador",
    label: "PLANEJADOR",
    icon: ClipboardList,
    need: "planner",
  },
  { href: "/despesas", label: "DESPESAS", icon: Receipt, need: "expenses" },
  { href: "/folgas", label: "FOLGAS", icon: Plane },
];

const analyzeNav: NavItem[] = [
  { href: "/painel", label: "PAINEL", icon: LayoutDashboard, need: "reports" },
  { href: "/reports", label: "RELATÓRIOS", icon: BarChart3, need: "reports" },
  { href: "/atividade", label: "ATIVIDADE", icon: Activity },
];

const manageNav: NavItem[] = [
  { href: "/projects", label: "PROJETOS", icon: FolderKanban },
  { href: "/clients", label: "CLIENTES", icon: Users },
  { href: "/tags", label: "TAGS", icon: TagIcon },
  { href: "/equipes", label: "EQUIPES", icon: UsersRound },
  {
    href: "/configuracoes",
    label: "CONFIGURAÇÕES",
    icon: Settings,
    adminOnly: true,
  },
  { href: "/aprovacoes", label: "APROVAÇÕES", icon: ClipboardCheck },
  { href: "/quiosques", label: "QUIOSQUES", icon: Monitor },
];

function NavLink({
  item,
  active,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "relative flex items-center gap-3 rounded-md px-3 py-2 text-[13px] font-medium transition-colors",
        active
          ? "bg-[#03A9F4]/10 text-[#03A9F4]"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      )}
    >
      {active && (
        <span className="absolute left-0 top-1 bottom-1 w-1 rounded-r bg-[#03A9F4]" />
      )}
      <Icon className="h-[18px] w-[18px] shrink-0" />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

export function Sidebar({
  className,
  workspaceName,
  permissions,
  isAdmin,
  onNavigate,
}: {
  className?: string;
  workspaceName?: string;
  permissions?: Permissions;
  isAdmin?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  // O menu é só o reflexo do que o RLS já garante no banco.
  function visible(items: NavItem[]) {
    return items.filter((item) => {
      if (item.adminOnly && !isAdmin) return false;
      if (item.need && permissions && !permissions[item.need]) return false;
      return true;
    });
  }

  return (
    <aside
      className={cn(
        "flex w-60 shrink-0 flex-col border-r border-slate-200 bg-white",
        className
      )}
    >
      {workspaceName && (
        <div className="flex items-center gap-2 border-b border-slate-200 bg-[#F3F4F6] px-4 py-3">
          <Building2 className="h-4 w-4 shrink-0 text-slate-400" />
          <span className="truncate text-sm font-semibold text-slate-700">
            {workspaceName}
          </span>
        </div>
      )}

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {visible(mainNav).map((item) => (
          <NavLink
            key={item.href}
            item={item}
            active={isActive(pathname, item.href)}
            onNavigate={onNavigate}
          />
        ))}

        <p className="px-3 pb-1 pt-5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Analisar
        </p>
        {visible(analyzeNav).map((item) => (
          <NavLink
            key={item.href}
            item={item}
            active={isActive(pathname, item.href)}
            onNavigate={onNavigate}
          />
        ))}

        <p className="px-3 pb-1 pt-5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Gerenciar
        </p>
        {visible(manageNav).map((item) => (
          <NavLink
            key={item.href}
            item={item}
            active={isActive(pathname, item.href)}
            onNavigate={onNavigate}
          />
        ))}
      </nav>
    </aside>
  );
}
