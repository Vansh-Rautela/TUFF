import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Services from "./pages/Services";
import ColorAnalysis from "./pages/ColorAnalysis";
import HowItWorks from "./pages/HowItWorks";
import ProductSuggestPage from "./pages/ProductSuggestPage";
import SwipePage from "./pages/SwipePage";
import PersonalizedHomepage from "./pages/PersonalizedHomepage";
import SavedPage from "./pages/SavedPage";
import { SignUpUserProvider } from "@/context/SignUpUserContext";

const queryClient = new QueryClient();

const App = () => (
  <SignUpUserProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/services" element={<Services />} />
            <Route path="/color-analysis" element={<ColorAnalysis />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/product-suggestions" element={<ProductSuggestPage />} />
            <Route path="/swipe" element={<SwipePage />} />
            <Route path="/home" element={<PersonalizedHomepage />} />
            <Route path="/liked" element={<SavedPage />} />
            <Route path="/wishlist" element={<Navigate to="/liked" replace />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </SignUpUserProvider>
);

export default App;
