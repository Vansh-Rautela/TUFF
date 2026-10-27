import { ExternalLink, Heart } from "lucide-react";

import { ProductImage } from "@/components/product/ProductImage";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { useUser } from "@/hooks/useUser";
import { formatPrice, titleCase } from "@/lib/format";
import type { Product } from "@/types/api";

/** Product detail sheet: image, colour against the user's palette, reasons, and the way to the store. */
export function QuickView({ product, saved, onToggleSave, onClose }: {
  product: Product | null;
  saved: boolean;
  onToggleSave: (product: Product) => void;
  onClose: () => void;
}) {
  const { profile } = useUser();
  const palette = profile?.color_analysis?.season.palette;

  return (
    <Sheet open={Boolean(product)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full overflow-y-auto border-l-0 bg-ivory p-0 sm:max-w-xl">
        {product && (
          <div className="flex min-h-full flex-col">
            <div className="relative aspect-[4/5] bg-porcelain">
              <ProductImage src={product.image_url} alt={product.title} loading="eager" className="h-full w-full object-cover" />
              {product.match_score != null && product.match_score > 0 && (
                <span className="absolute left-5 top-5 bg-ivory/90 px-3 py-1.5 text-[0.62rem] font-medium uppercase tracking-[0.22em]">
                  {product.match_score}% match
                </span>
              )}
            </div>
            <div className="flex flex-1 flex-col p-8">
              <p className="eyebrow">{product.brand || product.store} · {product.store}</p>
              <SheetTitle className="mt-3 font-display text-3xl font-light leading-tight">{product.title}</SheetTitle>
              <SheetDescription className="sr-only">Product details</SheetDescription>
              <div className="mt-4 flex items-baseline gap-3">
                {formatPrice(product.price) && <span className="text-xl">{formatPrice(product.price)}</span>}
                {formatPrice(product.mrp) && <span className="text-sm text-stone line-through">{formatPrice(product.mrp)}</span>}
                {product.discount_percent ? <span className="text-sm text-champagne-deep">−{product.discount_percent}%</span> : null}
                {product.rating && <span className="ml-auto text-sm text-stone">{product.rating}★</span>}
              </div>

              {product.color_hex && (
                <div className="mt-8 border-t border-hairline pt-6">
                  <p className="eyebrow mb-4">Colour</p>
                  <div className="flex items-center gap-5">
                    <span className="h-12 w-12 shrink-0 rounded-full ring-1 ring-ink/10" style={{ backgroundColor: product.color_hex }} />
                    <div className="min-w-0">
                      <p className="font-display text-xl capitalize">{product.color_name ?? "Measured"}</p>
                      {palette && (
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-xs text-stone">Your palette</span>
                          <span className="flex -space-x-1.5">
                            {palette.signature.slice(0, 6).map((s) => <span key={s.hex} title={s.name} className="h-5 w-5 rounded-full ring-2 ring-ivory" style={{ backgroundColor: s.hex }} />)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {product.match_reasons.length > 0 && (
                <ul className="mt-8 space-y-2 border-t border-hairline pt-6">
                  {product.match_reasons.map((r) => <li key={r} className="flex gap-3 text-sm text-graphite"><span className="text-champagne">✦</span>{r}</li>)}
                </ul>
              )}
              {product.category && <p className="mt-6 text-xs text-stone">{titleCase(product.category)}{product.gender ? ` · ${titleCase(product.gender)}` : ""}</p>}

              <div className="mt-auto flex gap-3 pt-10">
                <Button asChild className="flex-1">
                  <a href={product.url} target="_blank" rel="noopener noreferrer">Shop on {product.store}<ExternalLink /></a>
                </Button>
                <Button variant="outline" size="icon" className="h-12 w-12" onClick={() => onToggleSave(product)}
                  aria-pressed={saved} aria-label={saved ? "Remove from wardrobe" : "Save to wardrobe"}>
                  <Heart fill={saved ? "currentColor" : "none"} />
                </Button>
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
