import type { ReactNode } from "react";

export function EmptyState({ eyebrow, title, children, action }: {
  eyebrow?: string;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center py-24 text-center">
      <span className="mb-8 h-px w-16 bg-champagne" />
      {eyebrow && <p className="eyebrow mb-4">{eyebrow}</p>}
      <h2 className="font-display text-4xl font-light">{title}</h2>
      {children && <p className="mt-4 text-sm leading-relaxed text-stone">{children}</p>}
      {action && <div className="mt-10">{action}</div>}
    </div>
  );
}
