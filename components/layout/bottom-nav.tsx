"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Clock,
  Table2,
  Calendar,
  BarChart3,
  FolderKanban,
  type LucideIcon,
} from "lucide-react";
import type { PermissionKey, Permissions } from "@/lib/permissions";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  need?: PermissionKey;
};

// Rastreador é a página inicial: fica no centro (3º de 5), à mão do polegar.
const items: NavItem[] = [
  { href: "/planilha", label: "Planilha", icon: Table2, need: "timesheet" },
  { href: "/calendario", label: "Calendário", icon: Calendar, need: "calendar" },
  { href: "/tracker", label: "Rastreador", icon: Clock },
  { href: "/reports", label: "Relatórios", icon: BarChart3, need: "reports" },
  {
    href: "/projects",
    label: "Projetos",
    icon: FolderKanban,
    need: "projects_view",
  },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

export function BottomNav({ permissions }: { permissions?: Permissions }) {
  const pathname = usePathname();

  const visible = items.filter(
    (i) => !i.need || !permissions || permissions[i.need]
  );

  return (
    // Sem reserva de área segura: o menu vai até a borda real da tela, com o
    // menor espaço possível embaixo. O indicador de home do iPhone é
    // translúcido e fica por cima — os ícones continuam visíveis.
    <nav className="flex shrink-0 border-t border-slate-200 bg-white pb-0 md:hidden">
      {visible.map((item) => {
        const Icon = item.icon;
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              // pt-2 pb-1: menos folga embaixo do rótulo que em cima do ícone,
              // para o menu encostar o máximo possível na borda da tela.
              "flex flex-1 flex-col items-center justify-center gap-1 pt-2 pb-1 text-[10px] font-medium transition-colors",
              active
                ? "text-[#03A9F4]"
                : "text-slate-500 hover:text-slate-900"
            )}
          >
            <Icon className="h-5 w-5 shrink-0" />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
