import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { toast } from "sonner";

import greyTailoring from "@/assets/editorial/grey-tailoring.webp";
import saffronStudio from "@/assets/editorial/saffron-studio.webp";
import streetPortrait from "@/assets/editorial/street-portrait.webp";
import { Logo } from "@/components/brand/Logo";
import { Chip } from "@/components/common/Chip";
import { SwatchRow } from "@/components/common/SwatchRow";
import { AxisMeter } from "@/components/common/AxisMeter";
import { PhotoCapture } from "@/components/color/PhotoCapture";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/useUser";
import { api, errorMessage } from "@/lib/api";
import { BODY_TYPES, BUDGETS, GENDERS, OCCASIONS, SIZES, STYLES } from "@/lib/catalog-options";
import { cn } from "@/lib/utils";
import type { ColorAnalysis, Gender } from "@/types/api";

const STEPS = [
  { key: "portrait", label: "Your colouring", image: streetPortrait },
  { key: "about", label: "About you", image: greyTailoring },
  { key: "style", label: "Your style", image: saffronStudio },
] as const;

function toggle(list: string[], value: string, max = 6): string[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value].slice(-max);
}

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { ensureUser, updateProfile, rememberAnalysis, profile } = useUser();
  const [step, setStep] = useState(0);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<ColorAnalysis | null>(profile?.color_analysis ?? null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [gender, setGender] = useState<Gender | null>(profile?.gender ?? null);
  const [bodyType, setBodyType] = useState<string | null>(profile?.body_type ?? null);
  const [sizes, setSizes] = useState<Record<string, string>>(profile?.sizes ?? {});
  const [styles, setStyles] = useState<string[]>(profile?.styles ?? []);
  const [occasions, setOccasions] = useState<string[]>(profile?.occasions ?? []);
  const [budget, setBudget] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const analyze = async (photo: Blob, preview: string) => {
    setPhotoUrl(preview);
    setAnalyzing(true);
    setAnalysisError(null);
    try {
      const result = await api.analyzeFace(photo, await ensureUser());
      setAnalysis(result);
      rememberAnalysis(result);
    } catch (error) {
      setAnalysisError(errorMessage(error));
    } finally {
      setAnalyzing(false);
    }
  };

  const finish = async () => {
    setSaving(true);
    try {
      const range = budget != null ? BUDGETS[budget] : null;
      await updateProfile({
        gender: gender ?? undefined,
        body_type: bodyType ?? undefined,
        sizes,
        styles,
        occasions,
        ...(range ? { budget_min: range.min, budget_max: range.max } : {}),
      });
      toast("Your edit is ready", { description: analysis ? `Curated for ${analysis.season.name}` : "Curated for you" });
      navigate("/discover");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const current = STEPS[step];
  const canContinue = step === 0 ? !analyzing : step === 1 ? Boolean(gender) : true;

  return (
    <div className="grid min-h-screen lg:grid-cols-[0.85fr_1.15fr]">
      <aside className="relative hidden overflow-hidden bg-noir lg:block">
        <AnimatePresence mode="wait">
          <motion.img key={current.key} src={step === 0 && photoUrl ? photoUrl : current.image} alt=""
            initial={{ opacity: 0, scale: 1.06 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 h-full w-full object-cover" />
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-t from-noir/80 via-noir/10 to-noir/30" />
        <div className="absolute inset-x-12 bottom-12 text-ivory">
          <p className="eyebrow text-ivory/60">Step {String(step + 1).padStart(2, "0")} of 03</p>
          <p className="mt-3 font-display text-5xl font-light">{current.label}</p>
        </div>
        {analyzing && (
          <motion.div aria-hidden className="absolute inset-x-0 h-px bg-champagne shadow-[0_0_24px_4px_rgba(185,151,91,0.7)]"
            initial={{ top: "10%" }} animate={{ top: ["10%", "90%", "10%"] }} transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }} />
        )}
      </aside>

      <main className="flex flex-col bg-ivory">
        <header className="flex h-[4.5rem] items-center justify-between px-6 sm:px-12">
          <Logo />
          <Link to="/" className="link-underline text-[0.7rem] uppercase tracking-[0.24em] text-stone">Exit</Link>
        </header>
        <div className="px-6 sm:px-12" aria-hidden>
          <div className="flex gap-2">
            {STEPS.map((s, i) => (
              <span key={s.key} className="h-px flex-1 overflow-hidden bg-hairline">
                <motion.span className="block h-full bg-ink" initial={false} animate={{ width: i <= step ? "100%" : "0%" }} transition={{ duration: 0.8 }} />
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-1 items-start justify-center px-6 py-12 sm:px-12 lg:items-center">
          <AnimatePresence mode="wait">
            <motion.section key={current.key} className="w-full max-w-xl"
              initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
              {step === 0 && (
                <>
                  <p className="eyebrow mb-5">Step 01 · Colour analysis</p>
                  {!analysis ? (
                    <>
                      <h1 className="display-md">Let's read your colouring.</h1>
                      <p className="mt-5 text-sm leading-relaxed text-stone">
                        A front-facing portrait in soft daylight works best. Your photo is analysed in memory and never stored.
                      </p>
                      <div className="mt-10">
                        {analyzing ? (
                          <div className="flex aspect-[4/5] flex-col items-center justify-center border border-hairline bg-porcelain text-center">
                            {photoUrl && <img src={photoUrl} alt="Your portrait" className="mb-8 h-40 w-40 rounded-full object-cover" />}
                            <p className="font-display text-3xl font-light">Reading your colouring…</p>
                            <p className="mt-3 text-xs uppercase tracking-[0.2em] text-stone">Landmarks · white balance · skin · contrast</p>
                          </div>
                        ) : (
                          <PhotoCapture onPhoto={analyze} />
                        )}
                        {analysisError && <p role="alert" className="mt-4 text-sm text-bordeaux">{analysisError}</p>}
                      </div>
                    </>
                  ) : (
                    <>
                      <h1 className="display-lg">{analysis.season.name}</h1>
                      <p className="mt-4 font-display text-2xl font-light italic text-graphite">{analysis.season.tagline}</p>
                      <p className="mt-5 text-sm leading-relaxed text-stone">{analysis.season.description}</p>
                      <SwatchRow swatches={analysis.season.palette.signature} size="lg" className="mt-10" />
                      <div className="mt-12 space-y-8">
                        <AxisMeter label="Warmth" left="Cool" right="Warm" value={analysis.axes.warmth} />
                        <AxisMeter label="Value" left="Deep" right="Light" value={analysis.axes.lightness} />
                        <AxisMeter label="Clarity" left="Soft" right="Bright" value={analysis.axes.clarity} />
                      </div>
                      <p className="mt-10 text-xs text-stone">
                        {Math.round(analysis.season.confidence * 100)}% confidence.{" "}
                        {analysis.quality.issues[0] ?? ""}{" "}
                        <button className="link-underline text-ink" onClick={() => { setAnalysis(null); setPhotoUrl(null); }}>Try another photo</button>
                      </p>
                    </>
                  )}
                </>
              )}

              {step === 1 && (
                <>
                  <p className="eyebrow mb-5">Step 02 · About you</p>
                  <h1 className="display-md">Who are we dressing?</h1>
                  <div className="mt-10 grid grid-cols-3 gap-3">
                    {GENDERS.map((g) => (
                      <button key={g.value} onClick={() => setGender(g.value)} aria-pressed={gender === g.value}
                        className={cn("border px-3 py-8 font-display text-xl transition-all duration-500",
                          gender === g.value ? "border-ink bg-ink text-ivory" : "border-hairline hover:border-ink/50")}>
                        {g.label}
                      </button>
                    ))}
                  </div>
                  <p className="eyebrow mb-4 mt-12">Body type <span className="normal-case tracking-normal">(optional)</span></p>
                  <div className="flex flex-wrap gap-2">
                    {BODY_TYPES.map((b) => <Chip key={b} selected={bodyType === b} onClick={() => setBodyType(bodyType === b ? null : b)}>{b}</Chip>)}
                  </div>
                  <p className="eyebrow mb-4 mt-12">Sizes <span className="normal-case tracking-normal">(optional)</span></p>
                  <div className="space-y-4">
                    {Object.entries(SIZES).map(([kind, options]) => (
                      <div key={kind} className="flex items-center gap-4">
                        <span className="w-16 text-xs capitalize text-stone">{kind}</span>
                        <div className="flex flex-wrap gap-1.5">
                          {options.map((o) => (
                            <button key={o} onClick={() => setSizes({ ...sizes, [kind]: sizes[kind] === o ? "" : o })} aria-pressed={sizes[kind] === o}
                              className={cn("h-9 min-w-9 border px-2 text-xs transition-colors", sizes[kind] === o ? "border-ink bg-ink text-ivory" : "border-hairline hover:border-ink/50")}>
                              {o}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <p className="eyebrow mb-5">Step 03 · Your style</p>
                  <h1 className="display-md">What do you reach for?</h1>
                  <p className="eyebrow mb-4 mt-10">Styles <span className="normal-case tracking-normal">(pick up to four)</span></p>
                  <div className="flex flex-wrap gap-2">
                    {STYLES.map((s) => <Chip key={s} selected={styles.includes(s)} onClick={() => setStyles(toggle(styles, s, 4))}>{s}</Chip>)}
                  </div>
                  <p className="eyebrow mb-4 mt-10">Occasions</p>
                  <div className="flex flex-wrap gap-2">
                    {OCCASIONS.map((o) => <Chip key={o} selected={occasions.includes(o)} onClick={() => setOccasions(toggle(occasions, o))}>{o}</Chip>)}
                  </div>
                  <p className="eyebrow mb-4 mt-10">Budget per piece</p>
                  <div className="grid grid-cols-2 gap-3">
                    {BUDGETS.map((b, i) => (
                      <button key={b.label} onClick={() => setBudget(budget === i ? null : i)} aria-pressed={budget === i}
                        className={cn("border p-5 text-left transition-all duration-500",
                          budget === i ? "border-ink bg-ink text-ivory" : "border-hairline hover:border-ink/50")}>
                        <span className="block font-display text-2xl">{b.label}</span>
                        <span className={cn("mt-1 block text-xs", budget === i ? "text-ivory/70" : "text-stone")}>{b.detail}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}

              <div className="mt-14 flex items-center justify-between">
                {step > 0 ? (
                  <Button variant="ghost" onClick={() => setStep(step - 1)}><ArrowLeft />Back</Button>
                ) : analysis ? (
                  <span />
                ) : (
                  <Button variant="ghost" onClick={() => setStep(1)} disabled={analyzing}>Skip for now</Button>
                )}
                {step < STEPS.length - 1 ? (
                  <Button onClick={() => setStep(step + 1)} disabled={!canContinue || (step === 0 && !analysis)}>Continue<ArrowRight /></Button>
                ) : (
                  <Button onClick={finish} disabled={saving}>{saving ? "Curating…" : "Reveal my edit"}<ArrowRight /></Button>
                )}
              </div>
            </motion.section>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
