"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { BottomNav } from "@/components/layout/bottom-nav";

export function AppShell({
  email,
  children,
}: {
  email: string;
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
    <div className="flex h-dvh flex-col overflow-hidden bg-slate-50 text-slate-900">
      <Topbar email={email} onToggleSidebar={toggleSidebar} />

      <div className="relative flex min-h-0 flex-1">
        {desktopOpen && <Sidebar className="hidden md:flex" />}

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
              onNavigate={() => setMobileOpen(false)}
            />
          </>
        )}

        <main className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden">
          {children}
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
