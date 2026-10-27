import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

/** Selectable pill used for styles, occasions, stores and filters. */
export function Chip({ selected, className, children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { selected?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(
        "h-10 rounded-full border px-5 text-[0.78rem] capitalize tracking-wide transition-all duration-300 ease-couture",
        selected ? "border-ink bg-ink text-ivory" : "border-hairline bg-porcelain/60 text-graphite hover:border-ink/50",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
