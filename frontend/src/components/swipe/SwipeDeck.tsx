import { useEffect, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useTransform, type PanInfo } from "framer-motion";
import { Heart, X } from "lucide-react";

import { ProductImage } from "@/components/product/ProductImage";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/types/api";

const SWIPE_DISTANCE = 120;

function Card({ product, onDecide }: { product: Product; onDecide: (action: "like" | "dislike") => void }) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-300, 300], [-10, 10]);
  const likeOpacity = useTransform(x, [30, SWIPE_DISTANCE], [0, 1]);
  const passOpacity = useTransform(x, [-SWIPE_DISTANCE, -30], [1, 0]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x > SWIPE_DISTANCE || info.velocity.x > 600) onDecide("like");
    else if (info.offset.x < -SWIPE_DISTANCE || info.velocity.x < -600) onDecide("dislike");
  };

  return (
    <motion.div
      className="absolute inset-0 cursor-grab touch-none active:cursor-grabbing"
      style={{ x, rotate }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.9}
      onDragEnd={onDragEnd}
      initial={{ scale: 0.96, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ x: x.get() >= 0 ? 600 : -600, opacity: 0, transition: { duration: 0.45 } }}
    >
      <div className="relative h-full overflow-hidden bg-porcelain shadow-[0_40px_80px_-40px_rgba(18,17,16,0.45)]">
        <ProductImage src={product.image_url} alt={product.title} loading="eager" className="h-full w-full object-cover" />
        <motion.span style={{ opacity: likeOpacity }}
          className="absolute left-6 top-6 border border-ivory px-4 py-2 text-[0.7rem] uppercase tracking-[0.3em] text-ivory backdrop-blur-sm">Keep</motion.span>
        <motion.span style={{ opacity: passOpacity }}
          className="absolute right-6 top-6 border border-ivory px-4 py-2 text-[0.7rem] uppercase tracking-[0.3em] text-ivory backdrop-blur-sm">Pass</motion.span>
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-noir/85 via-noir/40 to-transparent px-7 pb-7 pt-24 text-ivory">
          <p className="text-[0.66rem] uppercase tracking-[0.24em] text-ivory/70">{product.brand || product.store} · {product.store}</p>
          <h2 className="mt-2 line-clamp-2 font-display text-3xl font-light leading-tight">{product.title}</h2>
          <div className="mt-3 flex items-center gap-3 text-sm">
            {formatPrice(product.price) && <span>{formatPrice(product.price)}</span>}
            {product.match_score ? <span className="text-champagne">{product.match_score}% match</span> : null}
          </div>
          {product.match_reasons[0] && <p className="mt-2 text-xs text-ivory/70">✦ {product.match_reasons[0]}</p>}
        </div>
      </div>
    </motion.div>
  );
}

export function SwipeDeck({ products, onDecide, onFinish }: {
  products: Product[];
  onDecide: (product: Product, action: "like" | "dislike") => void;
  onFinish?: () => void;
}) {
  const [index, setIndex] = useState(0);
  const current = products[index];
  const next = products[index + 1];

  const decide = (action: "like" | "dislike") => {
    if (!current) return;
    onDecide(current, action);
    setIndex((i) => i + 1);
    if (index + 1 >= products.length) onFinish?.();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") decide("like");
      if (e.key === "ArrowLeft") decide("dislike");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div className="flex flex-col items-center">
      <div className="relative aspect-[3/4] w-full max-w-[26rem]">
        {next && (
          <div className="absolute inset-0 translate-y-3 scale-[0.96] overflow-hidden bg-porcelain opacity-60">
            <ProductImage src={next.image_url} alt="" className="h-full w-full object-cover" />
          </div>
        )}
        <AnimatePresence>{current && <Card key={current.id} product={current} onDecide={decide} />}</AnimatePresence>
      </div>
      <div className="mt-10 flex items-center gap-8">
        <button onClick={() => decide("dislike")} disabled={!current} aria-label="Pass (left arrow)"
          className="flex h-16 w-16 items-center justify-center rounded-full border border-ink/25 transition-all duration-500 hover:border-ink hover:bg-ink hover:text-ivory disabled:opacity-30">
          <X className="h-5 w-5" strokeWidth={1.3} />
        </button>
        <span className="min-w-16 text-center text-[0.7rem] uppercase tracking-[0.24em] text-stone">
          {Math.min(index + 1, products.length)} / {products.length}
        </span>
        <button onClick={() => decide("like")} disabled={!current} aria-label="Keep (right arrow)"
          className="flex h-16 w-16 items-center justify-center rounded-full bg-ink text-ivory transition-all duration-500 hover:bg-champagne-deep disabled:opacity-30">
          <Heart className="h-5 w-5" strokeWidth={1.3} />
        </button>
      </div>
      <p className="mt-6 text-[0.68rem] uppercase tracking-[0.2em] text-stone">Drag, tap, or use ← → keys</p>
    </div>
  );
}
