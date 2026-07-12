"use client";

import {
  LayoutGrid,
  CircleQuestionMark,
  Bell,
  ChevronsUpDown,
  Clock,
  LogOut,
} from "lucide-react";
import { signOut } from "@/lib/actions/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function initials(email: string): string {
  const name = email.split("@")[0] ?? "";
  const parts = name.split(/[.\-_]/).filter(Boolean);
  const chars = (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
  return (chars || name.slice(0, 2) || "U").toUpperCase();
}

export function Topbar({ email }: { email: string }) {
  const workspaceName = email ? email.split("@")[0] : "Meu Workspace";

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#03A9F4] text-white">
          <Clock className="h-5 w-5" />
        </div>
        <span className="hidden text-lg font-bold text-slate-900 sm:inline">
          Trackify
        </span>

        <span className="mx-1 h-6 w-px bg-slate-200" />

        <button
          type="button"
          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
          title="Grade de aplicativos"
        >
          <LayoutGrid className="h-4 w-4" />
        </button>

        <button
          type="button"
          className="flex max-w-[220px] items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
          title="Trocar de workspace"
        >
          <span className="truncate capitalize">
            {workspaceName}&apos;s workspace
          </span>
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-slate-400" />
        </button>
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
            <DropdownMenuLabel className="truncate">{email}</DropdownMenuLabel>
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
