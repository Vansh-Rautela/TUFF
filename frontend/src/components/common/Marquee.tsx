import type { ReactNode } from "react";

export function Marquee({ items, separator = "✦" }: { items: ReactNode[]; separator?: ReactNode }) {
  const row = (hidden?: boolean) => (
    <div aria-hidden={hidden} className="flex shrink-0 items-center gap-10 pr-10">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-10 font-display text-3xl font-light italic text-graphite sm:text-4xl">
          {item}
          <span className="text-sm not-italic text-champagne">{separator}</span>
        </span>
      ))}
    </div>
  );
  return (
    <div className="flex overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_10%,black_90%,transparent)]">
      <div className="flex animate-marquee">
        {row()}
        {row(true)}
      </div>
    </div>
  );
}
