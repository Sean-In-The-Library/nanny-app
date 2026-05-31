"use client";

import { LogOut, Menu } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { BottomNav } from "./BottomNav";
import { useSession } from "@/hooks/useSession";

export function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useSession();

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-[#f7f2e8] text-[#172033]">
      <header className="sticky top-0 z-30 border-b border-[#e6dbc7] bg-[#fffaf0]/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#3a9fd9] text-white shadow-sm">
              <Menu size={20} aria-hidden />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#314057]">Family Nanny Hub</p>
              <p className="text-xs text-[#667085]">
                {user ? `${user.name} ${user.role === "parent" ? "parent" : "nanny"} view` : "Loading"}
              </p>
            </div>
          </div>
          {pathname !== "/login" ? (
            <button
              type="button"
              onClick={logout}
              className="inline-flex h-10 items-center gap-2 rounded-full border border-[#dfd1bd] bg-white px-3 text-sm font-semibold text-[#314057] shadow-sm transition hover:bg-[#f3eadc]"
            >
              <LogOut size={16} aria-hidden />
              Logout
            </button>
          ) : null}
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 pb-28 pt-4 sm:px-6 lg:px-8">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}

