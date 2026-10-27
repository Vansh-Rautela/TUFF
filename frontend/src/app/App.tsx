import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { AppProviders } from "@/app/providers";
import HomePage from "@/pages/HomePage";

// Route-level code splitting: the landing page loads first, everything else on demand.
const OnboardingPage = lazy(() => import("@/pages/OnboardingPage"));
const DiscoverPage = lazy(() => import("@/pages/DiscoverPage"));
const SwipePage = lazy(() => import("@/pages/SwipePage"));
const SavedPage = lazy(() => import("@/pages/SavedPage"));
const ColorStudioPage = lazy(() => import("@/pages/ColorStudioPage"));
const ProfilePage = lazy(() => import("@/pages/ProfilePage"));
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage"));

function RouteFallback() {
  return <div className="flex min-h-screen items-center justify-center"><span className="eyebrow animate-pulse">TUFF</span></div>;
}

export default function App() {
  return (
    <AppProviders>
      <BrowserRouter>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/start" element={<OnboardingPage />} />
            <Route path="/discover" element={<DiscoverPage />} />
            <Route path="/swipe" element={<SwipePage />} />
            <Route path="/saved" element={<SavedPage />} />
            <Route path="/studio" element={<ColorStudioPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            {/* Old routes from v1 */}
            <Route path="/home" element={<Navigate to="/discover" replace />} />
            <Route path="/liked" element={<Navigate to="/saved" replace />} />
            <Route path="/wishlist" element={<Navigate to="/saved" replace />} />
            <Route path="/color-analysis" element={<Navigate to="/studio" replace />} />
            <Route path="/product-suggestions" element={<Navigate to="/discover" replace />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AppProviders>
  );
}
