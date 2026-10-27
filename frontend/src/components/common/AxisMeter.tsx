import { motion } from "framer-motion";

/** A labelled 0-100 scale between two words (e.g. Cool ←→ Warm). */
export function AxisMeter({ label, left, right, value }: { label: string; left: string; right: string; value: number }) {
  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between">
        <span className="eyebrow text-ink">{label}</span>
        <span className="font-display text-xl">{value}</span>
      </div>
      <div className="relative h-px bg-hairline">
        <motion.span
          className="absolute -top-[5px] h-[11px] w-[11px] -translate-x-1/2 rotate-45 border border-ink bg-champagne"
          initial={{ left: "50%" }}
          animate={{ left: `${value}%` }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
      <div className="mt-3 flex justify-between text-[0.7rem] uppercase tracking-[0.18em] text-stone">
        <span>{left}</span>
        <span>{right}</span>
      </div>
    </div>
  );
}
