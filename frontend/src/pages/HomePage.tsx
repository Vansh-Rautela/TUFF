import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, ArrowDown } from "lucide-react";

import emeraldGown from "@/assets/editorial/emerald-gown.webp";
import greyTailoring from "@/assets/editorial/grey-tailoring.webp";
import noirTurtleneck from "@/assets/editorial/noir-turtleneck.webp";
import paletteFlatlay from "@/assets/editorial/palette-flatlay.webp";
import saffronWindow from "@/assets/editorial/saffron-window.webp";
import streetPortrait from "@/assets/editorial/street-portrait.webp";
import tealMovement from "@/assets/editorial/teal-movement.webp";
import vintagePortrait from "@/assets/editorial/vintage-portrait.webp";
import wardrobeRail from "@/assets/editorial/wardrobe-rail.webp";
import redDressPoster from "@/assets/video/red-dress-studio-poster.webp";
import redDressVideo from "@/assets/video/red-dress-studio.mp4";
import { Marquee } from "@/components/common/Marquee";
import { Reveal } from "@/components/common/Reveal";
import { SectionHeading } from "@/components/common/SectionHeading";
import { PageShell } from "@/components/layout/PageShell";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/useUser";
import { SEASON_FAMILIES } from "@/lib/seasons";

const STORES = ["Myntra", "Flipkart", "Amazon", "Ajio", "Zara", "H&M", "Westside", "Libas", "Lifestyle", "Bewakoof"];

const METHOD = [
  { n: "01", title: "Read your colouring", image: streetPortrait,
    text: "One portrait. We map 478 facial landmarks, correct the light using the whites of your eyes, and measure your skin, eyes and brows to place you in one of twelve seasons." },
  { n: "02", title: "Learn your taste", image: saffronWindow,
    text: "Swipe through real pieces. Every keep and pass refines a taste profile — colours, cuts and labels — weighted towards what you love now." },
  { n: "03", title: "Receive your edit", image: wardrobeRail,
    text: "We search Myntra, Flipkart and Amazon at once, read each garment's true colour from its photo, and rank everything for you — with the reason why." },
];

const SCIENCE: { figure: ReactNode; label: string; text: string }[] = [
  { figure: "478", label: "Facial landmarks", text: "MediaPipe Face Landmarker maps skin, irises and brows; skin is sampled from thousands of pixels, not a handful of points." },
  { figure: <>ΔE<sub className="text-2xl">00</sub></>, label: "Perceptual colour distance", text: "Garments are matched to your palette with CIEDE2000, the colour-difference standard used in textile and print." },
  { figure: "12", label: "Seasonal palettes", text: "Warmth, depth and clarity — measured, not guessed — decide your season, with a confidence score and alternatives." },
  { figure: "<3s", label: "Three stores, one edit", text: "Stores are searched in parallel and stream in as they answer. Repeat searches return in milliseconds." },
];

const FAQ = [
  ["Is my photo stored?", "No. Your portrait is analysed in memory and discarded immediately. Only the result — your season and measured colours — is saved to your profile, and you can delete everything from your profile page."],
  ["How accurate is colour analysis from a photo?", "It's a careful estimate. We correct white balance and check photo quality, and every result comes with a confidence score and notes. Daylight facing a window, no filters and no heavy makeup give the most reliable reading."],
  ["Do I need an account?", "No sign-up. TUFF keeps an anonymous profile tied to this device. Clearing it takes one click."],
  ["Where do the products come from?", "TUFF searches Myntra, Flipkart and Amazon India live (with more stores available) and links you straight to the product. Prices and availability are set by each store."],
  ["Why is a piece recommended to me?", "Every match shows its reasons: how close its colour sits to your palette, whether it echoes pieces you've kept, your budget and your style."],
];

export default function HomePage() {
  const { profile } = useUser();
  const primaryCta = profile?.onboarded ? { to: "/discover", label: "Open your edit" } : { to: "/start", label: "Find your season" };

  return (
    <PageShell overlayHeader>
      {/* Hero */}
      <section className="relative flex min-h-[100svh] items-end overflow-hidden bg-noir text-ivory">
        <motion.img src={tealMovement} alt="" aria-hidden
          initial={{ scale: 1.12 }} animate={{ scale: 1 }} transition={{ duration: 2.4, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 h-full w-full object-cover object-[60%_30%]" />
        <div className="absolute inset-0 bg-gradient-to-r from-noir/85 via-noir/45 to-noir/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-noir/70 via-transparent to-noir/30" />
        <div className="container relative pb-20 pt-40 lg:pb-28">
          <motion.p className="eyebrow mb-8 text-ivory/70" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4, duration: 1 }}>
            Personal styling, decoded
          </motion.p>
          <motion.h1 className="display-xl max-w-5xl" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 1.2, ease: [0.22, 1, 0.36, 1] }}>
            Dressed in your <em className="font-light italic text-champagne-soft">true</em> colours.
          </motion.h1>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, duration: 1 }}
            className="mt-10 flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-md">
              <p className="text-[0.95rem] leading-relaxed text-ivory/75">
                TUFF reads your colouring from a single photo, learns what you love, and edits India's largest fashion stores down to the pieces made for you.
              </p>
              <div className="mt-10 flex flex-wrap gap-4">
                <Button asChild variant="light" size="lg"><Link to={primaryCta.to}>{primaryCta.label}<ArrowRight /></Link></Button>
                <Button asChild variant="outline-light" size="lg"><Link to="/discover">Explore the edit</Link></Button>
              </div>
            </div>
            <dl className="grid grid-cols-3 gap-10 border-t border-ivory/20 pt-6 lg:min-w-[26rem]">
              {[["478", "landmarks"], ["12", "seasons"], ["3", "stores, live"]].map(([n, l]) => (
                <div key={l}><dt className="sr-only">{l}</dt><dd className="font-display text-4xl font-light">{n}</dd>
                  <p className="mt-1 text-[0.66rem] uppercase tracking-[0.22em] text-ivory/60">{l}</p></div>
              ))}
            </dl>
          </motion.div>
        </div>
        <a href="#manifesto" aria-label="Scroll down" className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 text-ivory/60 lg:block">
          <ArrowDown className="h-4 w-4 animate-bounce" strokeWidth={1.2} />
        </a>
      </section>

      {/* Stores */}
      <section className="hairline-b bg-ivory py-10" aria-label="Stores we search">
        <Marquee items={STORES} />
      </section>

      {/* Manifesto */}
      <section id="manifesto" className="container py-28 lg:py-40">
        <Reveal className="mx-auto max-w-4xl text-center">
          <p className="eyebrow mb-10">The TUFF manifesto</p>
          <p className="font-display text-[2rem] font-light leading-[1.25] sm:text-5xl sm:leading-[1.2]">
            Most fashion apps show you everything. <span className="italic text-champagne-deep">TUFF shows you what's yours</span> — the colours that light your skin, the cuts you return to, edited from the stores you already shop.
          </p>
        </Reveal>
      </section>

      {/* Method */}
      <section id="method" className="container scroll-mt-24 pb-32">
        <SectionHeading eyebrow="The method" title={<>Three steps to a wardrobe<br className="hidden sm:block" /> that feels like you.</>} />
        <div className="mt-20 grid gap-16 md:grid-cols-3 md:gap-8">
          {METHOD.map((step, i) => (
            <Reveal key={step.n} delay={i * 0.12} className={i === 1 ? "md:mt-24" : undefined}>
              <div className="group overflow-hidden">
                <img src={step.image} alt="" loading="lazy" className="aspect-[4/5] w-full object-cover transition-transform duration-[1600ms] ease-couture group-hover:scale-105" />
              </div>
              <div className="mt-8 flex gap-6">
                <span className="font-display text-2xl italic text-champagne">{step.n}</span>
                <div>
                  <h3 className="font-display text-3xl">{step.title}</h3>
                  <p className="mt-4 text-sm leading-relaxed text-stone">{step.text}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Colour Studio */}
      <section className="bg-porcelain">
        <div className="grid lg:grid-cols-2">
          <div className="relative min-h-[34rem] overflow-hidden">
            <video src={redDressVideo} poster={redDressPoster} autoPlay muted loop playsInline aria-hidden
              className="absolute inset-0 h-full w-full object-cover" />
          </div>
          <div className="px-6 py-24 sm:px-16 lg:px-20 lg:py-32">
            <SectionHeading eyebrow="The Colour Studio" title={<>Twelve seasons.<br />One is unmistakably yours.</>}>
              Warmth, depth and clarity — the three qualities that decide which colours make you glow and which wash you out.
            </SectionHeading>
            <div className="mt-14 grid grid-cols-2 gap-x-10 gap-y-10">
              {SEASON_FAMILIES.map((group) => (
                <div key={group.family}>
                  <p className="eyebrow mb-4 text-ink">{group.family}</p>
                  <ul className="space-y-3">
                    {group.seasons.map((season) => (
                      <li key={season.name} className="flex items-center justify-between gap-3 border-b border-hairline pb-3">
                        <span className="font-display text-lg">{season.name}</span>
                        <span className="flex -space-x-1.5">
                          {season.hexes.map((hex) => <span key={hex} className="h-4 w-4 rounded-full ring-2 ring-porcelain" style={{ backgroundColor: hex }} />)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <Button asChild className="mt-14"><Link to="/studio">Enter the studio<ArrowRight /></Link></Button>
          </div>
        </div>
      </section>

      {/* Science */}
      <section id="science" className="relative scroll-mt-24 bg-noir py-28 text-ivory grain lg:py-36">
        <div className="container">
          <SectionHeading light eyebrow="Science, not guesswork" title={<>Measured like a colourist.<br />Edited like a stylist.</>} />
          <div className="mt-20 grid gap-px bg-ivory/10 sm:grid-cols-2 lg:grid-cols-4">
            {SCIENCE.map((item, i) => (
              <Reveal key={item.label} delay={i * 0.08} className="bg-noir p-8 lg:p-10">
                <p className="font-display text-6xl font-light text-champagne-soft">{item.figure}</p>
                <p className="eyebrow mt-6 text-ivory">{item.label}</p>
                <p className="mt-4 text-sm leading-relaxed text-ivory/60">{item.text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Stylist */}
      <section className="container grid items-center gap-16 py-28 lg:grid-cols-2 lg:py-36">
        <Reveal>
          <SectionHeading eyebrow="The Stylist" title={<>A stylist on call,<br />fluent in your palette.</>}>
            Ask what to wear to a wedding, which neutrals suit you, or to find an olive linen shirt under ₹2,000. The Stylist answers with real pieces, ranked for you.
          </SectionHeading>
        </Reveal>
        <Reveal delay={0.15} className="relative">
          <img src={emeraldGown} alt="" loading="lazy" className="aspect-[4/5] w-full object-cover lg:w-4/5" />
          <div className="absolute bottom-8 right-0 w-[85%] max-w-sm space-y-3 bg-ivory p-6 shadow-[0_30px_80px_-30px_rgba(18,17,16,0.5)] sm:-right-4 lg:right-0">
            <p className="eyebrow">Example conversation</p>
            <p className="ml-auto w-fit bg-ink px-4 py-2.5 text-sm text-ivory">Something for a winter wedding?</p>
            <p className="border-l border-champagne pl-4 text-sm leading-relaxed text-graphite">
              As a Deep Autumn, go for a richly coloured silk set — deep teal or burgundy — with antique-gold jewellery. Here are four, ranked for you.
            </p>
          </div>
        </Reveal>
      </section>

      {/* Lookbook */}
      <section className="pb-28" aria-label="Lookbook">
        <div className="grid grid-cols-2 gap-1 md:grid-cols-4">
          {[[noirTurtleneck, "Noir"], [vintagePortrait, "Heritage"], [greyTailoring, "Tailoring"], [paletteFlatlay, "Palette"]].map(([src, label], i) => (
            <Reveal key={label} delay={i * 0.08} className="group relative overflow-hidden">
              <img src={src} alt="" loading="lazy" className="aspect-[3/4] w-full object-cover transition-transform duration-[1600ms] ease-couture group-hover:scale-105" />
              <span className="absolute bottom-5 left-5 font-display text-2xl italic text-ivory drop-shadow">{label}</span>
            </Reveal>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="container scroll-mt-24 pb-32">
        <div className="grid gap-16 lg:grid-cols-[1fr_1.4fr]">
          <SectionHeading eyebrow="Questions" title="Before you begin." />
          <Accordion type="single" collapsible className="border-t border-hairline">
            {FAQ.map(([q, a]) => (
              <AccordionItem key={q} value={q} className="border-b border-hairline">
                <AccordionTrigger className="py-6 text-left font-display text-2xl font-light hover:no-underline">{q}</AccordionTrigger>
                <AccordionContent className="pb-6 text-sm leading-relaxed text-stone">{a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Final CTA */}
      <section className="hairline-b border-t border-hairline">
        <Reveal className="container flex flex-col items-center py-28 text-center lg:py-36">
          <p className="eyebrow mb-8">It takes about a minute</p>
          <h2 className="display-lg max-w-3xl">Begin with a single photo.</h2>
          <Button asChild size="lg" className="mt-12"><Link to={primaryCta.to}>{primaryCta.label}<ArrowRight /></Link></Button>
        </Reveal>
      </section>
    </PageShell>
  );
}
