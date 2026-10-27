import { Link } from "react-router-dom";
import { motion } from "framer-motion";

import { COLOR_FAMILIES } from "@/lib/color-families";
import { titleCase } from "@/lib/format";
import type { Deck, SwipeAction } from "@/types/api";

/** What the deck has learned so far — updates as you swipe. */
export function TastePanel({ learning, counts, compact }: {
  learning: Deck["learning"] | null;
  counts: Record<SwipeAction, number>;
  compact?: boolean;
}) {
  const confidence = Math.round((learning?.confidence ?? 0) * 100);
  const colors = learning?.colors ?? [];
  const categories = learning?.categories ?? [];

  if (compact) {
    return (
      <div className="w-full max-w-[25rem]">
        <div className="flex items-baseline justify-between text-[0.64rem] uppercase tracking-[0.2em] text-stone">
          <span>Taste profile</span><span className="text-ink">{confidence}% formed</span>
        </div>
        <div className="mt-2 h-px bg-hairline"><motion.div className="h-px bg-champagne-deep" animate={{ width: `${confidence}%` }} /></div>
      </div>
    );
  }

  return (
    <aside className="space-y-10" aria-live="polite">
      <div>
        <p className="eyebrow">Taste profile</p>
        <p className="mt-3 font-display text-6xl font-light">{confidence}<span className="text-3xl text-stone">%</span></p>
        <p className="text-sm text-stone">formed from {learning?.swipes ?? 0} swipes</p>
        <div className="mt-5 h-px bg-hairline">
          <motion.div className="h-px bg-champagne-deep" initial={false} animate={{ width: `${confidence}%` }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 border-y border-hairline py-5 text-center">
        {([["like", "Kept"], ["love", "Loved"], ["dislike", "Passed"]] as const).map(([key, label]) => (
          <div key={key}><p className="font-display text-3xl font-light">{counts[key]}</p><p className="eyebrow mt-1">{label}</p></div>
        ))}
      </div>

      <div>
        <p className="eyebrow mb-4">Colours you're drawn to</p>
        {colors.length ? (
          <ul className="space-y-3">
            {colors.map((c) => (
              <li key={c} className="flex items-center gap-3 text-sm">
                <span className="h-5 w-5 rounded-full ring-1 ring-ink/10" style={{ backgroundColor: COLOR_FAMILIES[c]?.hex ?? "#999" }} />
                {COLOR_FAMILIES[c]?.label ?? titleCase(c)}
              </li>
            ))}
          </ul>
        ) : <p className="text-sm text-stone">A few more swipes and your colours will appear.</p>}
      </div>

      {categories.length > 0 && (
        <div>
          <p className="eyebrow mb-3">Pieces you keep</p>
          <p className="font-display text-2xl">{categories.map(titleCase).join(" · ")}</p>
        </div>
      )}

      <p className="text-xs leading-relaxed text-stone">
        <span className="text-champagne-deep">✦ New direction</span> cards test colours and pieces we're unsure about —
        your answer sharpens the edit fastest.
        {" "}<Link to="/saved" className="link-underline text-ink">Your wardrobe</Link>
      </p>
    </aside>
  );
}
