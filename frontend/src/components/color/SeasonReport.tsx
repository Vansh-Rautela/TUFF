import { AxisMeter } from "@/components/common/AxisMeter";
import { Reveal } from "@/components/common/Reveal";
import { SwatchRow } from "@/components/common/SwatchRow";
import type { ColorAnalysis } from "@/types/api";

function Reading({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="flex items-baseline justify-between border-b border-hairline py-3.5">
      <span className="eyebrow">{label}</span>
      <span className="text-right">
        <span className="font-display text-xl">{value}</span>
        {detail && <span className="ml-2 text-xs text-stone">{detail}</span>}
      </span>
    </div>
  );
}

export function SeasonReport({ analysis, photoUrl }: { analysis: ColorAnalysis; photoUrl?: string | null }) {
  const { season, skin, features, axes, quality, alternatives } = analysis;
  return (
    <div className="space-y-20">
      <Reveal className="text-center">
        <p className="eyebrow mb-6">Your season</p>
        <h2 className="display-xl">{season.name}</h2>
        <p className="mt-6 font-display text-2xl font-light italic text-graphite">{season.tagline}</p>
        <p className="mx-auto mt-6 max-w-xl text-[0.95rem] leading-relaxed text-stone">{season.description}</p>
        <p className="mt-6 text-[0.7rem] uppercase tracking-[0.2em] text-stone">
          {Math.round(season.confidence * 100)}% confidence
          {alternatives.length > 0 && <> · also close: {alternatives.map((a) => a.name).join(", ")}</>}
        </p>
      </Reveal>

      <div className="grid gap-16 lg:grid-cols-[0.9fr_1.1fr]">
        <Reveal>
          <div className="flex items-center gap-6">
            <div className="relative">
              {photoUrl ? (
                <img src={photoUrl} alt="Your portrait" className="h-32 w-32 rounded-full object-cover" />
              ) : (
                <span className="block h-32 w-32 rounded-full" style={{ backgroundColor: skin.hex }} />
              )}
              <span className="absolute -bottom-1 -right-1 h-12 w-12 rounded-full border-4 border-ivory" style={{ backgroundColor: skin.hex }} />
            </div>
            <div>
              <p className="eyebrow">Measured skin tone</p>
              <p className="mt-2 font-display text-3xl">{skin.depth} · {skin.undertone}</p>
              <p className="mt-1 font-mono text-xs text-stone">{skin.hex} · {skin.pixels_measured.toLocaleString()} pixels</p>
            </div>
          </div>
          <div className="mt-10">
            <Reading label="Depth (ITA°)" value={skin.depth} detail={`${skin.ita}°`} />
            <Reading label="Undertone" value={skin.undertone} detail={`hue ${skin.hue_angle}°`} />
            <Reading label="Contrast" value={features.contrast} detail={`ΔL ${features.contrast_value}`} />
            {features.eyes_hex && (
              <div className="flex items-center justify-between border-b border-hairline py-3.5">
                <span className="eyebrow">Eyes · brows</span>
                <span className="flex gap-2">
                  <span className="h-6 w-6 rounded-full ring-1 ring-ink/10" style={{ backgroundColor: features.eyes_hex }} />
                  {features.brows_hex && <span className="h-6 w-6 rounded-full ring-1 ring-ink/10" style={{ backgroundColor: features.brows_hex }} />}
                </span>
              </div>
            )}
          </div>
          <div className="mt-12 space-y-10">
            <AxisMeter label="Warmth" left="Cool" right="Warm" value={axes.warmth} />
            <AxisMeter label="Value" left="Deep" right="Light" value={axes.lightness} />
            <AxisMeter label="Clarity" left="Soft" right="Bright" value={axes.clarity} />
          </div>
        </Reveal>

        <Reveal delay={0.1} className="space-y-12">
          <div>
            <p className="eyebrow mb-5">Signature colours</p>
            <div className="grid grid-cols-3 gap-4 sm:grid-cols-6">
              {season.palette.signature.map((s) => (
                <div key={s.name}>
                  <span className="block aspect-[3/4] w-full ring-1 ring-ink/5" style={{ backgroundColor: s.hex }} />
                  <span className="mt-2 block text-[0.68rem] uppercase tracking-[0.14em] text-graphite">{s.name}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="grid gap-10 sm:grid-cols-2">
            <div><p className="eyebrow mb-4">Neutrals</p><SwatchRow swatches={season.palette.neutrals} /></div>
            <div><p className="eyebrow mb-4">Accents</p><SwatchRow swatches={season.palette.accents} /></div>
            <div><p className="eyebrow mb-4">Wear sparingly</p><SwatchRow swatches={season.palette.avoid} crossed /></div>
            <div><p className="eyebrow mb-4">Metals</p><p className="font-display text-xl">{season.palette.metals.join(" · ")}</p></div>
          </div>
          {season.style_notes.length > 0 && (
            <ul className="space-y-3 border-t border-hairline pt-8">
              {season.style_notes.map((note) => (
                <li key={note} className="flex gap-3 text-sm leading-relaxed text-graphite">
                  <span className="text-champagne">✦</span>{note}
                </li>
              ))}
            </ul>
          )}
        </Reveal>
      </div>

      <div className="border-t border-hairline pt-8 text-xs leading-relaxed text-stone">
        {quality.issues.length > 0 && (
          <p className="mb-2 text-graphite">Notes on your photo: {quality.issues.join(" ")}</p>
        )}
        <p>{analysis.disclaimer} Measured with {quality.detector.replace(/-/g, " ")}; white balance via {quality.white_balance}.</p>
      </div>
    </div>
  );
}
