"use client";

import { CircleQuestionMark, Bell, Clock, LogOut, Menu } from "lucide-react";
import { signOut } from "@/lib/actions/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function initials(email: string): string {
  const name = email.split("@")[0] ?? "";
  const parts = name.split(/[.\-_]/).filter(Boolean);
  const chars = (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
  return (chars || name.slice(0, 2) || "U").toUpperCase();
}

export function Topbar({
  email,
  onToggleSidebar,
}: {
  email: string;
  onToggleSidebar?: () => void;
}) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-2 sm:px-4">
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label="Mostrar ou esconder o menu lateral"
          className="flex h-9 w-9 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#03A9F4] text-white">
          <Clock className="h-5 w-5" />
        </div>
        <span className="text-lg font-bold text-slate-900">Trackify</span>
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
          title="Ajuda"
        >
          <CircleQuestionMark className="h-5 w-5" />
        </button>
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
          title="Notificações"
        >
          <Bell className="h-5 w-5" />
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger className="ml-1 flex h-9 w-9 items-center justify-center rounded-full bg-[#03A9F4] text-sm font-semibold text-white hover:opacity-90">
            {initials(email)}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="truncate px-1.5 py-1 text-xs font-medium text-muted-foreground">
              {email}
            </div>
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
