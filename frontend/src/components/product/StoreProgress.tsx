import { Check, Loader2, X } from "lucide-react";

import type { StoreStatus } from "@/types/api";

/** Live status of each store while a streaming search runs. */
export function StoreProgress({ stores, elapsedMs }: { stores: Record<string, StoreStatus | "pending">; elapsedMs: number | null }) {
  const entries = Object.entries(stores);
  if (!entries.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[0.7rem] uppercase tracking-[0.18em] text-stone" aria-live="polite">
      {entries.map(([name, status]) => (
        <span key={name} className="flex items-center gap-2">
          {status === "pending" ? (
            <Loader2 className="h-3 w-3 animate-spin text-champagne" />
          ) : status.error ? (
            <X className="h-3 w-3 text-bordeaux" />
          ) : (
            <Check className="h-3 w-3 text-sage" />
          )}
          <span className="text-ink">{name}</span>
          {status !== "pending" && (status.error ? <span>{status.error}</span> : <span>{status.count}{status.cached ? " · cached" : ` · ${(status.elapsed_ms / 1000).toFixed(1)}s`}</span>)}
        </span>
      ))}
      {elapsedMs != null && <span className="text-champagne-deep">Edited in {(elapsedMs / 1000).toFixed(1)}s</span>}
    </div>
  );
}
