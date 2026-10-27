import { motion } from "framer-motion";
import { Heart } from "lucide-react";

import { ProductImage } from "@/components/product/ProductImage";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Product } from "@/types/api";

interface ProductCardProps {
  product: Product;
  saved?: boolean;
  onToggleSave?: (product: Product) => void;
  index?: number;
  compact?: boolean;
}

export function ProductCard({ product, saved, onToggleSave, index = 0, compact }: ProductCardProps) {
  const price = formatPrice(product.price);
  const mrp = formatPrice(product.mrp);
  const reason = product.match_reasons[0];

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: Math.min(index, 12) * 0.04, ease: [0.22, 1, 0.36, 1] }}
      className="group relative"
    >
      <a href={product.url} target="_blank" rel="noopener noreferrer" className="block"
        aria-label={`${product.title}${price ? `, ${price}` : ""}, on ${product.store} (opens in a new tab)`}>
        <div className="relative aspect-[3/4] overflow-hidden bg-porcelain">
          <ProductImage
            src={product.image_url}
            alt=""
            className="h-full w-full object-cover transition-transform duration-[1400ms] ease-couture group-hover:scale-[1.045]"
          />
          {product.match_score != null && product.match_score > 0 && (
            <span className="absolute left-3 top-3 bg-ivory/90 px-2.5 py-1 text-[0.62rem] font-medium uppercase tracking-[0.2em] backdrop-blur">
              {product.match_score}% match
            </span>
          )}
          {reason && !compact && (
            <p className="absolute inset-x-0 bottom-0 translate-y-full bg-ink/85 px-4 py-3 text-[0.72rem] leading-snug text-ivory backdrop-blur transition-transform duration-700 ease-couture group-hover:translate-y-0">
              <span className="mr-1.5 text-champagne">✦</span>{reason}
            </p>
          )}
        </div>
      </a>

      {onToggleSave && (
        <button
          type="button"
          onClick={() => onToggleSave(product)}
          aria-pressed={saved}
          aria-label={saved ? `Remove ${product.title} from your wardrobe` : `Save ${product.title}`}
          className={cn(
            "absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full backdrop-blur transition-all duration-500",
            saved ? "bg-ink text-ivory" : "bg-ivory/85 text-ink opacity-100 hover:bg-ivory lg:opacity-0 lg:group-hover:opacity-100",
          )}
        >
          <Heart className="h-4 w-4" strokeWidth={1.5} fill={saved ? "currentColor" : "none"} />
        </button>
      )}

      <div className={cn("pt-4", compact && "pt-3")}>
        <div className="flex items-baseline justify-between gap-3">
          <p className="truncate text-[0.66rem] font-medium uppercase tracking-[0.22em] text-ink">{product.brand || product.store}</p>
          <p className="shrink-0 text-[0.62rem] uppercase tracking-[0.18em] text-stone">{product.store}</p>
        </div>
        <h3 className={cn("mt-1.5 line-clamp-2 font-sans text-[0.82rem] font-normal leading-snug tracking-normal text-graphite", compact && "line-clamp-1")}>
          {product.title}
        </h3>
        <div className="mt-2.5 flex items-center gap-2.5 text-[0.82rem]">
          {price && <span className="font-medium text-ink">{price}</span>}
          {mrp && <span className="text-stone line-through">{mrp}</span>}
          {product.discount_percent ? <span className="text-champagne-deep">−{product.discount_percent}%</span> : null}
          {product.color_hex && (
            <span className="ml-auto flex items-center gap-1.5 text-[0.7rem] capitalize text-stone">
              <span className="h-2.5 w-2.5 rounded-full ring-1 ring-ink/15" style={{ backgroundColor: product.color_hex }} />
              {product.color_name}
            </span>
          )}
        </div>
      </div>
    </motion.article>
  );
}
