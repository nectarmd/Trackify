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
    // fixed + top-0 ancora no topo; h-dvh define a altura pela viewport dinâmica.
    //
    // Só `inset-0` não bastava: no PWA do iOS (status bar translúcido) o retângulo
    // do `bottom: 0` é calculado errado, e o shell terminava dezenas de pixels
    // acima da borda real — o fundo branco da página aparecia sob o menu, dando
    // a impressão de uma faixa vazia. Com a altura vinda do dvh, o shell vai até
    // o fim da tela e o menu encosta no fundo.
    <div className="fixed inset-x-0 top-0 flex h-dvh flex-col overflow-hidden bg-slate-50 text-slate-900">
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

        {/* overscroll-contain: ao chegar no fim da lista, o gesto não "vaza"
            para o documento (que voltaria a arrastar a tela inteira). */}
        <main className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain">
          {children}
        </main>
      </div>

      <BottomNav permissions={permissions} />
    </div>
  );
}
