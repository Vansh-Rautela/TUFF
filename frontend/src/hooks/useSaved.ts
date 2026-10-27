import { useCallback, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useUser } from "@/hooks/useUser";
import { api, errorMessage } from "@/lib/api";
import type { Product, SavedItem, SwipeAction } from "@/types/api";

export const savedKey = (userId: string | null) => ["saved", userId] as const;

/** Saved items plus like/pass/remove actions with optimistic updates. */
export function useSaved() {
  const { userId, ensureUser } = useUser();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: savedKey(userId),
    queryFn: () => api.saved(userId!),
    enabled: Boolean(userId),
  });
  const savedIds = useMemo(() => new Set((query.data ?? []).map((s) => s.product.id)), [query.data]);

  const react = useMutation({
    mutationFn: async ({ product, action }: { product: Product; action: SwipeAction }) =>
      api.interact(await ensureUser(), product.id, action),
    onMutate: ({ product, action }) => {
      if (action === "dislike") return;
      queryClient.setQueryData<SavedItem[]>(savedKey(userId), (items = []) =>
        items.some((i) => i.product.id === product.id) ? items : [{ saved_at: new Date().toISOString(), product }, ...items],
      );
    },
    onError: (error) => toast.error(errorMessage(error)),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["saved"] });
      queryClient.invalidateQueries({ queryKey: ["insights"] });
      queryClient.invalidateQueries({ queryKey: ["lookbook"] });
    },
  });

  const remove = useMutation({
    mutationFn: (product: Product) => api.unsave(userId!, product.id),
    onMutate: (product) =>
      queryClient.setQueryData<SavedItem[]>(savedKey(userId), (items = []) => items.filter((i) => i.product.id !== product.id)),
    onError: (error) => toast.error(errorMessage(error)),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["saved"] }),
  });

  const toggle = useCallback(
    (product: Product) => {
      if (savedIds.has(product.id)) {
        remove.mutate(product);
      } else {
        react.mutate({ product, action: "like" });
        toast("Saved to your wardrobe", { description: product.title });
      }
    },
    [react, remove, savedIds],
  );

  return {
    items: query.data ?? [],
    isLoading: query.isLoading && Boolean(userId),
    isSaved: (id: string) => savedIds.has(id),
    toggle,
    like: (product: Product) => react.mutate({ product, action: "like" }),
    love: (product: Product) => react.mutate({ product, action: "love" }),
    pass: (product: Product) => react.mutate({ product, action: "dislike" }),
    remove: (product: Product) => remove.mutate(product),
  };
}
