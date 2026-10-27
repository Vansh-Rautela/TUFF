import { useEffect, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useTransform, type MotionValue, type PanInfo } from "framer-motion";
import { ExternalLink, Heart, RotateCcw, Star, X } from "lucide-react";

import { ProductImage } from "@/components/product/ProductImage";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { DeckCard, SwipeAction, Swatch } from "@/types/api";

const DISTANCE = 110;
const EXIT: Record<SwipeAction, { x: number; y: number; rotate: number }> = {
  like: { x: 700, y: 40, rotate: 18 },
  dislike: { x: -700, y: 40, rotate: -18 },
  love: { x: 0, y: -900, rotate: 0 },
};

function Stamp({ label, opacity, className }: { label: string; opacity: MotionValue<number>; className: string }) {
  return (
    <motion.span style={{ opacity }}
      className={cn("pointer-events-none absolute z-10 border px-4 py-2 text-[0.7rem] font-medium uppercase tracking-[0.32em] backdrop-blur-sm", className)}>
      {label}
    </motion.span>
  );
}

function Card({ card, palette, flipped, onFlip, onDecide, exitAction }: {
  card: DeckCard;
  palette: Swatch[];
  flipped: boolean;
  onFlip: () => void;
  onDecide: (action: SwipeAction) => void;
  exitAction: SwipeAction;
}) {
  const { product } = card;
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-300, 300], [-12, 12]);
  const keep = useTransform(x, [30, DISTANCE], [0, 1]);
  const pass = useTransform(x, [-DISTANCE, -30], [1, 0]);
  const love = useTransform(y, [-DISTANCE, -30], [1, 0]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    const { offset, velocity } = info;
    if (offset.y < -DISTANCE && Math.abs(offset.x) < DISTANCE) onDecide("love");
    else if (offset.x > DISTANCE || velocity.x > 700) onDecide("like");
    else if (offset.x < -DISTANCE || velocity.x < -700) onDecide("dislike");
  };

  return (
    <motion.div
      className="absolute inset-0 cursor-grab touch-none [perspective:1600px] active:cursor-grabbing"
      style={{ x, y, rotate }}
      drag
      dragSnapToOrigin
      dragElastic={0.85}
      onDragEnd={onDragEnd}
      onTap={onFlip}
      initial={{ scale: 0.94, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ ...EXIT[exitAction], opacity: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }}
    >
      <motion.div className="relative h-full w-full [transform-style:preserve-3d]"
        animate={{ rotateY: flipped ? 180 : 0 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
        {/* Front */}
        <div className="absolute inset-0 overflow-hidden bg-porcelain shadow-[0_50px_90px_-45px_rgba(18,17,16,0.55)] [backface-visibility:hidden]">
          <ProductImage src={product.image_url} alt={product.title} loading="eager" className="h-full w-full object-cover" />
          <Stamp label="Keep" opacity={keep} className="left-6 top-16 -rotate-6 border-ivory text-ivory" />
          <Stamp label="Pass" opacity={pass} className="right-6 top-16 rotate-6 border-ivory text-ivory" />
          <Stamp label="Love" opacity={love} className="left-1/2 top-1/3 -translate-x-1/2 border-champagne bg-ink/40 text-champagne-soft" />
          <span className={cn("absolute left-5 top-5 px-3 py-1.5 text-[0.6rem] font-medium uppercase tracking-[0.24em] backdrop-blur",
            card.tag === "new_direction" ? "bg-champagne text-ink" : "bg-ivory/85 text-ink")}>
            {card.tag === "new_direction" ? "✦ New direction" : "For you"}
          </span>
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-noir/90 via-noir/45 to-transparent px-7 pb-7 pt-28 text-ivory">
            <p className="text-[0.64rem] uppercase tracking-[0.26em] text-ivory/70">{product.brand || product.store}</p>
            <h2 className="mt-2 line-clamp-2 font-display text-[1.9rem] font-light leading-[1.1]">{product.title}</h2>
            <div className="mt-3 flex items-center gap-3 text-sm">
              {formatPrice(product.price) && <span>{formatPrice(product.price)}</span>}
              {product.match_score ? <span className="text-champagne-soft">{product.match_score}% match</span> : null}
              <span className="ml-auto text-[0.62rem] uppercase tracking-[0.2em] text-ivory/60">Tap for details</span>
            </div>
          </div>
        </div>

        {/* Back */}
        <div className="absolute inset-0 flex flex-col overflow-y-auto bg-ivory p-8 [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <p className="eyebrow">{product.store}{product.category ? ` · ${product.category}` : ""}</p>
          <h2 className="mt-3 font-display text-3xl font-light leading-tight">{product.title}</h2>
          <div className="mt-5 flex items-baseline gap-3">
            {formatPrice(product.price) && <span className="text-xl">{formatPrice(product.price)}</span>}
            {formatPrice(product.mrp) && <span className="text-sm text-stone line-through">{formatPrice(product.mrp)}</span>}
            {product.rating && <span className="ml-auto text-sm text-stone">{product.rating}★</span>}
          </div>
          {product.color_hex && (
            <div className="mt-8">
              <p className="eyebrow mb-3">Its colour against your palette</p>
              <div className="flex items-center gap-4">
                <span className="h-14 w-14 shrink-0 rounded-full ring-1 ring-ink/10" style={{ backgroundColor: product.color_hex }} />
                <span className="flex -space-x-2">
                  {palette.slice(0, 6).map((s) => <span key={s.hex} title={s.name} className="h-8 w-8 rounded-full ring-2 ring-ivory" style={{ backgroundColor: s.hex }} />)}
                </span>
              </div>
              <p className="mt-2 text-xs capitalize text-stone">{product.color_name ?? "Measured from the photo"}</p>
            </div>
          )}
          {product.match_reasons.length > 0 && (
            <ul className="mt-8 space-y-2 border-t border-hairline pt-6">
              {product.match_reasons.map((r) => <li key={r} className="flex gap-3 text-sm text-graphite"><span className="text-champagne">✦</span>{r}</li>)}
            </ul>
          )}
          <a href={product.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
            className="mt-auto inline-flex items-center justify-center gap-2 bg-ink py-4 text-[0.68rem] uppercase tracking-[0.24em] text-ivory">
            View on {product.store}<ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </motion.div>
    </motion.div>
  );
}

interface SwipeDeckProps {
  current: DeckCard | null;
  next: DeckCard | null;
  palette: Swatch[];
  canUndo: boolean;
  onDecide: (action: SwipeAction) => void;
  onUndo: () => void;
}

export function SwipeDeck({ current, next, palette, canUndo, onDecide, onUndo }: SwipeDeckProps) {
  const [flipped, setFlipped] = useState(false);
  const [exitAction, setExitAction] = useState<SwipeAction>("like");

  const decide = (action: SwipeAction) => {
    if (!current) return;
    setExitAction(action);
    setFlipped(false);
    onDecide(action);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest("input, textarea")) return;
      const keys: Record<string, () => void> = {
        ArrowRight: () => decide("like"),
        ArrowLeft: () => decide("dislike"),
        ArrowUp: () => decide("love"),
        Backspace: onUndo,
        z: onUndo,
        " ": () => setFlipped((f) => !f),
      };
      const handler = keys[e.key];
      if (handler) { e.preventDefault(); handler(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div className="flex flex-col items-center">
      <div className="relative aspect-[3/4] w-full max-w-[25rem]">
        {next && (
          <div className="absolute inset-0 translate-y-4 scale-[0.95] overflow-hidden bg-porcelain opacity-50">
            <ProductImage src={next.product.image_url} alt="" className="h-full w-full object-cover" />
          </div>
        )}
        <AnimatePresence>
          {current && (
            <Card key={current.product.id} card={current} palette={palette} flipped={flipped} exitAction={exitAction}
              onFlip={() => setFlipped((f) => !f)} onDecide={decide} />
          )}
        </AnimatePresence>
      </div>

      <div className="mt-10 flex items-center gap-5" role="group" aria-label="Swipe actions">
        <button onClick={onUndo} disabled={!canUndo} aria-label="Undo last swipe (Z)"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-hairline text-stone transition-all hover:border-ink hover:text-ink disabled:opacity-30">
          <RotateCcw className="h-4 w-4" strokeWidth={1.4} />
        </button>
        <button onClick={() => decide("dislike")} disabled={!current} aria-label="Pass (left arrow)"
          className="flex h-16 w-16 items-center justify-center rounded-full border border-ink/25 transition-all duration-500 hover:border-ink hover:bg-ink hover:text-ivory disabled:opacity-30">
          <X className="h-5 w-5" strokeWidth={1.3} />
        </button>
        <button onClick={() => decide("love")} disabled={!current} aria-label="Love (up arrow)"
          className="flex h-12 w-12 items-center justify-center rounded-full border border-champagne text-champagne-deep transition-all duration-500 hover:bg-champagne hover:text-ink disabled:opacity-30">
          <Star className="h-4 w-4" strokeWidth={1.4} />
        </button>
        <button onClick={() => decide("like")} disabled={!current} aria-label="Keep (right arrow)"
          className="flex h-16 w-16 items-center justify-center rounded-full bg-ink text-ivory transition-all duration-500 hover:bg-champagne-deep disabled:opacity-30">
          <Heart className="h-5 w-5" strokeWidth={1.3} />
        </button>
      </div>
      <p className="mt-6 hidden text-[0.64rem] uppercase tracking-[0.2em] text-stone sm:block">
        ← pass · → keep · ↑ love · space details · Z undo
      </p>
    </div>
  );
}
