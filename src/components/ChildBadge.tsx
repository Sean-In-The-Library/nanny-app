import type { ChildName } from "@/lib/types";

export function ChildBadge({ child }: { child: ChildName }) {
  const className =
    child === "Kieran"
      ? "bg-[#d9f0ff] text-[#184b72]"
      : "bg-[#ddf7c8] text-[#2d5a1f]";
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-black ${className}`}>
      {child}
    </span>
  );
}

