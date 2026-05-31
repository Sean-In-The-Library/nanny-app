import type { ReactNode } from "react";

export function DashboardCard({
  title,
  count,
  tone = "blue",
  children,
}: {
  title: string;
  count?: number;
  tone?: "blue" | "orange" | "green" | "red" | "cream";
  children: ReactNode;
}) {
  const toneClass = {
    blue: "border-[#9cd2ef] bg-[#e8f6fc]",
    orange: "border-[#f5bf7d] bg-[#fff1df]",
    green: "border-[#a9d9a9] bg-[#edf8ed]",
    red: "border-[#f3a5a5] bg-[#fff0ee]",
    cream: "border-[#e8d7bd] bg-[#fffaf0]",
  }[tone];

  return (
    <section className={`rounded-2xl border p-4 shadow-sm ${toneClass}`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-base font-black text-[#172033]">{title}</h2>
        {typeof count === "number" ? (
          <span className="inline-flex min-w-8 justify-center rounded-full bg-white/85 px-2 py-1 text-xs font-black text-[#314057]">
            {count}
          </span>
        ) : null}
      </div>
      {children}
    </section>
  );
}

