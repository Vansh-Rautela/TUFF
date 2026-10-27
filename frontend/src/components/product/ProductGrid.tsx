import { useState } from "react";

import { ProductCard } from "@/components/product/ProductCard";
import { QuickView } from "@/components/product/QuickView";
import { useSaved } from "@/hooks/useSaved";
import { cn } from "@/lib/utils";
import type { Product } from "@/types/api";

export function ProductGrid({ products, loadingSlots = 0, className }: {
  products: Product[];
  loadingSlots?: number;
  className?: string;
}) {
  const saved = useSaved();
  const [open, setOpen] = useState<Product | null>(null);
  return (
    <>
      <div className={cn("grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 md:gap-x-6 xl:grid-cols-4", className)}>
        {products.map((product, i) => (
          <ProductCard key={product.id} product={product} index={i} saved={saved.isSaved(product.id)}
            onToggleSave={saved.toggle} onOpen={setOpen} />
        ))}
        {Array.from({ length: loadingSlots }).map((_, i) => (
          <div key={`skeleton-${i}`} aria-hidden>
            <div className="skeleton aspect-[3/4]" />
            <div className="skeleton mt-4 h-3 w-1/3" />
            <div className="skeleton mt-2 h-3 w-4/5" />
            <div className="skeleton mt-3 h-3 w-1/4" />
          </div>
        ))}
      </div>
      <QuickView product={open} saved={open ? saved.isSaved(open.id) : false} onToggleSave={saved.toggle}
        onClose={() => setOpen(null)} />
    </>
  );
}
