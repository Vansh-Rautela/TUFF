import { Link } from "react-router-dom";

import { cn } from "@/lib/utils";

export function Logo({ className, light = false }: { className?: string; light?: boolean }) {
  return (
    <Link
      to="/"
      aria-label="TUFF home"
      className={cn(
        "font-display text-[1.65rem] font-medium leading-none tracking-[0.42em] transition-colors duration-500",
        light ? "text-ivory" : "text-ink",
        className,
      )}
    >
      TUFF
    </Link>
  );
}
