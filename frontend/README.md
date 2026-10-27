# TUFF — frontend

React 18 + TypeScript (strict) + Vite + Tailwind. Editorial design system: ivory, ink and champagne tokens in `src/styles.css`, Cormorant Garamond display type over Manrope.

```bash
npm ci
cp .env.example .env      # VITE_API_BASE_URL, default http://localhost:8000
npm run dev               # http://localhost:8080
npm run lint && npm run typecheck && npm test && npm run build
```

## Structure

```
src/
  app/            App (routes, lazy-loaded), providers, UserProvider
  pages/          HomePage, OnboardingPage (/start), DiscoverPage, SwipePage, SavedPage,
                  ColorStudioPage (/studio), ProfilePage, NotFoundPage
  components/
    layout/       SiteHeader, SiteFooter, PageShell
    product/      ProductCard, ProductGrid, ProductImage, StoreProgress
    color/        PhotoCapture (upload or camera), SeasonReport
    swipe/        SwipeDeck (drag, buttons, arrow keys)
    stylist/      StylistDrawer + launcher
    common/       Reveal, SectionHeading, Chip, SwatchRow, AxisMeter, Marquee, EmptyState
    ui/           the few shadcn/Radix primitives in use
  hooks/          useUser, useSaved (optimistic), useProductStream (SSE search)
  lib/            api client, session, image prep, formatting, onboarding options
  types/api.ts    API response shapes
```

Search results stream in store by store over Server-Sent Events (`/api/v1/products/search/stream`).
