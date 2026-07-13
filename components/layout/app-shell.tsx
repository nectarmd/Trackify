"use client";

import { useState } from "react";
import type { Permissions } from "@/lib/permissions";
import type { AlertItem } from "@/lib/queries";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { BottomNav } from "@/components/layout/bottom-nav";

export function AppShell({
  email,
  fullName,
  avatarUrl,
  workspaceName,
  permissions,
  isAdmin,
  alerts,
  children,
}: {
  email: string;
  fullName?: string;
  avatarUrl?: string | null;
  workspaceName?: string;
  permissions?: Permissions;
  isAdmin?: boolean;
  alerts?: AlertItem[];
  children: React.ReactNode;
}) {
  // Gaveta no mobile; colapso no desktop.
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState(true);

  function toggleSidebar() {
    const isDesktop = window.matchMedia("(min-width: 768px)").matches;
    if (isDesktop) setDesktopOpen((v) => !v);
    else setMobileOpen((v) => !v);
  }

  return (
    // fixed inset-0: prende o shell à viewport. Com h-dvh no fluxo normal, o
    // iOS/PWA recalculava a altura ao navegar e empurrava o menu inferior para
    // fora da tela. Fixo, o menu é sempre o último item visível.
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-slate-50 text-slate-900">
      <Topbar
        email={email}
        fullName={fullName}
        avatarUrl={avatarUrl}
        workspaceName={workspaceName}
        isAdmin={isAdmin}
        alerts={alerts}
        onToggleSidebar={toggleSidebar}
      />

      <div className="relative flex min-h-0 flex-1">
        {desktopOpen && (
          <Sidebar
            className="hidden md:flex"
            workspaceName={workspaceName}
            permissions={permissions}
            isAdmin={isAdmin}
          />
        )}

        {mobileOpen && (
          <>
            <button
              type="button"
              aria-label="Fechar menu"
              onClick={() => setMobileOpen(false)}
              className="absolute inset-0 z-40 bg-black/40 md:hidden"
            />
            <Sidebar
              className="absolute inset-y-0 left-0 z-50 shadow-xl md:hidden"
              workspaceName={workspaceName}
              permissions={permissions}
              isAdmin={isAdmin}
              onNavigate={() => setMobileOpen(false)}
            />
          </>
        )}

        <main className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden">
          {children}
        </main>
      </div>

      <BottomNav permissions={permissions} />
    </div>
  );
}
