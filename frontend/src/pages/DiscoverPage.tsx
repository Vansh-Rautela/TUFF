import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search, SlidersHorizontal } from "lucide-react";

import { Chip } from "@/components/common/Chip";
import { EmptyState } from "@/components/common/EmptyState";
import { SwatchRow } from "@/components/common/SwatchRow";
import { PageShell } from "@/components/layout/PageShell";
import { ProductGrid } from "@/components/product/ProductGrid";
import { StoreProgress } from "@/components/product/StoreProgress";
import { Button } from "@/components/ui/button";
import { useProductStream } from "@/hooks/useProductStream";
import { useUser } from "@/hooks/useUser";
import { api } from "@/lib/api";
import { PRICE_FILTERS } from "@/lib/catalog-options";
import { cn } from "@/lib/utils";
import type { Product } from "@/types/api";

type Sort = "match" | "price-asc" | "price-desc";

function sortProducts(products: Product[], sort: Sort): Product[] {
  if (sort === "match") return products;
  const price = (p: Product) => p.price ?? Number.POSITIVE_INFINITY;
  return [...products].sort((a, b) => (sort === "price-asc" ? price(a) - price(b) : price(b) - price(a)));
}

export default function DiscoverPage() {
  const { userId, profile } = useUser();
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const [draft, setDraft] = useState(q);
  const [stores, setStores] = useState<string[]>([]);
  const [priceIndex, setPriceIndex] = useState(0);
  const [sort, setSort] = useState<Sort>("match");
  const [showFilters, setShowFilters] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const storeList = useQuery({ queryKey: ["stores"], queryFn: api.stores, staleTime: 3_600_000 });

  const price = PRICE_FILTERS[priceIndex];
  const params = useMemo(() => ({
    q, stores, userId, minPrice: price.min, maxPrice: price.max,
  }), [q, stores, userId, price.min, price.max]);
  const stream = useProductStream(params, attempt);
  const products = sortProducts(stream.products, sort);
  const season = profile?.color_analysis?.season;

  return (
    <PageShell>
      <section className="border-b border-hairline">
        <div className="container py-14 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-end">
            <div>
              <p className="eyebrow mb-5">{season ? `Edited for ${season.name}` : "The edit"}</p>
              <h1 className="display-lg">{q ? <>“{q}”</> : season ? "Your edit" : "Discover"}</h1>
              {season ? (
                <div className="mt-6 flex flex-wrap items-center gap-5">
                  <SwatchRow swatches={season.palette.signature} size="sm" />
                  <span className="text-sm text-stone">Ranked by how each piece's colour sits with your palette, your taste and budget.</span>
                </div>
              ) : (
                <p className="mt-6 max-w-lg text-sm text-stone">
                  Searching Myntra, Flipkart and Amazon at once. <Link to="/start" className="link-underline text-ink">Find your season</Link> to have everything ranked for you.
                </p>
              )}
            </div>
            <form role="search" onSubmit={(e) => { e.preventDefault(); setSearchParams(draft.trim() ? { q: draft.trim() } : {}); }}
              className="flex items-center gap-4 border-b border-ink pb-3">
              <Search className="h-5 w-5 text-stone" strokeWidth={1.3} />
              <input value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={120} type="search"
                placeholder="Olive linen shirt, wedding lehenga…" aria-label="Search the stores"
                className="h-12 flex-1 bg-transparent font-display text-2xl font-light outline-none placeholder:text-stone/60" />
              <Button type="submit" size="sm">Search</Button>
            </form>
          </div>
        </div>
      </section>

      <section className="sticky top-[4.5rem] z-30 border-b border-hairline bg-ivory/90 backdrop-blur-xl">
        <div className="container flex flex-wrap items-center justify-between gap-4 py-4">
          <StoreProgress stores={stream.stores} elapsedMs={stream.elapsedMs} />
          <div className="flex items-center gap-4">
            <span className="text-xs text-stone">{products.length} pieces</span>
            <label className="sr-only" htmlFor="sort">Sort</label>
            <select id="sort" value={sort} onChange={(e) => setSort(e.target.value as Sort)}
              className="h-9 border-b border-hairline bg-transparent text-[0.7rem] uppercase tracking-[0.18em] outline-none">
              <option value="match">{userId ? "Best match" : "Featured"}</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
            </select>
            <button onClick={() => setShowFilters(!showFilters)} aria-expanded={showFilters}
              className="flex items-center gap-2 text-[0.7rem] uppercase tracking-[0.18em]">
              <SlidersHorizontal className="h-4 w-4" strokeWidth={1.3} />Filters
            </button>
          </div>
        </div>
        <div className={cn("container grid overflow-hidden transition-all duration-500 ease-couture", showFilters ? "grid-rows-[1fr] pb-6" : "grid-rows-[0fr]")}>
          <div className="min-h-0 space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="eyebrow mr-3 w-14">Stores</span>
              {(storeList.data ?? []).filter((s) => s.tier === "fast" || s.default).map((s) => (
                <Chip key={s.name} selected={stores.includes(s.name)}
                  onClick={() => setStores(stores.includes(s.name) ? stores.filter((x) => x !== s.name) : [...stores, s.name])}>{s.name}</Chip>
              ))}
              {(storeList.data ?? []).some((s) => s.tier === "legacy") && (
                <span className="ml-2 text-xs text-stone">More stores available: {(storeList.data ?? []).filter((s) => s.tier === "legacy").map((s) => s.name).join(", ")}</span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="eyebrow mr-3 w-14">Price</span>
              {PRICE_FILTERS.map((p, i) => <Chip key={p.label} selected={priceIndex === i} onClick={() => setPriceIndex(i)}>{p.label}</Chip>)}
            </div>
          </div>
        </div>
      </section>

      <section className="container py-14">
        {stream.error && !products.length ? (
          <EmptyState eyebrow="Connection" title="The edit didn't load." action={<Button onClick={() => setAttempt((a) => a + 1)}>Try again</Button>}>
            {stream.error.message}
          </EmptyState>
        ) : !stream.isLoading && products.length === 0 ? (
          <EmptyState eyebrow="Nothing yet" title="No pieces matched.">Try a broader search or fewer filters.</EmptyState>
        ) : (
          <ProductGrid products={products} loadingSlots={stream.isLoading ? Math.max(0, 8 - products.length) : 0} />
        )}
      </section>
    </PageShell>
  );
}
