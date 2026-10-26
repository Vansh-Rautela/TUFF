import { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSignUpUser } from "@/context/SignUpUserContext";
import ProductImage from "@/components/ProductImage";
import { api, errorMessage, isAbortError } from "@/lib/api";
import { STORAGE_KEYS, getOrCreateUserId, getSavedGender, readJSON, writeJSON } from "@/lib/session";
import type { Product } from "@/types/fashion";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Home, MessageCircle, Heart, Sparkles, Search, Camera, 
  ChevronLeft, ChevronRight, ExternalLink, ShoppingBag
} from "lucide-react";
import amazonVideo1 from "@/assets/TUFFAI_Finds_Brands_for_Amazon (1).mp4";
import amazonVideo2 from "@/assets/TUFFAI_Finds_Brands_for_Amazon.mp4";
import adImage3 from "@/assets/Gemini_Generated_Image_wcgd3awcgd3awcgd.png";
import adImage1 from "@/assets/Gemini_Generated_Image_say4c9say4c9say4.png";

// Promotional carousel (bundled assets only)
const adContent = [
  { type: 'image', src: adImage1 },
  { type: 'video', src: amazonVideo1 },
  { type: 'image', src: adImage3 },
  { type: 'video', src: amazonVideo2 },
];

/** Keep the on-device history of seen product links bounded. */
const MAX_SEARCHED_PRODUCTS = 200;

// Brands supported by backend scrapers mapping
const brands = ['Amazon', 'Flipkart', 'Nykaa', 'Myntra', 'Zara', 'H&M', 'Levis', 'Lifestyle', 'Ajio', 'Bewakoof', 'Westside', 'Urbanic', 'Libas', 'Monte Carlo', 'Souled Store'];
const styles = ['Casual', 'Formal', 'Sporty', 'Ethnic', 'Partywear'];
const prices = ['Under 500', '500-1000', '1000-2000', '2000-5000', 'Above 5000'];

type FilterType = 'brands' | 'styles' | 'prices';
type Filters = Record<FilterType, string[]>;

function rememberSearchedProducts(products: Product[]) {
  const previous = readJSON<string[]>(STORAGE_KEYS.searchedProducts) || [];
  const merged = Array.from(new Set([...previous, ...products.map((p) => p.link)]));
  writeJSON(STORAGE_KEYS.searchedProducts, merged.slice(-MAX_SEARCHED_PRODUCTS));
}

// --- SUBCOMPONENTS ---
const ProductSkeleton = () => (
  <div className="flex flex-col space-y-3">
    <Skeleton className="h-56 w-full rounded-lg" />
    <div className="space-y-2">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-4 w-1/4" />
    </div>
  </div>
);

interface FilterSectionProps {
  title: string;
  items: string[];
  selected: string[];
  onToggle: (value: string) => void;
  onClear: () => void;
}

const FilterSection = ({ title, items, selected, onToggle, onClear }: FilterSectionProps) => (
  <div className="py-4 border-b border-purple-100 last:border-b-0">
    <div className="flex justify-between items-center mb-2">
      <h3 className="font-semibold text-purple-800">{title}</h3>
      {selected.length > 0 && (
        <Button variant="ghost" size="sm" onClick={onClear} className="h-auto p-1 text-xs text-purple-500 hover:text-purple-800">
          Clear
        </Button>
      )}
    </div>
    <ScrollArea className="h-40">
      <div className="space-y-2 pr-3">
        {items.map((item) => (
          <div key={item} className="flex items-center space-x-2">
            <Checkbox 
              id={`${title}-${item}`}
              checked={selected.includes(item)}
              onCheckedChange={() => onToggle(item)}
              className="data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
            />
            <label htmlFor={`${title}-${item}`} className="text-sm font-medium text-purple-700 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              {item}
            </label>
          </div>
        ))}
      </div>
    </ScrollArea>
  </div>
);

// --- MAIN PAGE COMPONENT ---
const ProductSuggestPage = () => {
  const navigate = useNavigate();
  const { userData } = useSignUpUser();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentAd, setCurrentAd] = useState(0);
  const adCarouselRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  // Brands chosen during sign-up seed the filter (read once, so there is no second fetch).
  const [filters, setFilters] = useState<Filters>(() => ({
    brands: Array.isArray(userData?.brands) ? userData.brands : [],
    styles: [],
    prices: [],
  }));
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');

  // --- EFFECTS ---
  useEffect(() => {
    const controller = new AbortController();
    const gender = getSavedGender() || userData?.gender;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        // Only the typed search text goes to retailers; profile details stay private.
        const response = await api.searchProducts({
          userId: getOrCreateUserId(),
          gender: gender || undefined,
          brands: filters.brands,
          filters,
          prompt: appliedQuery,
        }, controller.signal);
        rememberSearchedProducts(response.products);
        setProducts(response.products);
        setLoading(false);
      } catch (err) {
        if (isAbortError(err)) return; // superseded by a newer search
        console.error("Fetch error:", err);
        setError(errorMessage(err, "Failed to fetch product suggestions."));
        setProducts([]);
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [filters, appliedQuery, userData?.gender]);

  useEffect(() => {
    const advanceSlide = () => {
      setCurrentAd((prev) => (prev + 1) % adContent.length);
    };

    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    const currentSlide = adContent[currentAd];

    if (currentSlide.type === 'image') {
      // For images, set a 5-second timer
      intervalRef.current = setInterval(advanceSlide, 5000);
    } else {
      // For video, play it. The `onEnded` handler will advance the slide.
      videoRef.current?.play().catch(e => console.error("Video autoplay was prevented: ", e));
    }

    // Cleanup function to clear interval on component unmount or when `currentAd` changes
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [currentAd]);

  // --- HANDLERS ---
  const handleFilterToggle = (type: FilterType, value: string) => {
    setFilters(prev => ({
      ...prev,
      [type]: prev[type].includes(value)
        ? prev[type].filter(item => item !== value)
        : [...prev[type], value]
    }));
  };

  const handleClearSection = (type: FilterType) => {
    setFilters(prev => ({ ...prev, [type]: [] }));
  };

  const clearFilters = () => setFilters({ brands: [], styles: [], prices: [] });

  const handleSearch = (query: string) => {
    const trimmed = query.trim();
    if (trimmed) setAppliedQuery(trimmed);
  };

  const noProductsFound = !loading && !error && products.length === 0;

  // Every target here is a real route (the old /ask-tuff, /wishlist and /profile were 404s).
  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: MessageCircle, label: 'Ask TUFF', path: '/home' },
    { icon: Heart, label: 'Saved', path: '/liked' },
    { icon: Sparkles, label: 'Swipe', path: '/swipe' },
  ];

  return (
    <div className="bg-purple-50 min-h-screen font-sans">
      {/* Header Bar */}
      <header className="sticky top-0 z-30 w-full bg-white/90 backdrop-blur-lg border-b border-purple-100 shadow-sm">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <Link to="/" className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-700">TUFF</Link>
          <nav className="flex items-center space-x-1 sm:space-x-4" aria-label="Main">
            {navItems.map(item => (
              <Button key={item.label} variant="ghost" asChild>
                <Link to={item.path} className="flex items-center" aria-label={item.label}>
                  <item.icon className="h-5 w-5 mr-2" />
                  <span className="hidden md:inline">{item.label}</span>
                </Link>
              </Button>
            ))}
          </nav>
        </div>
      </header>

      {/* Advertising Carousel */}
      <div className="relative w-full h-[200px] sm:h-[350px] overflow-hidden bg-gray-200">
        <div
          ref={adCarouselRef}
          className="flex h-full transition-transform duration-700 ease-in-out"
          style={{ transform: `translateX(-${currentAd * 100}%)` }}
        >
          {adContent.map((ad, index) => (
            <div key={index} className="w-full h-full flex-shrink-0">
              {ad.type === 'image' ? (
                <img src={ad.src} alt={`Promotion ${index + 1}`} loading={index === 0 ? 'eager' : 'lazy'} className="w-full h-full object-cover" />
              ) : (
                <video 
                  ref={ad.type === 'video' ? videoRef : null}
                  src={ad.src} 
                  className="w-full h-full object-cover" 
                  autoPlay 
                  muted 
                  playsInline 
                  onEnded={() => setCurrentAd(c => (c + 1) % adContent.length)}
                />
              )}
            </div>
          ))}
        </div>
        <Button variant="ghost" size="icon" aria-label="Previous slide" className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/50 hover:bg-white/90 text-purple-700" onClick={() => setCurrentAd(c => (c - 1 + adContent.length) % adContent.length)}><ChevronLeft /></Button>
        <Button variant="ghost" size="icon" aria-label="Next slide" className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/50 hover:bg-white/90 text-purple-700" onClick={() => setCurrentAd(c => (c + 1) % adContent.length)}><ChevronRight /></Button>
      </div>

      <main className="container mx-auto p-4 md:p-6">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Filters Sidebar */}
          <aside className="w-full md:w-1/4 lg:w-1/5">
            <div className="sticky top-24 bg-white p-4 rounded-xl shadow-sm border">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-purple-900">Filters</h2>
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-sm">Clear All</Button>
              </div>
              <FilterSection title="Brands" items={brands} selected={filters.brands} onToggle={(v) => handleFilterToggle('brands', v)} onClear={() => handleClearSection('brands')} />
              <FilterSection title="Price" items={prices} selected={filters.prices} onToggle={(v) => handleFilterToggle('prices', v)} onClear={() => handleClearSection('prices')} />
              <FilterSection title="Style" items={styles} selected={filters.styles} onToggle={(v) => handleFilterToggle('styles', v)} onClear={() => handleClearSection('styles')} />
            </div>
          </aside>

          {/* Main Content */}
          <div className="w-full md:w-3/4 lg:w-4/5">
            {/* Search Bar */}
            <form
              className="mb-6 flex gap-2"
              role="search"
              onSubmit={(e) => {
                e.preventDefault();
                handleSearch(searchQuery);
              }}
            >
              <div className="relative flex-grow">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-purple-400" />
                <Input 
                  type="search"
                  aria-label="Search products"
                  placeholder="Search products, e.g. olive kurta" 
                  className="pl-11 h-11 bg-white border-purple-200 focus:ring-purple-500"
                  value={searchQuery}
                  maxLength={120}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button 
                type="submit"
                variant="outline" 
                size="icon" 
                aria-label="Search"
                className="h-11 w-11 bg-white border-purple-200"
              >
                <Search className="h-5 w-5" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Find your colors with a photo"
                title="Find your colors with a photo"
                className="h-11 w-11 bg-white border-purple-200"
                onClick={() => navigate('/color-analysis')}
              >
                <Camera className="h-5 w-5" />
              </Button>
            </form>

            {/* Product Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => <ProductSkeleton key={i} />)
              ) : error ? (
                <div className="col-span-full text-center py-20">
                  <p className="text-red-500 font-semibold" role="alert">{error}</p>
                  <p className="text-muted-foreground mt-2">Sorry, we couldn't generate your outfit. Please try again.</p>
                </div>
              ) : noProductsFound ? (
                <div className="col-span-full text-center py-20">
                  <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground"/>
                  <h3 className="mt-4 text-lg font-semibold">No Products Found</h3>
                  <p className="text-muted-foreground mt-2">Try adjusting your filters or search terms.</p>
                </div>
              ) : (
                products.map((product, index) => (
                  <a href={product.link} target="_blank" rel="noopener noreferrer" key={product.link} className="block group animate-in fade-in-0 zoom-in-95 duration-500 rounded-lg focus:outline-none focus-visible:ring-4 focus-visible:ring-purple-400" style={{ animationDelay: `${Math.min(index, 12) * 50}ms`}}>
                    <Card className="overflow-hidden h-full flex flex-col bg-white rounded-lg shadow-sm hover:shadow-xl transition-shadow duration-300 border-purple-100">
                      <CardContent className="p-0 flex-grow flex flex-col">
                        <div className="aspect-square w-full overflow-hidden rounded-t-lg bg-purple-50">
                          <ProductImage src={product.thumbnail} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        </div>
                        <div className="p-4 flex flex-col flex-grow">
                          {product.brand && <p className="text-xs text-purple-500 uppercase font-semibold tracking-wider">{product.brand}</p>}
                          <h3 className="text-base font-semibold text-purple-900 leading-tight flex-grow my-1 min-h-[40px] line-clamp-2">{product.title}</h3>
                          {product.price && <p className="text-lg font-bold text-purple-900 mb-3">{product.price}</p>}
                          {/* A span, not a button: the whole card is already the link. */}
                          <span className="inline-flex items-center justify-center w-full mt-auto h-9 rounded-md text-sm font-medium bg-purple-600 text-white group-hover:bg-purple-700">
                            View Product <ExternalLink className="inline-block h-4 w-4 ml-2" aria-hidden="true" />
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </a>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProductSuggestPage;
