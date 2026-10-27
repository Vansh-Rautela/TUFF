import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

import { EmptyState } from "@/components/common/EmptyState";
import { PageShell } from "@/components/layout/PageShell";
import { SwipeDeck } from "@/components/swipe/SwipeDeck";
import { Button } from "@/components/ui/button";
import { useProductStream } from "@/hooks/useProductStream";
import { useSaved } from "@/hooks/useSaved";
import { useUser } from "@/hooks/useUser";
import type { Product } from "@/types/api";

export default function SwipePage() {
  const { userId, profile } = useUser();
  const saved = useSaved();
  const queryClient = useQueryClient();
  const [round, setRound] = useState(0);
  const [finished, setFinished] = useState(false);
  const [kept, setKept] = useState(0);

  const params = useMemo(() => ({ q: "", userId, excludeSeen: true }), [userId]);
  const stream = useProductStream(params, round);
  const deck = stream.isLoading ? [] : stream.products.slice(0, 20);

  const decide = (product: Product, action: "like" | "dislike") => {
    if (action === "like") { saved.like(product); setKept((k) => k + 1); }
    else saved.pass(product);
  };

  return (
    <PageShell footer={false}>
      <section className="container flex min-h-[calc(100vh-4.5rem)] flex-col items-center py-12">
        <div className="mb-10 text-center">
          <p className="eyebrow">{profile?.season ? `${profile.season} · learning your taste` : "Learning your taste"}</p>
          <h1 className="mt-3 font-display text-5xl font-light">Keep or pass.</h1>
        </div>

        {stream.isLoading ? (
          <div className="flex w-full max-w-[26rem] flex-col items-center">
            <div className="skeleton aspect-[3/4] w-full" />
            <p className="eyebrow mt-8">Curating your deck…</p>
          </div>
        ) : finished || deck.length === 0 ? (
          <EmptyState eyebrow={finished ? "Round complete" : "All caught up"} title={finished ? `You kept ${kept}.` : "You've seen this edit."}
            action={
              <div className="flex flex-wrap justify-center gap-4">
                <Button onClick={() => { setFinished(false); setKept(0); setRound((r) => r + 1); queryClient.invalidateQueries({ queryKey: ["profile"] }); }}>
                  Another round
                </Button>
                <Button asChild variant="outline"><Link to="/discover">See your edit</Link></Button>
              </div>
            }>
            Every choice sharpens your recommendations. Your keeps are in your wardrobe.
          </EmptyState>
        ) : (
          <SwipeDeck key={round} products={deck} onDecide={decide} onFinish={() => setFinished(true)} />
        )}
      </section>
    </PageShell>
  );
}
