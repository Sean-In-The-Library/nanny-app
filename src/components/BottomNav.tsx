"use client";

import {
  Baby,
  Boxes,
  CalendarDays,
  ClipboardList,
  FileText,
  HeartPulse,
  Home,
  ListChecks,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "@/hooks/useSession";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/notes", label: "Notes", icon: ClipboardList },
  { href: "/chores", label: "Chores", icon: ListChecks },
  { href: "/supplies", label: "Supplies", icon: Boxes },
  { href: "/trackers", label: "Track", icon: HeartPulse },
  { href: "/care-manuals", label: "Care", icon: Baby },
  { href: "/calendar", label: "Dates", icon: CalendarDays },
  { href: "/admin", label: "Admin", icon: FileText, parentOnly: true },
];

export function BottomNav() {
  const pathname = usePathname();
  const { user } = useSession();
  if (pathname === "/login") {
    return null;
  }

  const visibleNavItems = navItems.filter(
    (item) => !item.parentOnly || user?.role === "parent",
  );

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[calc(env(safe-area-inset-bottom)+0.55rem)] pt-2">
      <div className="mx-auto flex max-w-3xl gap-1 overflow-x-auto rounded-2xl border border-[#ddceb6] bg-white/90 p-1 shadow-[0_-10px_28px_rgba(23,32,51,0.12)] backdrop-blur-xl">
        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={`flex min-h-[3.25rem] min-w-[4.4rem] flex-col items-center justify-center gap-1 rounded-xl px-2 text-[11px] font-black transition ${
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
      </div>
    </nav>
  );
}
