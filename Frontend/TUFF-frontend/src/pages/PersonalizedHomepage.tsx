import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Search, Filter, Sparkles, TrendingUp, Star, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import BrandFilterModal from '../components/BrandFilterModal';
import LoadingScreen from '../components/LoadingScreen';
import TuffyChat from '../components/TuffyChat';
import TuffyFloatingButton from '../components/TuffyFloatingButton';
import ProductImage from '../components/ProductImage';
import { api, errorMessage, isAbortError, swipeToProduct } from '@/lib/api';
import { clearProfile, getSavedGender, getUserId } from '@/lib/session';
import type { ColorAnalysisResult, Product, UserAnalysis } from '@/types/fashion';

const ProductCard: React.FC<{ product: Product }> = ({ product }) => (
    <motion.a
        href={product.link}
        target="_blank"
        rel="noopener noreferrer"
        whileHover={{ y: -8, scale: 1.02 }}
        className="block bg-white rounded-xl shadow-lg overflow-hidden group focus:outline-none focus-visible:ring-4 focus-visible:ring-purple-400"
        title={product.match_reasons?.join(' · ') || undefined}
    >
        <div className="relative aspect-square overflow-hidden bg-gray-100">
            <ProductImage
                src={product.thumbnail}
                alt={product.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            />
            {!!product.match_score && product.match_score > 0 && (
                <div className="absolute top-3 right-3 bg-purple-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg flex items-center gap-1">
                    <Star size={14} fill="white" />
                    {product.match_score}% match
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
            {product.match_reasons && product.match_reasons.length > 0 && (
                <p className="text-xs text-purple-700 mt-1 line-clamp-1">✨ {product.match_reasons[0]}</p>
            )}
        </div>
    </motion.a>
);

export const PersonalizedHomepage: React.FC = () => {
    const navigate = useNavigate();
    const [userId] = useState(() => getUserId() || '');
    const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
    const [likedProducts, setLikedProducts] = useState<Product[]>([]);
    const [userAnalysis, setUserAnalysis] = useState<UserAnalysis | null>(null);
    const [colorAnalysis, setColorAnalysis] = useState<ColorAnalysisResult | null>(null);
    const [gender, setGender] = useState<string>(() => getSavedGender() || '');
    const [hasProfile, setHasProfile] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showBrandFilter, setShowBrandFilter] = useState(false);
    const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
    const [showTuffyChat, setShowTuffyChat] = useState(false);
    const requestRef = useRef<AbortController | null>(null);

    /** Search + rank. Takes its inputs explicitly so it never reads stale state. */
    const loadRecommendedProducts = useCallback(async (opts: { query: string; brands: string[]; gender: string }) => {
        requestRef.current?.abort();
        const controller = new AbortController();
        requestRef.current = controller;
        setIsLoading(true);
        setError(null);

        try {
            const found = await api.searchProducts({
                userId,
                gender: opts.gender || undefined,
                brands: opts.brands,
                filters: { brands: opts.brands },
                prompt: opts.query,
            }, controller.signal);
            const ranked = await api.rankProducts(userId, found.products, {}, controller.signal);
            setRecommendedProducts(ranked.recommendations);
            setUserAnalysis(ranked.user_analysis);
        } catch (err) {
            if (isAbortError(err)) return;
            setError(errorMessage(err, 'Could not load recommendations.'));
        } finally {
            if (requestRef.current === controller) setIsLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        if (!userId) {
            setHasProfile(false);
            return;
        }
        let cancelled = false;

        (async () => {
            setIsLoading(true);
            try {
                const feed = await api.homepageFeed(userId);
                if (cancelled) return;
                if (!feed.success) {
                    setHasProfile(false);
                    setIsLoading(false);
                    return;
                }
                setUserAnalysis(feed.user_analysis ?? null);
                setColorAnalysis(feed.color_analysis ?? null);
                const profileGender = feed.profile?.gender || getSavedGender() || '';
                setGender(profileGender);
                setLikedProducts((feed.recent_likes ?? []).slice(-6).reverse().map(swipeToProduct));
                await loadRecommendedProducts({ query: '', brands: [], gender: profileGender });
            } catch (err) {
                if (!cancelled) {
                    setError(errorMessage(err, 'Could not load your feed.'));
                    setIsLoading(false);
                }
            }
        })();

        return () => {
            cancelled = true;
            requestRef.current?.abort();
        };
    }, [userId, loadRecommendedProducts]);

    const handleSearch = () => {
        loadRecommendedProducts({ query: searchQuery, brands: selectedBrands, gender });
    };

    const handleResetProfile = () => {
        if (window.confirm('Are you sure you want to reset your profile? This will clear your color analysis, preferences, swipe history, and all product filters on this device.')) {
            clearProfile();
            navigate('/swipe');
        }
    };

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
                                <Sparkles size={20} />
                                <span className="hidden sm:inline">Swipe</span>
                            </button>
                            <button
                                onClick={() => navigate('/liked')}
                                aria-label="Saved items"
                                title="Saved items"
                                className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <Heart size={24} />
                                <span className="hidden sm:inline text-sm font-medium">Saved</span>
                            </button>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <form
                        className="flex gap-2"
                        role="search"
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleSearch();
                        }}
                    >
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="search"
                                aria-label="Search for fashion products"
                                placeholder="Search for fashion products..."
                                value={searchQuery}
                                maxLength={120}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                            />
                        </div>
                        <button
                            type="submit"
                            className="px-4 sm:px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold"
                        >
                            Search
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowBrandFilter(true)}
                            className="p-3 border-2 border-gray-200 rounded-lg hover:border-purple-500 transition-colors relative"
                            title="Filter by brands"
                            aria-label="Filter by brands"
                        >
                            <Filter size={20} />
                            {selectedBrands.length > 0 && (
                                <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                                    {selectedBrands.length}
                                </span>
                            )}
                        </button>
                    </form>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                {!hasProfile && (
                    <section className="text-center py-16">
                        <h2 className="text-3xl font-bold text-gray-900 mb-3">Let's build your style profile</h2>
                        <p className="text-gray-600 mb-6">A quick color analysis and a few swipes, and this page fills with picks for you.</p>
                        <button
                            onClick={() => navigate('/swipe')}
                            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold"
                        >
                            Get Started
                        </button>
                    </section>
                )}

                {/* User Style Summary */}
                {hasProfile && userAnalysis && (colorAnalysis || userAnalysis.total_likes > 0) && (
                    <section className="mb-12">
                        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl shadow-2xl p-6 sm:p-8 text-white">
                            <div className="flex items-center gap-3 mb-6">
                                <Sparkles size={32} />
                                <h2 className="text-2xl sm:text-3xl font-bold">Your Style Profile</h2>
                            </div>

                            <div className="grid md:grid-cols-3 gap-6">
                                {/* Color Analysis */}
                                {colorAnalysis?.skintone && (
                                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                                        <h3 className="font-semibold mb-2">Your Colors</h3>
                                        <p className="text-sm opacity-90">
                                            {colorAnalysis.skintone.season} - {colorAnalysis.skintone.undertone}
                                        </p>
                                        <div className="flex gap-2 mt-3">
                                            {colorAnalysis.complementaryColors?.slice(0, 4).map((color, idx) => (
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
                                        {userAnalysis.favorite_styles.length === 0 && (
                                            <span className="text-sm opacity-80">Keep swiping to discover them</span>
                                        )}
                                        {userAnalysis.favorite_styles.slice(0, 3).map((style, idx) => (
                                            <span key={idx} className="px-3 py-1 bg-white/20 rounded-full text-sm capitalize">
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
                                        {userAnalysis.favorite_colors.length > 0 && (
                                            <p className="capitalize">🎨 Loves {userAnalysis.favorite_colors.slice(0, 3).join(', ')}</p>
                                        )}
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
                {hasProfile && (
                    <section className="mb-12" aria-busy={isLoading}>
                        <div className="flex items-center gap-3 mb-6">
                            <TrendingUp className="text-purple-600" size={28} />
                            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Recommended For You</h2>
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
                        ) : error ? (
                            <div className="text-center py-12" role="alert">
                                <p className="text-red-600 font-semibold mb-4">{error}</p>
                                <button
                                    onClick={handleSearch}
                                    className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold"
                                >
                                    Try Again
                                </button>
                            </div>
                        ) : recommendedProducts.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {recommendedProducts.map((product) => (
                                    <ProductCard key={product.link} product={product} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <p className="text-gray-600 mb-4">No products matched. Try a different search or brand filter.</p>
                                <button
                                    onClick={() => navigate('/swipe')}
                                    className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold"
                                >
                                    Start Swiping
                                </button>
                            </div>
                        )}
                    </section>
                )}

                {/* Recently Liked */}
                {likedProducts.length > 0 && (
                    <section>
                        <div className="flex items-center justify-between gap-3 mb-6">
                            <div className="flex items-center gap-3">
                                <Heart className="text-pink-600" size={28} fill="currentColor" />
                                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Recently Liked</h2>
                            </div>
                            <button onClick={() => navigate('/liked')} className="text-purple-700 font-semibold hover:underline">
                                See all
                            </button>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                            {likedProducts.map((product) => (
                                <ProductCard key={`liked-${product.link}`} product={product} />
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
                    loadRecommendedProducts({ query: searchQuery, brands, gender });
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
                    gender: gender || undefined,
                    favoriteStyles: userAnalysis?.favorite_styles,
                    currentProducts: recommendedProducts.slice(0, 3)
                }}
            />
        </div>
    );
};

export default PersonalizedHomepage;
