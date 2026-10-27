import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

import paletteFlatlay from "@/assets/editorial/palette-flatlay.webp";
import { Reveal } from "@/components/common/Reveal";
import { PhotoCapture } from "@/components/color/PhotoCapture";
import { SeasonReport } from "@/components/color/SeasonReport";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/useUser";
import { api, errorMessage } from "@/lib/api";
import type { ColorAnalysis } from "@/types/api";

export default function ColorStudioPage() {
  const { profile, ensureUser, rememberAnalysis } = useUser();
  const [analysis, setAnalysis] = useState<ColorAnalysis | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retake, setRetake] = useState(false);
  const shown = analysis ?? (retake ? null : profile?.color_analysis ?? null);

  const analyze = async (photo: Blob, preview: string) => {
    setPhotoUrl(preview);
    setBusy(true);
    setError(null);
    try {
      const result = await api.analyzeFace(photo, await ensureUser());
      setAnalysis(result);
      rememberAnalysis(result);
      setRetake(false);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageShell>
      {!shown ? (
        <section className="grid min-h-[calc(100vh-4.5rem)] lg:grid-cols-2">
          <div className="relative hidden overflow-hidden lg:block">
            <img src={paletteFlatlay} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-noir/60 to-transparent" />
            <p className="absolute bottom-12 left-12 max-w-sm font-display text-4xl font-light italic text-ivory">
              Colour is the first thing anyone notices.
            </p>
          </div>
          <div className="flex items-center justify-center px-6 py-16 sm:px-12">
            <Reveal className="w-full max-w-md">
              <p className="eyebrow mb-5">The Colour Studio</p>
              <h1 className="display-md">Discover your season.</h1>
              <p className="mt-5 text-sm leading-relaxed text-stone">
                We measure your skin, eyes and brows, correct for the light in your photo, and place you in one of twelve seasons.
                The photo is analysed in memory and never stored.
              </p>
              <div className="mt-10">
                {busy ? (
                  <div className="flex aspect-[4/5] flex-col items-center justify-center border border-hairline bg-porcelain">
                    {photoUrl && <img src={photoUrl} alt="" className="mb-8 h-40 w-40 animate-pulse rounded-full object-cover" />}
                    <p className="font-display text-3xl font-light">Reading your colouring…</p>
                  </div>
                ) : (
                  <PhotoCapture onPhoto={analyze} />
                )}
                {error && <p role="alert" className="mt-4 text-sm text-bordeaux">{error}</p>}
              </div>
            </Reveal>
          </div>
        </section>
      ) : (
        <section className="container py-16 lg:py-24">
          <SeasonReport analysis={shown} photoUrl={analysis ? photoUrl : null} />
          <div className="mt-16 flex flex-wrap justify-center gap-4">
            <Button asChild size="lg"><Link to="/discover">Shop your palette<ArrowRight /></Link></Button>
            <Button size="lg" variant="outline" onClick={() => { setAnalysis(null); setRetake(true); }}>Analyse another photo</Button>
          </div>
        </section>
      )}
    </PageShell>
  );
}
