import { Link } from "react-router-dom";

import { Logo } from "@/components/brand/Logo";

export function SiteFooter() {
  return (
    <footer className="relative bg-noir text-ivory grain">
      <div className="container py-20">
        <div className="grid gap-14 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Logo light className="text-3xl" />
            <p className="mt-6 max-w-xs font-display text-2xl font-light italic leading-snug text-ivory/80">
              Dressed in your true colours.
            </p>
          </div>
          {[
            { title: "Explore", links: [["/discover", "Discover"], ["/swipe", "Swipe"], ["/saved", "Wardrobe"]] },
            { title: "Your colours", links: [["/studio", "Colour Studio"], ["/start", "Begin onboarding"], ["/profile", "Profile & privacy"]] },
            { title: "The method", links: [["/#method", "How it works"], ["/#science", "The science"], ["/#faq", "Questions"]] },
          ].map((column) => (
            <div key={column.title}>
              <p className="eyebrow mb-6 text-ivory/50">{column.title}</p>
              <ul className="space-y-3">
                {column.links.map(([to, label]) => (
                  <li key={to}><Link to={to} className="link-underline text-sm text-ivory/80 hover:text-ivory">{label}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-20 flex flex-col gap-4 border-t border-ivory/10 pt-8 text-xs text-ivory/40 md:flex-row md:justify-between">
          <p>© {new Date().getFullYear()} TUFF. Your photo is analysed in memory and never stored.</p>
          <p>Products, prices and availability belong to the linked stores.</p>
        </div>
      </div>
    </footer>
  );
}
