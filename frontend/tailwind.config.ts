import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    container: { center: true, padding: { DEFAULT: "1.25rem", md: "2rem", lg: "3rem" }, screens: { "2xl": "1440px" } },
    extend: {
      colors: {
        ivory: "hsl(var(--ivory))",
        porcelain: "hsl(var(--porcelain))",
        ink: "hsl(var(--ink))",
        graphite: "hsl(var(--graphite))",
        stone: "hsl(var(--stone))",
        hairline: "hsl(var(--hairline))",
        champagne: { DEFAULT: "hsl(var(--champagne))", soft: "hsl(var(--champagne-soft))", deep: "hsl(var(--champagne-deep))" },
        noir: "hsl(var(--noir))",
        bordeaux: "hsl(var(--bordeaux))",
        sage: "hsl(var(--sage))",
        // shadcn tokens, mapped to the TUFF palette
        border: "hsl(var(--hairline))",
        input: "hsl(var(--hairline))",
        ring: "hsl(var(--champagne))",
        background: "hsl(var(--ivory))",
        foreground: "hsl(var(--ink))",
        primary: { DEFAULT: "hsl(var(--ink))", foreground: "hsl(var(--ivory))" },
        secondary: { DEFAULT: "hsl(var(--porcelain))", foreground: "hsl(var(--ink))" },
        muted: { DEFAULT: "hsl(var(--porcelain))", foreground: "hsl(var(--stone))" },
        accent: { DEFAULT: "hsl(var(--champagne-soft))", foreground: "hsl(var(--ink))" },
        destructive: { DEFAULT: "hsl(var(--bordeaux))", foreground: "hsl(var(--ivory))" },
        popover: { DEFAULT: "hsl(var(--porcelain))", foreground: "hsl(var(--ink))" },
        card: { DEFAULT: "hsl(var(--porcelain))", foreground: "hsl(var(--ink))" },
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', "Georgia", "serif"],
        sans: ["Manrope", "system-ui", "sans-serif"],
      },
      fontSize: {
        eyebrow: ["0.6875rem", { lineHeight: "1rem", letterSpacing: "0.24em" }],
      },
      letterSpacing: { luxe: "0.32em" },
      borderRadius: { lg: "4px", md: "3px", sm: "2px" },
      transitionTimingFunction: { couture: "cubic-bezier(0.22, 1, 0.36, 1)" },
      keyframes: {
        marquee: { from: { transform: "translateX(0)" }, to: { transform: "translateX(-50%)" } },
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
        shimmer: { "0%": { backgroundPosition: "-200% 0" }, "100%": { backgroundPosition: "200% 0" } },
      },
      animation: {
        marquee: "marquee 40s linear infinite",
        "accordion-down": "accordion-down 0.3s cubic-bezier(0.22, 1, 0.36, 1)",
        "accordion-up": "accordion-up 0.3s cubic-bezier(0.22, 1, 0.36, 1)",
        shimmer: "shimmer 2.2s linear infinite",
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;
