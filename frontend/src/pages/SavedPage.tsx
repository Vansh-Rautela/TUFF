import { Link } from "react-router-dom";

import { EmptyState } from "@/components/common/EmptyState";
import { PageShell } from "@/components/layout/PageShell";
import { LookbookSection } from "@/components/product/LookbookSection";
import { ProductGrid } from "@/components/product/ProductGrid";
import { Button } from "@/components/ui/button";
import { useSaved } from "@/hooks/useSaved";
import { formatPrice } from "@/lib/format";

export default function SavedPage() {
  const saved = useSaved();
  const total = saved.items.reduce((sum, item) => sum + (item.product.price ?? 0), 0);

  return (
    <PageShell>
      <section className="container py-14 lg:py-20">
        <div className="flex flex-col gap-6 border-b border-hairline pb-10 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow mb-5">Your wardrobe</p>
            <h1 className="display-lg">Kept pieces</h1>
          </div>
          {saved.items.length > 0 && (
            <p className="text-sm text-stone">{saved.items.length} pieces · {formatPrice(total)} together</p>
          )}
        </div>

        {saved.isLoading ? (
          <div className="mt-12 grid grid-cols-2 gap-6 md:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton aspect-[3/4]" />)}</div>
        ) : saved.items.length === 0 ? (
          <EmptyState eyebrow="Empty, for now" title="Nothing kept yet."
            action={<div className="flex gap-4"><Button asChild><Link to="/swipe">Start swiping</Link></Button><Button asChild variant="outline"><Link to="/discover">Browse the edit</Link></Button></div>}>
            Keep pieces while you swipe or browse, and they'll wait for you here.
          </EmptyState>
        ) : (
          <>
            <ProductGrid className="mt-12" products={saved.items.map((item) => item.product)} />
            <LookbookSection />
          </>
        )}
      </section>
    </PageShell>
  );
}
