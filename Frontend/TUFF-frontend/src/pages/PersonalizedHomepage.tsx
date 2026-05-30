import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Search, Filter, ShoppingBag, Sparkles, TrendingUp, Star, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import BrandFilterModal from '../components/BrandFilterModal';
import LoadingScreen from '../components/LoadingScreen';
import TuffyChat from '../components/TuffyChat';
import TuffyFloatingButton from '../components/TuffyFloatingButton';

interface Product {
    id?: string;
    title: string;
    brand?: string;
    price?: string;
    thumbnail: string;
    link: string;
    recommendation_score?: number;
}

interface UserAnalysis {
    favorite_brands: string[];
    favorite_colors: string[];
    favorite_styles: string[];
    favorite_categories: string[];
    total_likes: number;
    total_dislikes: number;
}

export const PersonalizedHomepage: React.FC = () => {
    const navigate = useNavigate();
    const [userId] = useState(() => localStorage.getItem('userId') || '');
    const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
    const [likedProducts, setLikedProducts] = useState<Product[]>([]);
    const [userAnalysis, setUserAnalysis] = useState<UserAnalysis | null>(null);
    const [colorAnalysis, setColorAnalysis] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showBrandFilter, setShowBrandFilter] = useState(false);
    const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
    const [showTuffyChat, setShowTuffyChat] = useState(false);

    useEffect(() => {
        if (userId) {
            loadPersonalizedFeed();
        }
    }, [userId]);

    const loadPersonalizedFeed = async () => {
        setIsLoading(true);

        try {
            // Get homepage feed with user analysis
            const feedResponse = await fetch(`http://localhost:5000/homepage_feed/${userId}`);
            const feedData = await feedResponse.json();

            if (feedData.success) {
                setUserAnalysis(feedData.user_analysis);
                setColorAnalysis(feedData.color_analysis);

                // Load recently liked products
                const likedResponse = await fetch(`http://localhost:5000/liked_products/${userId}`);
                const likedData = await likedResponse.json();

                if (likedData.success) {
                    setLikedProducts(likedData.liked_products.slice(-6)); // Last 6 liked products
                }

                // Load recommended products
                await loadRecommendedProducts();
            }
        } catch (error) {
            console.error('Error loading personalized feed:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const loadRecommendedProducts = async () => {
        try {
            // Scrape products
            const scrapeResponse = await fetch('http://localhost:5000/scrape_products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userData: {
                        colorAnalysisResult: colorAnalysis,
                        brands: selectedBrands.length > 0 ? selectedBrands : undefined
                    },
                    filters: {
                        brands: selectedBrands
                    },
                    prompt: searchQuery || 'fashion clothing'
                })
            });

            const scrapeData = await scrapeResponse.json();

            // Get personalized recommendations
            const recsResponse = await fetch('http://localhost:5000/personalized_recommendations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: userId,
                    products: scrapeData.products
                })
            });

            if (recsResponse.ok) {
                const recsData = await recsResponse.json();
                setRecommendedProducts(recsData.recommendations || []);
            }
        } catch (error) {
            console.error('Error loading recommendations:', error);
        }
    };

    const handleSearch = () => {
        loadRecommendedProducts();
    };

    const handleResetProfile = () => {
        if (window.confirm('Are you sure you want to reset your profile? This will clear your color analysis, preferences, swipe history, and all product filters.')) {
            // Clear all localStorage
            localStorage.removeItem('colorAnalysis');
            localStorage.removeItem('userSizes');
            localStorage.removeItem('userPreferences');
            localStorage.removeItem('userId');
            localStorage.removeItem('userGender');
            localStorage.removeItem('userBodyType');
            localStorage.removeItem('likedProducts');
            localStorage.removeItem('searchedProducts');

            // Navigate to swipe page to restart onboarding
            navigate('/swipe');
        }
    };

    const ProductCard: React.FC<{ product: Product }> = ({ product }) => (
        <motion.div
            whileHover={{ y: -8, scale: 1.02 }}
            className="bg-white rounded-xl shadow-lg overflow-hidden cursor-pointer group"
            onClick={() => window.open(product.link, '_blank')}
        >
            <div className="relative aspect-square overflow-hidden bg-gray-100">
                <img
                    src={product.thumbnail || '/placeholder-product.jpg'}
                    alt={product.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                {product.recommendation_score !== undefined && product.recommendation_score > 0 && (
                    <div className="absolute top-3 right-3 bg-purple-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg flex items-center gap-1">
                        <Star size={14} fill="white" />
                        {product.recommendation_score}%
                    </div>
                )}
            </div>
            <div className="p-4">
                <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2 group-hover:text-purple-600 transition-colors">
                    {product.title}
                </h3>
                {product.brand && (
                    <p className="text-sm text-gray-600 mb-2">{product.brand}</p>
                )}
                {product.price && (
                    <p className="text-lg font-bold text-purple-600">{product.price}</p>
                )}
            </div>
        </motion.div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
            {/* Header */}
            <header className="bg-white shadow-md sticky top-0 z-40">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between mb-4">
                        <h1 className="text-2xl font-bold text-gray-900">TUFF Fashion</h1>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => navigate('/swipe')}
                                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                            >
                                <Heart size={20} />
                                <span className="hidden sm:inline">Swipe</span>
                            </button>
                            <button
                                onClick={() => navigate('/liked')}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <ShoppingBag size={24} />
                            </button>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="flex gap-2">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Search for fashion products..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                            />
                        </div>
                        <button
                            onClick={handleSearch}
                            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold"
                        >
                            Search
                        </button>
                        <button
                            onClick={() => setShowBrandFilter(true)}
                            className="p-3 border-2 border-gray-200 rounded-lg hover:border-purple-500 transition-colors relative"
                            title="Filter by brands"
                        >
                            <Filter size={20} />
                            {selectedBrands.length > 0 && (
                                <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                                    {selectedBrands.length}
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                {/* User Style Summary */}
                {userAnalysis && userAnalysis.total_likes > 0 && (
                    <section className="mb-12">
                        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl shadow-2xl p-8 text-white">
                            <div className="flex items-center gap-3 mb-6">
                                <Sparkles size={32} />
                                <h2 className="text-3xl font-bold">Your Style Profile</h2>
                            </div>

                            <div className="grid md:grid-cols-3 gap-6">
                                {/* Color Analysis */}
                                {colorAnalysis && (
                                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                                        <h3 className="font-semibold mb-2">Your Colors</h3>
                                        <p className="text-sm opacity-90">
                                            {colorAnalysis.skintone?.season} - {colorAnalysis.skintone?.undertone}
                                        </p>
                                        <div className="flex gap-2 mt-3">
                                            {colorAnalysis.complementaryColors?.slice(0, 4).map((color: any, idx: number) => (
                                                <div
                                                    key={idx}
                                                    className="w-8 h-8 rounded-full border-2 border-white shadow-lg"
                                                    style={{ backgroundColor: color.hex }}
                                                    title={color.name}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Favorite Styles */}
                                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                                    <h3 className="font-semibold mb-2">Favorite Styles</h3>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {userAnalysis.favorite_styles.slice(0, 3).map((style, idx) => (
                                            <span key={idx} className="px-3 py-1 bg-white/20 rounded-full text-sm">
                                                {style}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                                    <h3 className="font-semibold mb-2">Your Activity</h3>
                                    <div className="space-y-1 text-sm">
                                        <p>❤️ {userAnalysis.total_likes} products liked</p>
                                        <p>🛍️ {userAnalysis.favorite_brands.length} favorite brands</p>
                                    </div>
                                </div>
                            </div>

                            {/* Reset Profile Button */}
                            <button
                                onClick={handleResetProfile}
                                className="mt-4 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm font-semibold backdrop-blur-sm flex items-center gap-2"
                            >
                                <RotateCcw size={16} />
                                Reset Profile
                            </button>
                        </div>
                    </section>
                )}

                {/* Recommended For You */}
                <section className="mb-12">
                    <div className="flex items-center gap-3 mb-6">
                        <TrendingUp className="text-purple-600" size={28} />
                        <h2 className="text-3xl font-bold text-gray-900">Recommended For You</h2>
                    </div>

                    {isLoading ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {[...Array(8)].map((_, idx) => (
                                <div key={idx} className="bg-white rounded-xl shadow-lg overflow-hidden animate-pulse">
                                    <div className="aspect-square bg-gray-200" />
                                    <div className="p-4 space-y-2">
                                        <div className="h-4 bg-gray-200 rounded" />
                                        <div className="h-4 bg-gray-200 rounded w-3/4" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : recommendedProducts.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {recommendedProducts.map((product, idx) => (
                                <ProductCard key={`rec-${idx}-${product.link}`} product={product} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <p className="text-gray-600 mb-4">Start swiping to get personalized recommendations!</p>
                            <button
                                onClick={() => navigate('/swipe')}
                                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold"
                            >
                                Start Swiping
                            </button>
                        </div>
                    )}
                </section>

                {/* Recently Liked */}
                {likedProducts.length > 0 && (
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <Heart className="text-pink-600" size={28} fill="currentColor" />
                            <h2 className="text-3xl font-bold text-gray-900">Recently Liked</h2>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                            {likedProducts.map((product: any, idx) => (
                                <ProductCard key={`liked-${idx}`} product={{
                                    title: product.product_title,
                                    brand: product.product_brand,
                                    price: product.product_price,
                                    thumbnail: product.product_image,
                                    link: product.product_link
                                }} />
                            ))}
                        </div>
                    </section>
                )}
            </main>

            {/* Loading Screen */}
            {isLoading && (
                <LoadingScreen
                    message="Finding Your Perfect Style..."
                    submessage="Searching through thousands of products from your selected brands"
                />
            )}

            {/* Brand Filter Modal */}
            <BrandFilterModal
                isOpen={showBrandFilter}
                onClose={() => setShowBrandFilter(false)}
                onApply={(brands) => {
                    setSelectedBrands(brands);
                    loadRecommendedProducts();
                }}
                currentBrands={selectedBrands}
            />

            {/* TUFFY AI Style Advisor - Floating Button */}
            <TuffyFloatingButton onClick={() => setShowTuffyChat(true)} />

            {/* TUFFY Chat */}
            <TuffyChat
                isOpen={showTuffyChat}
                onClose={() => setShowTuffyChat(false)}
                userId={userId}
                userData={{
                    colorAnalysis,
                    gender: userAnalysis?.favorite_styles,
                    favoriteStyles: userAnalysis?.favorite_styles,
                    currentProducts: recommendedProducts
                }}
            />
        </div>
    );
};

export default PersonalizedHomepage;
