import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  eyebrow?: string;
  title: ReactNode;
  children?: ReactNode;
  align?: "left" | "center";
  className?: string;
  light?: boolean;
}

export function SectionHeading({ eyebrow, title, children, align = "left", className, light }: SectionHeadingProps) {
  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center", className)}>
      {eyebrow && <p className={cn("eyebrow mb-5", light && "text-ivory/60")}>{eyebrow}</p>}
      <h2 className={cn("display-md", light && "text-ivory")}>{title}</h2>
      {children && <div className={cn("mt-6 text-[0.95rem] leading-relaxed text-stone", light && "text-ivory/70")}>{children}</div>}
    </div>
  );
}
