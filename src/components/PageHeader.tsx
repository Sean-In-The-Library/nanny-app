import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  children,
}: {
  eyebrow?: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? (
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#d97706]">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-2xl font-black leading-tight text-[#172033] sm:text-3xl">
          {title}
        </h1>
      </div>
      {children}
    </div>
  );
}

