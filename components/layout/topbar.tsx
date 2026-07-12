"use client";

import Link from "next/link";
import {
  CircleQuestionMark,
  Bell,
  Clock,
  LogOut,
  Menu,
  UserRound,
} from "lucide-react";
import { signOut } from "@/lib/actions/auth";
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
  onToggleSidebar,
}: {
  email: string;
  fullName?: string;
  avatarUrl?: string | null;
  workspaceName?: string;
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
        <span className="hidden shrink-0 text-lg font-bold text-slate-900 sm:inline">
          Trackify
        </span>

        {workspaceName && (
          <>
            <span className="hidden h-6 w-px shrink-0 bg-slate-200 sm:block" />
            {/* Só exibe: a edição é no Perfil. */}
            <span className="truncate text-sm font-medium text-slate-600">
              {workspaceName}
            </span>
          </>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          className="hidden h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 sm:flex"
          title="Ajuda"
        >
          <CircleQuestionMark className="h-5 w-5" />
        </button>
        <button
          type="button"
          className="hidden h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 sm:flex"
          title="Notificações"
        >
          <Bell className="h-5 w-5" />
        </button>

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
          <DropdownMenuContent align="end" className="w-60">
            <div className="px-1.5 py-1">
              <p className="truncate text-sm font-medium text-slate-800">
                {display}
              </p>
              {fullName && (
                <p className="truncate text-xs text-muted-foreground">
                  {email}
                </p>
              )}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              render={<Link href="/perfil" />}
              className="cursor-pointer"
            >
              <UserRound className="mr-2 h-4 w-4" /> Perfil
            </DropdownMenuItem>
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
