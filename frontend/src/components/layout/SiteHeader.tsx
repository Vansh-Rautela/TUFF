import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Menu, User } from "lucide-react";

import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useSaved } from "@/hooks/useSaved";
import { useUser } from "@/hooks/useUser";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/discover", label: "Discover" },
  { to: "/studio", label: "Colour Studio" },
  { to: "/swipe", label: "Swipe" },
  { to: "/saved", label: "Wardrobe" },
];

export function SiteHeader({ overlay = false }: { overlay?: boolean }) {
  const { profile } = useUser();
  const { items } = useSaved();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const transparent = overlay && !scrolled;
  const navClass = ({ isActive }: { isActive: boolean }) =>
    cn("link-underline text-[0.7rem] font-medium uppercase tracking-[0.24em] transition-colors",
      transparent ? "text-ivory/90 hover:text-ivory" : "text-graphite hover:text-ink", isActive && "after:scale-x-100");

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-700 ease-couture",
        transparent ? "bg-transparent" : "border-b border-hairline/80 bg-ivory/85 backdrop-blur-xl",
      )}
    >
      <div className="container flex h-[4.5rem] items-center justify-between">
        <nav className="hidden flex-1 items-center gap-9 lg:flex" aria-label="Main">
          {NAV.slice(0, 2).map((item) => <NavLink key={item.to} to={item.to} className={navClass}>{item.label}</NavLink>)}
        </nav>

        <Logo light={transparent} />

        <div className="flex flex-1 items-center justify-end gap-9">
          <nav className="hidden items-center gap-9 lg:flex" aria-label="Wardrobe">
            {NAV.slice(2).map((item) => (
              <NavLink key={item.to} to={item.to} className={navClass}>
                {item.label}
                {item.to === "/saved" && items.length > 0 && <sup className="ml-1 text-champagne">{items.length}</sup>}
              </NavLink>
            ))}
          </nav>
          {profile?.onboarded ? (
            <Link to="/profile" aria-label="Your profile"
              className={cn("hidden h-10 w-10 items-center justify-center rounded-full border sm:flex",
                transparent ? "border-ivory/50 text-ivory" : "border-ink/30 text-ink hover:border-ink")}>
              <User className="h-4 w-4" strokeWidth={1.4} />
            </Link>
          ) : (
            <Button asChild size="sm" variant={transparent ? "outline-light" : "default"} className="hidden sm:inline-flex">
              <Link to="/start">Begin</Link>
            </Button>
          )}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button aria-label="Open menu" className={cn("lg:hidden", transparent ? "text-ivory" : "text-ink")}>
                <Menu className="h-6 w-6" strokeWidth={1.2} />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full max-w-sm border-l-0 bg-ivory p-10">
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <nav className="mt-16 flex flex-col gap-6" aria-label="Mobile">
                {[{ to: "/", label: "Home" }, ...NAV, { to: profile?.onboarded ? "/profile" : "/start", label: profile?.onboarded ? "Profile" : "Begin" }].map((item) => (
                  <Link key={item.to} to={item.to} onClick={() => setOpen(false)} className="font-display text-4xl font-light">
                    {item.label}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
