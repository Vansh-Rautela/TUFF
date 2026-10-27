import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { api, errorMessage } from "@/lib/api";
import type { Deck, DeckCard, SwipeAction } from "@/types/api";

const REFILL_AT = 3;

interface Decision {
  card: DeckCard;
  action: SwipeAction;
}

/**
 * Endless adaptive deck. Cards come from /users/{id}/deck (Thompson sampling on the
 * server); the queue refills when it runs low, and every decision can be undone.
 */
export function useSwipeDeck(ensureUser: () => Promise<string>) {
  const queryClient = useQueryClient();
  const [queue, setQueue] = useState<DeckCard[]>([]);
  const [history, setHistory] = useState<Decision[]>([]);
  const [learning, setLearning] = useState<Deck["learning"] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exhausted, setExhausted] = useState(false);
  const inFlight = useRef(false);
  const known = useRef(new Set<string>());

  const refill = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setLoading(true);
    setError(null);
    try {
      const deck = await api.deck(await ensureUser(), 10);
      const fresh = deck.cards.filter((c) => !known.current.has(c.product.id));
      fresh.forEach((c) => known.current.add(c.product.id));
      setQueue((q) => [...q, ...fresh]);
      setLearning(deck.learning);
      setExhausted(fresh.length === 0);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  }, [ensureUser]);

  useEffect(() => {
    if (queue.length <= REFILL_AT && !exhausted && !error) refill();
  }, [queue.length, exhausted, error, refill]);

  const decide = useCallback(
    async (action: SwipeAction) => {
      const card = queue[0];
      if (!card) return;
      setQueue((q) => q.slice(1));
      setHistory((h) => [...h, { card, action }]);
      setLearning((l) => l && { ...l, swipes: l.swipes + 1, confidence: Math.round((1 - Math.exp(-(l.swipes + 1) / 12)) * 100) / 100 });
      navigator.vibrate?.(action === "love" ? [10, 40, 10] : 10);
      try {
        await api.interact(await ensureUser(), card.product.id, action);
        if (action !== "dislike") queryClient.invalidateQueries({ queryKey: ["saved"] });
        queryClient.invalidateQueries({ queryKey: ["insights"] });
      } catch (e) {
        setError(errorMessage(e));
      }
    },
    [ensureUser, queryClient, queue],
  );

  const undo = useCallback(async () => {
    const last = history[history.length - 1];
    if (!last) return;
    setHistory((h) => h.slice(0, -1));
    setQueue((q) => [last.card, ...q]);
    setLearning((l) => l && { ...l, swipes: Math.max(0, l.swipes - 1) });
    try {
      await api.undo(await ensureUser());
      queryClient.invalidateQueries({ queryKey: ["saved"] });
    } catch (e) {
      setError(errorMessage(e));
    }
  }, [ensureUser, history, queryClient]);

  const counts = history.reduce(
    (acc, d) => ({ ...acc, [d.action]: acc[d.action] + 1 }),
    { like: 0, love: 0, dislike: 0 } as Record<SwipeAction, number>,
  );

  return {
    current: queue[0] ?? null,
    next: queue[1] ?? null,
    learning,
    counts,
    canUndo: history.length > 0,
    loading: loading && queue.length === 0,
    error,
    exhausted: exhausted && queue.length === 0,
    decide,
    undo,
    retry: () => { setError(null); setExhausted(false); refill(); },
  };
}
