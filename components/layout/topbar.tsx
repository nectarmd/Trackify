"use client";

import Link from "next/link";
import { Clock, LogOut, Menu, UserRound, Building2, Settings } from "lucide-react";
import { signOut } from "@/lib/actions/auth";
import type { AlertItem } from "@/lib/queries";
import { AlertsMenu } from "@/components/layout/alerts-menu";
import { HelpMenu } from "@/components/layout/help-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function initials(value: string): string {
  const base = value.split("@")[0] ?? value;
  const parts = base.split(/[.\-_\s]/).filter(Boolean);
  const chars = (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
  return (chars || base.slice(0, 2) || "U").toUpperCase();
}

export function Topbar({
  email,
  fullName,
  avatarUrl,
  workspaceName,
  isAdmin = false,
  alerts = [],
  onToggleSidebar,
}: {
  email: string;
  fullName?: string;
  avatarUrl?: string | null;
  workspaceName?: string;
  isAdmin?: boolean;
  alerts?: AlertItem[];
  onToggleSidebar?: () => void;
}) {
  const display = fullName || email;

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-2 sm:px-4">
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label="Mostrar ou esconder o menu lateral"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#03A9F4] text-white">
          <Clock className="h-5 w-5" />
        </div>
        <span className="shrink-0 text-lg font-bold text-slate-900">
          Trackify
        </span>

        {/* No celular o nome do workspace sai da linha (não há espaço): ele
            aparece no menu do avatar e no topo da sidebar. */}
        {workspaceName && (
          <>
            <span className="hidden h-6 w-px shrink-0 bg-slate-200 sm:block" />
            <span className="hidden truncate text-sm font-medium text-slate-600 sm:inline">
              {workspaceName}
            </span>
          </>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
        {/* Engrenagem: atalho direto para Configurações (só faz sentido p/ admin). */}
        {isAdmin && (
          <Link
            href="/configuracoes"
            title="Configurações"
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
          >
            <Settings className="h-5 w-5" />
          </Link>
        )}

        <HelpMenu isAdmin={isAdmin} />
        <AlertsMenu alerts={alerts} isAdmin={isAdmin} />

        <DropdownMenu>
          <DropdownMenuTrigger className="ml-1 flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#03A9F4] text-sm font-semibold text-white hover:opacity-90">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt="Sua foto"
                className="h-full w-full object-cover"
              />
            ) : (
              initials(display)
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <div className="px-1.5 py-1">
              <p className="truncate text-sm font-medium text-slate-800">
                {display}
              </p>
              {fullName && (
                <p className="truncate text-xs text-muted-foreground">{email}</p>
              )}
            </div>

            {workspaceName && (
              <>
                <DropdownMenuSeparator />
                <div className="flex items-center gap-2 px-1.5 py-1">
                  <Building2 className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  <span className="truncate text-xs font-medium text-slate-600">
                    {workspaceName}
                  </span>
                </div>
              </>
            )}

            <DropdownMenuSeparator />
            <DropdownMenuItem
              render={<Link href="/perfil" />}
              className="cursor-pointer"
            >
              <UserRound className="mr-2 h-4 w-4" /> Perfil
            </DropdownMenuItem>

            {isAdmin && (
              <DropdownMenuItem
                render={<Link href="/configuracoes" />}
                className="cursor-pointer"
              >
                <Settings className="mr-2 h-4 w-4" /> Configurações
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={async () => {
                await signOut();
                window.location.href = "/login";
              }}
              className="text-red-600 focus:text-red-600"
            >
              <LogOut className="mr-2 h-4 w-4" /> Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
