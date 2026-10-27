import { useEffect, type ReactNode } from "react";
import { useLocation } from "react-router-dom";

import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { StylistLauncher } from "@/components/stylist/StylistDrawer";
import { cn } from "@/lib/utils";

export function PageShell({ children, overlayHeader = false, footer = true, stylist = true, className }: {
  children: ReactNode;
  overlayHeader?: boolean;
  footer?: boolean;
  stylist?: boolean;
  className?: string;
}) {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: "smooth" });
    else window.scrollTo({ top: 0 });
  }, [pathname, hash]);

  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:bg-ink focus:px-4 focus:py-2 focus:text-ivory">
        Skip to content
      </a>
      <SiteHeader overlay={overlayHeader} />
      <main id="main" className={cn("flex-1", !overlayHeader && "pt-[4.5rem]", className)}>{children}</main>
      {footer && <SiteFooter />}
      {stylist && <StylistLauncher />}
    </div>
  );
}
