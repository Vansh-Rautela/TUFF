import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { Chip } from "@/components/common/Chip";
import { EmptyState } from "@/components/common/EmptyState";
import { SwatchRow } from "@/components/common/SwatchRow";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useUser } from "@/hooks/useUser";
import { api, errorMessage } from "@/lib/api";
import { BUDGETS, GENDERS, OCCASIONS, STYLES } from "@/lib/catalog-options";
import { formatPrice, titleCase } from "@/lib/format";

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border-t border-hairline pt-5">
      <p className="font-display text-4xl font-light">{value}</p>
      <p className="eyebrow mt-2">{label}</p>
    </div>
  );
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const { userId, profile, isLoading, updateProfile, forget } = useUser();
  const insights = useQuery({ queryKey: ["insights", userId], queryFn: () => api.insights(userId!), enabled: Boolean(userId) });
  const [confirming, setConfirming] = useState(false);

  if (!userId || (!isLoading && !profile)) {
    return (
      <PageShell>
        <EmptyState eyebrow="Profile" title="You haven't begun yet." action={<Button asChild><Link to="/start">Begin</Link></Button>}>
          Your profile is created when you analyse a photo or save your first piece.
        </EmptyState>
      </PageShell>
    );
  }

  const save = (changes: Parameters<typeof updateProfile>[0]) =>
    updateProfile(changes).then(() => toast("Profile updated")).catch((e) => toast.error(errorMessage(e)));
  const season = profile?.color_analysis?.season;
  const data = insights.data;

  return (
    <PageShell>
      <section className="container py-14 lg:py-20">
        <p className="eyebrow mb-5">Your profile</p>
        <h1 className="display-lg">{season ? season.name : "Your style"}</h1>
        {season && (
          <div className="mt-8 flex flex-wrap items-center gap-6">
            <SwatchRow swatches={season.palette.signature} />
            <Link to="/studio" className="link-underline text-[0.7rem] uppercase tracking-[0.2em]">Full colour report</Link>
          </div>
        )}

        <div className="mt-20 grid gap-20 lg:grid-cols-[1.3fr_1fr]">
          <div className="space-y-12">
            <h2 className="font-display text-3xl font-light">Preferences</h2>
            <div>
              <p className="eyebrow mb-4">Shopping for</p>
              <div className="flex flex-wrap gap-2">
                {GENDERS.map((g) => <Chip key={g.value} selected={profile?.gender === g.value} onClick={() => save({ gender: g.value })}>{g.label}</Chip>)}
              </div>
            </div>
            <div>
              <p className="eyebrow mb-4">Styles</p>
              <div className="flex flex-wrap gap-2">
                {STYLES.map((s) => {
                  const selected = profile?.styles.includes(s) ?? false;
                  const next = selected ? profile!.styles.filter((x) => x !== s) : [...(profile?.styles ?? []), s].slice(-4);
                  return <Chip key={s} selected={selected} onClick={() => save({ styles: next })}>{s}</Chip>;
                })}
              </div>
            </div>
            <div>
              <p className="eyebrow mb-4">Occasions</p>
              <div className="flex flex-wrap gap-2">
                {OCCASIONS.map((o) => {
                  const selected = profile?.occasions.includes(o) ?? false;
                  const next = selected ? profile!.occasions.filter((x) => x !== o) : [...(profile?.occasions ?? []), o];
                  return <Chip key={o} selected={selected} onClick={() => save({ occasions: next })}>{o}</Chip>;
                })}
              </div>
            </div>
            <div>
              <p className="eyebrow mb-4">Budget per piece</p>
              <div className="flex flex-wrap gap-2">
                {BUDGETS.map((b) => (
                  <Chip key={b.label} selected={profile?.budget_max === b.max && (profile?.budget_min ?? 0) === b.min}
                    onClick={() => save({ budget_min: b.min, budget_max: b.max })}>{b.label}</Chip>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-12">
            <h2 className="font-display text-3xl font-light">What TUFF has learned</h2>
            {data && data.likes + data.passes > 0 ? (
              <>
                <div className="grid grid-cols-2 gap-8">
                  <Stat label="Pieces kept" value={data.likes} />
                  <Stat label="Passed" value={data.passes} />
                  {data.typical_price && <Stat label="Typical price" value={formatPrice(data.typical_price)!} />}
                  {data.top_categories[0] && <Stat label="Most kept" value={titleCase(data.top_categories[0])} />}
                </div>
                {data.favorite_colors.length > 0 && (
                  <div><p className="eyebrow mb-4">Colours you keep</p><SwatchRow swatches={data.favorite_colors} /></div>
                )}
                {data.top_brands.length > 0 && (
                  <div><p className="eyebrow mb-3">Labels you return to</p><p className="font-display text-2xl">{data.top_brands.join(" · ")}</p></div>
                )}
              </>
            ) : (
              <p className="text-sm text-stone">Swipe a few pieces and your taste profile will appear here. <Link to="/swipe" className="link-underline text-ink">Start swiping</Link></p>
            )}

            <div className="border-t border-hairline pt-10">
              <p className="eyebrow mb-3">Privacy</p>
              <p className="text-sm leading-relaxed text-stone">Your profile lives on TUFF's server under an anonymous id stored on this device. Photos are never stored.</p>
              <Button variant="outline" className="mt-6" onClick={() => setConfirming(true)}>Delete my data</Button>
            </div>
          </div>
        </div>
      </section>

      <Dialog open={confirming} onOpenChange={setConfirming}>
        <DialogContent className="rounded-none border-hairline bg-ivory p-10">
          <DialogTitle className="font-display text-3xl font-light">Delete everything?</DialogTitle>
          <DialogDescription className="text-sm text-stone">
            Your colour analysis, preferences, swipes and wardrobe will be permanently removed.
          </DialogDescription>
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setConfirming(false)}>Keep</Button>
            <Button variant="destructive" onClick={async () => {
              try {
                await forget();
                toast("Your data has been deleted");
                navigate("/");
              } catch (e) {
                toast.error(errorMessage(e));
              }
            }}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
