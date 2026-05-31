export function EmptyState({ text = "Nothing needs attention here." }: { text?: string }) {
  return (
    <p className="rounded-xl border border-dashed border-[#d8c9b4] bg-white/70 p-4 text-sm font-semibold text-[#667085]">
      {text}
    </p>
  );
}

