"use client";

import {
  Baby,
  Boxes,
  CalendarDays,
  ClipboardList,
  Flag,
  FileText,
  HeartPulse,
  Home,
  ListChecks,
  MoreHorizontal,
  Sparkles,
  Sun,
  Syringe,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession } from "@/hooks/useSession";

const primaryNavItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/day", label: "Day", icon: Sun },
  { href: "/notes", label: "Notes", icon: ClipboardList },
  { href: "/trackers", label: "Track", icon: HeartPulse },
];

const secondaryNavItems = [
  { href: "/chores", label: "Chores", icon: ListChecks },
  { href: "/supplies", label: "Supplies", icon: Boxes },
  { href: "/care-manuals", label: "Care", icon: Baby },
  { href: "/calendar", label: "Dates", icon: CalendarDays },
  { href: "/medication", label: "Medicine", icon: Syringe },
  { href: "/development", label: "Goals", icon: Sparkles },
  { href: "/milestones", label: "Moments", icon: Flag },
  { href: "/admin", label: "Admin", icon: FileText, parentOnly: true },
];

export function BottomNav() {
  const pathname = usePathname();
  const { user } = useSession();
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    function closeMoreMenu() {
      setMoreOpen(false);
    }

    window.addEventListener("nanny-quick-opened", closeMoreMenu);
    return () => window.removeEventListener("nanny-quick-opened", closeMoreMenu);
  }, []);

  if (pathname === "/login") {
    return null;
  }

  const visibleSecondaryItems = secondaryNavItems.filter(
    (item) => !item.parentOnly || user?.role === "parent",
  );
  const moreActive = visibleSecondaryItems.some((item) => pathname === item.href);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[calc(env(safe-area-inset-bottom)+0.55rem)] pt-2">
      {moreOpen ? (
        <div className="mx-auto mb-2 max-w-3xl rounded-2xl border border-[#ddceb6] bg-white/95 p-2 shadow-[0_-12px_32px_rgba(23,32,51,0.16)] backdrop-blur-xl">
          <div className="mb-2 flex items-center justify-between px-2">
            <p className="text-sm font-black text-[#172033]">More</p>
            <button
              type="button"
              aria-label="Close more menu"
              onClick={() => setMoreOpen(false)}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-[#536076] transition hover:bg-[#f4eadc]"
            >
              <X size={18} aria-hidden />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {visibleSecondaryItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMoreOpen(false)}
                  className={`flex min-h-[4.25rem] flex-col items-center justify-center gap-1 rounded-xl px-2 text-center text-xs font-black transition ${
                    active
                      ? "bg-[#2f83c5] text-white shadow-sm"
                      : "bg-[#fffaf0] text-[#536076] hover:bg-[#f4eadc]"
                  }`}
                >
                  <Icon size={20} aria-hidden />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="mx-auto grid max-w-3xl grid-cols-5 gap-1 rounded-2xl border border-[#ddceb6] bg-white/90 p-1 shadow-[0_-10px_28px_rgba(23,32,51,0.12)] backdrop-blur-xl">
        {primaryNavItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              onClick={() => setMoreOpen(false)}
              className={`flex min-h-[3.25rem] flex-col items-center justify-center gap-1 rounded-xl px-1 text-[11px] font-black transition ${
                active
                  ? "bg-[#2f83c5] text-white shadow-sm"
                  : "text-[#536076] hover:bg-[#eef6ef]"
              }`}
            >
              <Icon size={18} aria-hidden />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          aria-label="More destinations"
          aria-expanded={moreOpen}
          onClick={() => {
            if (!moreOpen) {
              window.dispatchEvent(new Event("nanny-nav-opened"));
            }
            setMoreOpen((open) => !open);
          }}
          className={`flex min-h-[3.25rem] flex-col items-center justify-center gap-1 rounded-xl px-1 text-[11px] font-black transition ${
            moreActive || moreOpen
              ? "bg-[#2f83c5] text-white shadow-sm"
              : "text-[#536076] hover:bg-[#eef6ef]"
          }`}
        >
          <MoreHorizontal size={18} aria-hidden />
          <span>More</span>
        </button>
      </div>
    </nav>
  );
}
