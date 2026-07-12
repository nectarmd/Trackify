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
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: LucideIcon };

const mainNav: NavItem[] = [
  // Rastreador é a página inicial do app: vem primeiro.
  { href: "/tracker", label: "RASTREADOR", icon: Clock },
  { href: "/planilha", label: "PLANILHA", icon: Table2 },
  { href: "/calendario", label: "CALENDÁRIO", icon: Calendar },
  { href: "/planejador", label: "PLANEJADOR", icon: ClipboardList },
  { href: "/despesas", label: "DESPESAS", icon: Receipt },
  { href: "/folgas", label: "FOLGAS", icon: Plane },
];

const analyzeNav: NavItem[] = [
  { href: "/painel", label: "PAINEL", icon: LayoutDashboard },
  { href: "/reports", label: "RELATÓRIOS", icon: BarChart3 },
  { href: "/atividade", label: "ATIVIDADE", icon: Activity },
];

const manageNav: NavItem[] = [
  { href: "/projects", label: "PROJETOS", icon: FolderKanban },
  { href: "/clients", label: "CLIENTES", icon: Users },
  { href: "/tags", label: "TAGS", icon: TagIcon },
  { href: "/equipes", label: "EQUIPES", icon: UsersRound },
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
  onNavigate,
}: {
  className?: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "flex w-60 shrink-0 flex-col border-r border-slate-200 bg-white",
        className
      )}
    >
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {mainNav.map((item) => (
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
        {analyzeNav.map((item) => (
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
        {manageNav.map((item) => (
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
