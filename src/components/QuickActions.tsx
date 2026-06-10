"use client";

import {
  CalendarPlus,
  ClipboardPlus,
  HeartPulse,
  NotebookPen,
  PackagePlus,
  Pill,
  Plus,
  Sparkles,
  Sun,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession } from "@/hooks/useSession";

type QuickActionMode = "parent" | "nanny";

const parentActions = [
  {
    href: "/day",
    label: "Day Log",
    helper: "Today at a glance",
    icon: Sun,
  },
  {
    href: "/notes?new=1",
    label: "Note",
    helper: "Tell Faith",
    icon: NotebookPen,
  },
  {
    href: "/trackers?new=1",
    label: "Status",
    helper: "Child update",
    icon: HeartPulse,
  },
  {
    href: "/supplies?new=1",
    label: "Supply",
    helper: "Running low",
    icon: PackagePlus,
  },
  {
    href: "/medication?new=1",
    label: "Medicine",
    helper: "Log dose",
    icon: Pill,
  },
  {
    href: "/care-manuals?draft=1",
    label: "Draft",
    helper: "Care manual",
    icon: Sparkles,
  },
];

const nannyActions = [
  {
    href: "/day",
    label: "Day Log",
    helper: "Open today's log",
    icon: Sun,
  },
  {
    href: "/trackers?new=1",
    label: "Status",
    helper: "Child update",
    icon: HeartPulse,
  },
  {
    href: "/notes?new=1",
    label: "Note",
    helper: "Message home",
    icon: NotebookPen,
  },
  {
    href: "/supplies?new=1",
    label: "Supply",
    helper: "Running low",
    icon: PackagePlus,
  },
  {
    href: "/chores",
    label: "Chores",
    helper: "Today list",
    icon: ClipboardPlus,
  },
  {
    href: "/calendar?new=1",
    label: "Date",
    helper: "Add event",
    icon: CalendarPlus,
  },
];

export function QuickActionStrip({ mode }: { mode: QuickActionMode }) {
  const actions = mode === "parent" ? parentActions : nannyActions;

  return (
    <section className="rounded-2xl border border-[#d7c8b4] bg-white p-3 shadow-sm">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className="flex min-h-[76px] items-center gap-3 rounded-xl border border-[#eadfcd] bg-[#fffaf0] p-3 transition hover:border-[#2f83c5] hover:bg-[#e8f6fc]"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[#2f83c5] shadow-sm">
                <Icon size={18} aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-black text-[#172033]">
                  {action.label}
                </span>
                <span className="block truncate text-xs font-bold text-[#667085]">
                  {action.helper}
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export function QuickActionDock() {
  const pathname = usePathname();
  const { user } = useSession();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function closeQuickMenu() {
      setOpen(false);
    }

    window.addEventListener("nanny-nav-opened", closeQuickMenu);
    return () => window.removeEventListener("nanny-nav-opened", closeQuickMenu);
  }, []);

  if (pathname === "/" || pathname === "/login") {
    return null;
  }

  const actions = user?.role === "nanny" ? nannyActions : parentActions;

  return (
    <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+5.15rem)] right-3 z-50 flex flex-col items-end gap-2 sm:right-6">
      {open ? (
        <div className="w-[min(18rem,calc(100vw-1.5rem))] rounded-2xl border border-[#d7c8b4] bg-white p-2 shadow-[0_18px_48px_rgba(23,32,51,0.22)]">
          <div className="grid gap-1">
            {actions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.href}
                  href={action.href}
                  onClick={() => setOpen(false)}
                  className="flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm font-black text-[#172033] transition hover:bg-[#e8f6fc]"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#fffaf0] text-[#2f83c5]">
                    <Icon size={17} aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="block">{action.label}</span>
                    <span className="block truncate text-xs font-bold text-[#667085]">
                      {action.helper}
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => {
          if (!open) {
            window.dispatchEvent(new Event("nanny-quick-opened"));
          }
          setOpen((current) => !current);
        }}
        title={open ? "Close quick actions" : "Open quick actions"}
        className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#172033] px-4 text-sm font-black text-white shadow-[0_14px_32px_rgba(23,32,51,0.28)] transition hover:bg-[#2f83c5]"
      >
        {open ? <X size={18} aria-hidden /> : <Plus size={18} aria-hidden />}
        Quick
      </button>
    </div>
  );
}
