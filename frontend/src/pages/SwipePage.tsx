import { Link } from "react-router-dom";

import { EmptyState } from "@/components/common/EmptyState";
import { PageShell } from "@/components/layout/PageShell";
import { SwipeDeck } from "@/components/swipe/SwipeDeck";
import { TastePanel } from "@/components/swipe/TastePanel";
import { Button } from "@/components/ui/button";
import { useSwipeDeck } from "@/hooks/useSwipeDeck";
import { useUser } from "@/hooks/useUser";

export default function SwipePage() {
  const { profile, ensureUser } = useUser();
  const deck = useSwipeDeck(ensureUser);
  const season = profile?.color_analysis?.season;
  const palette = season ? [...season.palette.signature, ...season.palette.neutrals] : [];

  return (
    <PageShell footer={false}>
      <section className="container grid min-h-[calc(100vh-4.5rem)] gap-14 py-10 lg:grid-cols-[1fr_20rem] lg:py-14">
        <div className="flex flex-col items-center">
          <div className="mb-8 text-center">
            <p className="eyebrow">{season ? `${season.name} · learning your taste` : "Learning your taste"}</p>
            <h1 className="mt-3 font-display text-5xl font-light">Keep, love or pass.</h1>
          </div>
          <div className="mb-8 w-full max-w-[25rem] lg:hidden">
            <TastePanel learning={deck.learning} counts={deck.counts} compact />
          </div>

          {deck.loading ? (
            <div className="flex w-full max-w-[25rem] flex-col items-center">
              <div className="skeleton aspect-[3/4] w-full" />
              <p className="eyebrow mt-8">Composing your deck…</p>
            </div>
          ) : deck.error && !deck.current ? (
            <EmptyState eyebrow="Connection" title="The deck didn't load." action={<Button onClick={deck.retry}>Try again</Button>}>
              {deck.error}
            </EmptyState>
          ) : deck.exhausted ? (
            <EmptyState eyebrow="All caught up" title="You've seen everything for now."
              action={<div className="flex flex-wrap justify-center gap-4">
                <Button onClick={deck.retry}>Look again</Button>
                <Button asChild variant="outline"><Link to="/discover">Search the stores</Link></Button>
              </div>}>
              New pieces arrive as you search. Your keeps are in your wardrobe.
            </EmptyState>
          ) : (
            <SwipeDeck current={deck.current} next={deck.next} palette={palette} canUndo={deck.canUndo}
              onDecide={deck.decide} onUndo={deck.undo} />
          )}
        </div>
        <div className="hidden border-l border-hairline pl-10 pt-6 lg:block">
          <TastePanel learning={deck.learning} counts={deck.counts} />
        </div>
      </section>
    </PageShell>
  );
}
