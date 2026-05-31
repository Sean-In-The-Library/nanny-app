import type { Priority, SupplyStatus } from "@/lib/types";

export function PriorityPill({
  value,
}: {
  value: Priority | SupplyStatus | "overdue" | "due";
}) {
  const styles: Record<string, string> = {
    urgent: "bg-[#d92d20] text-white",
    important: "bg-[#f79009] text-[#221305]",
    normal: "bg-[#d9f0ff] text-[#184b72]",
    overdue: "bg-[#d92d20] text-white",
    due: "bg-[#fdb022] text-[#221305]",
    out: "bg-[#d92d20] text-white",
    last_one_opened: "bg-[#f79009] text-[#221305]",
    running_low: "bg-[#fdb022] text-[#221305]",
    ordered: "bg-[#d1fadf] text-[#05603a]",
    resolved: "bg-[#e5e7eb] text-[#344054]",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-black capitalize ${
        styles[value] ?? styles.normal
      }`}
    >
      {value.replaceAll("_", " ")}
    </span>
  );
}

