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
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[#ddceb6] bg-[#fffaf0]/95 px-2 py-2 shadow-[0_-8px_24px_rgba(23,32,51,0.08)] backdrop-blur">
      <div
        className="mx-auto grid max-w-3xl gap-1"
        style={{ gridTemplateColumns: `repeat(${visibleNavItems.length}, minmax(0, 1fr))` }}
      >
        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[11px] font-semibold transition ${
                active
                  ? "bg-[#2f83c5] text-white"
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
