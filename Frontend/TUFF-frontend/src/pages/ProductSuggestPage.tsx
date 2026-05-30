import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { useSignUpUser } from "@/context/SignUpUserContext";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Home, MessageCircle, Heart, User, Search, Camera, 
  Filter, X, ChevronLeft, ChevronRight, ExternalLink, ShoppingBag
} from "lucide-react";
import amazonVideo1 from "@/assets/TUFFAI_Finds_Brands_for_Amazon (1).mp4";
import amazonVideo2 from "@/assets/TUFFAI_Finds_Brands_for_Amazon.mp4";
import adImage3 from "@/assets/Gemini_Generated_Image_wcgd3awcgd3awcgd.png";
import adImage1 from "@/assets/Gemini_Generated_Image_say4c9say4c9say4.png";

// --- MOCK DATA (placeholders) ---
const adContent = [
  { type: 'image', src: adImage1 },
  { type: 'video', src: amazonVideo1 },
  { type: 'image', src: adImage3 },
  { type: 'video', src: amazonVideo2 },
  { type: 'image', src: 'https://via.placeholder.com/1200x350/98FB98/2E8B57?text=Sustainable+Fashion' },
  { type: 'image', src: 'https://via.placeholder.com/1200x350/ADD8E6/191970?text=Explore+Our+Brands' },
  { type: 'image', src: 'https://via.placeholder.com/1200x350/F08080/800000?text=Limited+Time+Offers' },
];

// Brands supported by backend scrapers mapping
const brands = ['Amazon', 'Flipkart', 'Nykaa', 'Myntra', 'Zara', 'H&M', 'Levis', 'Lifestyle', 'Ajio', 'Bewakoof', 'Westside', 'Urbanic', 'Libas', 'Monte Carlo', 'Souled Store'];
const styles = ['Casual', 'Formal', 'Sporty', 'Ethnic', 'Partywear'];
const prices = ['Under 500', '500-1000', '1000-2000', '2000-5000', 'Above 5000'];

// --- INTERFACES ---
interface Product {
  title: string;
  link: string;
  thumbnail: string;
  price?: string;
  brand?: string;
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
  const { userData, generateLLMPrompt } = useSignUpUser();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentAd, setCurrentAd] = useState(0);
  const adCarouselRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const intervalRef = useRef<NodeJS.Timeout>();

  const [filters, setFilters] = useState({ brands: [], styles: [], prices: [] });

  // Initialize filters from signup data (brands) once on mount
  useEffect(() => {
    if (userData?.brands && Array.isArray(userData.brands) && userData.brands.length) {
      setFilters(prev => ({ ...prev, brands: userData.brands as any }));
    }
  }, []);

  // --- EFFECTS ---
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        // Get gender from localStorage or userData
        const savedGender = localStorage.getItem('userGender') || userData?.gender;
        if (savedGender) {
          localStorage.setItem('userGender', savedGender);
        }

        // Get userId from localStorage
        const userId = localStorage.getItem('userId') || `user_${Date.now()}`;
        localStorage.setItem('userId', userId);

        // Build userData with gender always included
        const enhancedUserData = {
          ...userData,
          userId: userId,
          gender: savedGender || userData?.gender,
        };

        // Get search prompt (gender and cloth type will be added automatically in backend)
        const searchPrompt = generateLLMPrompt();

        const response = await axios.post(
          "http://localhost:5000/scrape_products",
          { 
            prompt: searchPrompt, 
            userData: enhancedUserData, 
            filters 
          }
        );
        
        const fetchedProducts = response.data.products || [];
        
        // Track searched products in localStorage
        const searchedProducts = JSON.parse(localStorage.getItem('searchedProducts') || '[]');
        const newLinks = fetchedProducts.map((p: Product) => p.link);
        const updatedSearchedProducts = Array.from(new Set([...searchedProducts, ...newLinks]));
        localStorage.setItem('searchedProducts', JSON.stringify(updatedSearchedProducts));

        console.log(`Fetched ${fetchedProducts.length} products from backend`);
        setProducts(fetchedProducts);
      } catch (err: any) {
        console.error("Fetch error:", err);
        setError("Failed to fetch product suggestions.");
        setProducts([]);
      }
      setLoading(false);
    };
    fetchProducts();
  }, [filters, userData, generateLLMPrompt]);

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
  const handleFilterToggle = (type, value) => {
    setFilters(prev => ({
      ...prev,
      [type]: prev[type].includes(value)
        ? prev[type].filter(item => item !== value)
        : [...prev[type], value]
    }));
  };

  const handleClearSection = (type: 'brands' | 'prices' | 'styles') => {
    setFilters(prev => ({ ...prev, [type]: [] }));
  };

  const clearFilters = () => setFilters({ brands: [], styles: [], prices: [] });

  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = async (query: string) => {
    if (!query.trim()) return;
    
    setSearchQuery(query);
    setLoading(true);
    setError(null);
    
    try {
      // Get gender from localStorage
      const savedGender = localStorage.getItem('userGender') || userData?.gender;
      const userId = localStorage.getItem('userId') || `user_${Date.now()}`;
      
      // Build search query with gender and cloth type
      const enhancedUserData = {
        ...userData,
        userId: userId,
        gender: savedGender || userData?.gender,
      };

      const response = await axios.post(
        "http://localhost:5000/scrape_products",
        { 
          prompt: query, // Gender and cloth type will be added automatically in backend
          userData: enhancedUserData, 
          filters 
        }
      );
      
      const fetchedProducts = response.data.products || [];
      
      // Track searched products in localStorage
      const searchedProducts = JSON.parse(localStorage.getItem('searchedProducts') || '[]');
      const newLinks = fetchedProducts.map((p: Product) => p.link);
      const updatedSearchedProducts = Array.from(new Set([...searchedProducts, ...newLinks]));
      localStorage.setItem('searchedProducts', JSON.stringify(updatedSearchedProducts));

      console.log(`Search result: ${fetchedProducts.length} products`);
      setProducts(fetchedProducts);
    } catch (err: any) {
      console.error("Search error:", err);
      setError("Failed to fetch product suggestions.");
      setProducts([]);
    }
    setLoading(false);
  };

  const noProductsFound = !loading && !error && products.length === 0;

  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: MessageCircle, label: 'Ask TUFF', path: '/ask-tuff' },
    { icon: Heart, label: 'Wishlist', path: '/wishlist' },
    { icon: User, label: 'Profile', path: '/profile' },
  ];

  return (
    <div className="bg-purple-50 min-h-screen font-sans">
      {/* Header Bar */}
      <header className="sticky top-0 z-30 w-full bg-white/90 backdrop-blur-lg border-b border-purple-100 shadow-sm">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <Link to="/" className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-700">TUFF</Link>
          <div className="flex items-center space-x-4">
            {navItems.map(item => (
              <Button key={item.label} variant="ghost" asChild>
                <Link to={item.path} className="flex items-center">
                  <item.icon className="h-5 w-5 mr-2" />
                  <span className="hidden md:inline">{item.label}</span>
                </Link>
              </Button>
            ))}
          </div>
        </div>
      </header>

      {/* Advertising Carousel */}
      <div className="relative w-full h-[350px] overflow-hidden bg-gray-200">
        <div
          ref={adCarouselRef}
          className="flex h-full transition-transform duration-700 ease-in-out"
          style={{ transform: `translateX(-${currentAd * 100}%)` }}
        >
          {adContent.map((ad, index) => (
            <div key={index} className="w-full h-full flex-shrink-0">
              {ad.type === 'image' ? (
                <img src={ad.src} alt={`Ad ${index + 1}`} className="w-full h-full object-cover" />
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
        <Button variant="ghost" size="icon" className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/50 hover:bg-white/90 text-purple-700" onClick={() => setCurrentAd(c => (c - 1 + adContent.length) % adContent.length)}><ChevronLeft /></Button>
        <Button variant="ghost" size="icon" className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/50 hover:bg-white/90 text-purple-700" onClick={() => setCurrentAd(c => (c + 1) % adContent.length)}><ChevronRight /></Button>
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
            <div className="mb-6 flex gap-2">
              <div className="relative flex-grow">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-purple-400" />
                <Input 
                  placeholder="Search products, brands..." 
                  className="pl-11 h-11 bg-white border-purple-200 focus:ring-purple-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (searchQuery.trim()) {
                        // Trigger search with gender and cloth type
                        handleSearch(searchQuery);
                      }
                    }
                  }}
                />
              </div>
              <Button 
                variant="outline" 
                size="icon" 
                className="h-11 w-11 bg-white border-purple-200"
                onClick={() => {
                  if (searchQuery.trim()) {
                    handleSearch(searchQuery);
                  }
                }}
              >
                <Search className="h-5 w-5" />
              </Button>
              <Button variant="outline" size="icon" className="h-11 w-11 bg-white border-purple-200"><Camera className="h-5 w-5" /></Button>
            </div>

            {/* Product Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => <ProductSkeleton key={i} />)
              ) : error ? (
                <div className="col-span-full text-center py-20">
                  <p className="text-red-500 font-semibold">{error}</p>
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
                  <a href={product.link} target="_blank" rel="noopener noreferrer" key={index} className="block group animate-in fade-in-0 zoom-in-95 duration-500" style={{ animationDelay: `${index * 50}ms`}}>
                    <Card className="overflow-hidden h-full flex flex-col bg-white rounded-lg shadow-sm hover:shadow-xl transition-shadow duration-300 border-purple-100">
                      <CardContent className="p-0 flex-grow flex flex-col">
                        <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-t-lg">
                          <img src={product.thumbnail} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        </div>
                        <div className="p-4 flex flex-col flex-grow">
                          {product.brand && <p className="text-xs text-purple-500 uppercase font-semibold tracking-wider">{product.brand}</p>}
                          <h3 className="text-base font-semibold text-purple-900 leading-tight flex-grow my-1 min-h-[40px]">{product.title}</h3>
                          {product.price && <p className="text-lg font-bold text-purple-900 mb-3">{product.price}</p>}
                          <Button variant="outline" size="sm" className="w-full mt-auto bg-purple-600 text-white hover:bg-purple-700 border-purple-600">
                            View Product <ExternalLink className="inline-block h-4 w-4 ml-2" />
                          </Button>
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
