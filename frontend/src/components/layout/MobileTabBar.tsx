import { NavLink } from "react-router-dom";
import { Compass, Heart, Layers, Palette, User } from "lucide-react";

import { useSaved } from "@/hooks/useSaved";
import { cn } from "@/lib/utils";

const TABS = [
  { to: "/discover", label: "Discover", icon: Compass },
  { to: "/studio", label: "Studio", icon: Palette },
  { to: "/swipe", label: "Swipe", icon: Layers },
  { to: "/saved", label: "Wardrobe", icon: Heart },
  { to: "/profile", label: "You", icon: User },
];

/** Thumb-reach navigation for phones (hidden from lg up, where the header nav takes over). */
export function MobileTabBar() {
  const { items } = useSaved();
  return (
    <nav aria-label="Primary" className="fixed inset-x-0 bottom-0 z-40 border-t border-hairline bg-ivory/92 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
      <ul className="grid grid-cols-5">
        {TABS.map(({ to, label, icon: Icon }) => (
          <li key={to}>
            <NavLink to={to} className={({ isActive }) => cn("relative flex flex-col items-center gap-1 py-3 text-[0.58rem] uppercase tracking-[0.16em] transition-colors",
              isActive ? "text-ink" : "text-stone")}>
              {({ isActive }) => (
                <>
                  <Icon className="h-5 w-5" strokeWidth={isActive ? 1.6 : 1.2} />
                  {label}
                  {to === "/saved" && items.length > 0 && (
                    <span className="absolute right-[26%] top-2 h-1.5 w-1.5 rounded-full bg-champagne" aria-label={`${items.length} saved`} />
                  )}
                  {isActive && <span className="absolute top-0 h-px w-8 bg-ink" />}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
