import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { Swatch } from "@/types/api";

export function SwatchRow({ swatches, size = "md", className, crossed }: {
  swatches: Swatch[];
  size?: "sm" | "md" | "lg";
  className?: string;
  crossed?: boolean;
}) {
  const dimension = { sm: "h-5 w-5", md: "h-9 w-9", lg: "h-14 w-14" }[size];
  return (
    <ul className={cn("flex flex-wrap gap-2", className)}>
      {swatches.map((swatch) => (
        <li key={swatch.name + swatch.hex}>
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                tabIndex={0}
                aria-label={swatch.name}
                className={cn("relative block rounded-full ring-1 ring-ink/10", dimension)}
                style={{ backgroundColor: swatch.hex }}
              >
                {crossed && <span className="absolute left-1/2 top-1/2 h-px w-[130%] -translate-x-1/2 -translate-y-1/2 -rotate-45 bg-ivory/90" />}
              </span>
            </TooltipTrigger>
            <TooltipContent className="rounded-none border-ink bg-ink px-3 py-1.5 text-[0.7rem] uppercase tracking-[0.18em] text-ivory">
              {swatch.name}
            </TooltipContent>
          </Tooltip>
        </li>
      ))}
    </ul>
  );
}
