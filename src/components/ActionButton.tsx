import type { ButtonHTMLAttributes, ReactNode } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  tone?: "primary" | "secondary" | "danger" | "quiet";
};

export function ActionButton({
  children,
  tone = "primary",
  className = "",
  ...props
}: Props) {
  const styles = {
    primary: "bg-[#2f83c5] text-white hover:bg-[#246ca3]",
    secondary: "bg-[#2f9e44] text-white hover:bg-[#247b35]",
    danger: "bg-[#d92d20] text-white hover:bg-[#b42318]",
    quiet: "border border-[#dfd1bd] bg-white text-[#314057] hover:bg-[#f4eadc]",
  };

  return (
    <button
      type="button"
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-black shadow-sm transition disabled:cursor-not-allowed disabled:opacity-55 ${styles[tone]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

