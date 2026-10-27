import { useEffect, useMemo, useState } from "react";

import { ApiError, streamSearch } from "@/lib/api";
import type { Product, SearchParams, StoreStatus } from "@/types/api";

interface StreamState {
  products: Product[];
  stores: Record<string, StoreStatus | "pending">;
  query: string;
  isLoading: boolean;
  error: ApiError | null;
  elapsedMs: number | null;
}

const EMPTY: StreamState = { products: [], stores: {}, query: "", isLoading: false, error: null, elapsedMs: null };

/**
 * Stream a search: products appear store by store, merged and ordered by
 * match score (or interleaved by store when results aren't personalized).
 */
export function useProductStream(params: SearchParams | null, refreshKey = 0) {
  const [state, setState] = useState<StreamState>(EMPTY);
  const key = params ? JSON.stringify([params, refreshKey]) : null;

  useEffect(() => {
    if (!key) return;
    const [current] = JSON.parse(key) as [SearchParams, number];
    setState({ ...EMPTY, isLoading: true });
    return streamSearch(current, {
      onStart: ({ query, stores }) =>
        setState((s) => ({ ...s, query, stores: Object.fromEntries(stores.map((name) => [name, "pending" as const])) })),
      onStore: (status, products) =>
        setState((s) => {
          const seen = new Set(s.products.map((p) => p.id));
          return {
            ...s,
            stores: { ...s.stores, [status.store]: status },
            products: [...s.products, ...products.filter((p) => !seen.has(p.id))],
          };
        }),
      onDone: (elapsedMs) => setState((s) => ({ ...s, isLoading: false, elapsedMs })),
      onError: (error) => setState((s) => ({ ...s, isLoading: false, error })),
    });
  }, [key]);

  const products = useMemo(() => {
    if (!state.products.some((p) => p.match_score != null)) return state.products;
    return [...state.products].sort((a, b) => (b.match_score ?? 0) - (a.match_score ?? 0));
  }, [state.products]);

  return { ...state, products };
}
