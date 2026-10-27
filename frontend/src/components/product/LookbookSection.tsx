import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { Reveal } from "@/components/common/Reveal";
import { ProductImage } from "@/components/product/ProductImage";
import { useUser } from "@/hooks/useUser";
import { api } from "@/lib/api";
import { titleCase } from "@/lib/format";

const KIND_LABEL: Record<string, string> = {
  neutral: "Neutral anchor", tonal: "Tone on tone", analogous: "Analogous", complementary: "Complementary",
  contrasting: "Contrast", clash: "Clash",
};

/** "Complete the look": saved pieces paired by colour harmony, and colours to find next. */
export function LookbookSection() {
  const { userId } = useUser();
  const lookbook = useQuery({ queryKey: ["lookbook", userId], queryFn: () => api.lookbook(userId!), enabled: Boolean(userId) });
  const data = lookbook.data;
  if (!data || (data.outfits.length === 0 && data.suggestions.length === 0)) return null;

  return (
    <section className="mt-24 border-t border-hairline pt-16" aria-labelledby="lookbook-title">
      <p className="eyebrow mb-4">Complete the look</p>
      <h2 id="lookbook-title" className="display-md">Paired by colour, not by chance.</h2>
      <p className="mt-4 max-w-xl text-sm leading-relaxed text-stone">
        Pairings favour neutrals, tone-on-tone and neighbouring hues — what research on real outfits finds works — and treat bold complements with care.
      </p>

      {data.outfits.length > 0 && (
        <div className="mt-12 grid gap-10 md:grid-cols-2 xl:grid-cols-3">
          {data.outfits.map((outfit, i) => (
            <Reveal key={outfit.items.map((p) => p.id).join("-")} delay={i * 0.06}>
              <div className="grid grid-cols-2 gap-1">
                {outfit.items.map((p) => (
                  <a key={p.id} href={p.url} target="_blank" rel="noopener noreferrer" className="group relative block aspect-[3/4] overflow-hidden bg-porcelain">
                    <ProductImage src={p.image_url} alt={p.title} className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-105" />
                    {p.color_hex && <span className="absolute bottom-3 left-3 h-4 w-4 rounded-full ring-2 ring-ivory" style={{ backgroundColor: p.color_hex }} />}
                  </a>
                ))}
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <p className="eyebrow text-ink">{KIND_LABEL[outfit.harmony.kind] ?? titleCase(outfit.harmony.kind)}</p>
                <p className="font-display text-lg">{Math.round(outfit.score * 100)}</p>
              </div>
              <p className="mt-1 text-sm text-stone">{outfit.harmony.explanation}</p>
            </Reveal>
          ))}
        </div>
      )}

      {data.suggestions.length > 0 && (
        <div className="mt-16">
          <p className="eyebrow mb-6">To complete what you've kept</p>
          <ul className="divide-y divide-hairline border-y border-hairline">
            {data.suggestions.map((s) => (
              <li key={s.product.id} className="flex flex-wrap items-center gap-6 py-5">
                <ProductImage src={s.product.image_url} alt="" className="h-20 w-16 object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{s.product.title}</p>
                  <p className="mt-1 text-xs text-stone">Add a {s.need} in</p>
                  <div className="mt-2 flex flex-wrap gap-3">
                    {s.colors.map((c) => (
                      <span key={c.hex} className="flex items-center gap-1.5 text-xs">
                        <span className="h-4 w-4 rounded-full ring-1 ring-ink/10" style={{ backgroundColor: c.hex }} />{c.name}
                      </span>
                    ))}
                  </div>
                </div>
                <Link to={`/discover?q=${encodeURIComponent(s.query)}`} className="link-underline text-[0.68rem] uppercase tracking-[0.2em]">
                  Find it
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
