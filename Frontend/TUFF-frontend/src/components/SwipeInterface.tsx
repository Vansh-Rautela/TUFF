import React, { useState, useEffect } from 'react';
import { Zap, ArrowRight } from 'lucide-react';
import SwipeCard from '../components/SwipeCard';
import { motion, AnimatePresence } from 'framer-motion';

interface Product {
    id?: string;
    title: string;
    brand?: string;
    price?: string;
    thumbnail: string;
    link: string;
    category?: string;
    color?: string;
    style?: string;
    tags?: string[];
    recommendation_score?: number;
}

interface SwipeInterfaceProps {
    products: Product[];
    userId: string;
    onComplete?: () => void;
    onExit?: () => void;
    onSwipeUpdate?: (stats: { likes: number; dislikes: number; remaining: number }) => void;
    showButtons?: boolean;
}

export const SwipeInterface: React.FC<SwipeInterfaceProps> = ({
    products,
    userId,
    onComplete,
    onExit,
    onSwipeUpdate,
    showButtons = true
}) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [likeCount, setLikeCount] = useState(0);
    const [dislikeCount, setDislikeCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [lastSwipe, setLastSwipe] = useState<'like' | 'dislike' | null>(null);

    const currentProduct = products[currentIndex];
    const remainingProducts = products.length - currentIndex;

    useEffect(() => {
        if (onSwipeUpdate) {
            onSwipeUpdate({
                likes: likeCount,
                dislikes: dislikeCount,
                remaining: remainingProducts
            });
        }
    }, [currentIndex, likeCount, dislikeCount]);

    const handleSwipe = async (direction: 'like' | 'dislike') => {
        if (!currentProduct || isLoading) return;

        setIsLoading(true);
        setLastSwipe(direction);

        try {
            // Save swipe action to backend
            const response = await fetch('http://localhost:5000/swipe_action', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: userId,
                    product: {
                        id: currentProduct.id || currentProduct.link,
                        title: currentProduct.title,
                        brand: currentProduct.brand,
                        price: currentProduct.price,
                        thumbnail: currentProduct.thumbnail,
                        link: currentProduct.link,
                        category: currentProduct.category,
                        color: currentProduct.color,
                        style: currentProduct.style,
                        tags: currentProduct.tags
                    },
                    action: direction
                })
            });

            if (!response.ok) {
                console.error('Failed to save swipe action');
            }

            // Update counts
            if (direction === 'like') {
                setLikeCount(prev => prev + 1);
                
                // Store liked product in localStorage for filtering
                const likedProducts = JSON.parse(localStorage.getItem('likedProducts') || '[]');
                const productData = {
                    id: currentProduct.id || currentProduct.link,
                    title: currentProduct.title,
                    brand: currentProduct.brand,
                    price: currentProduct.price,
                    thumbnail: currentProduct.thumbnail,
                    link: currentProduct.link,
                    product_link: currentProduct.link, // For compatibility
                };
                
                // Check if already exists
                const exists = likedProducts.some((p: any) => (p.link || p.product_link) === currentProduct.link);
                if (!exists) {
                    likedProducts.push(productData);
                    localStorage.setItem('likedProducts', JSON.stringify(likedProducts));
                }
            } else {
                setDislikeCount(prev => prev + 1);
            }

            // Move to next product
            setTimeout(() => {
                setCurrentIndex(prev => prev + 1);
                setLastSwipe(null);
                setIsLoading(false);

                // Check if we've gone through all products
                if (currentIndex + 1 >= products.length) {
                    onComplete?.();
                }
            }, 300);

        } catch (error) {
            console.error('Error saving swipe:', error);
            setIsLoading(false);
            setLastSwipe(null);
        }
    };

    const handleUndo = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        }
    };

    // Show completion after 10 swipes OR all products done
    const shouldShowCompletion = currentIndex >= 10 || currentIndex >= products.length;
    const hasMoreProducts = currentIndex < products.length;

    if (shouldShowCompletion) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-center"
                >
                    <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Zap size={48} className="text-purple-600" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">
                        {hasMoreProducts ? "You're Doing Great! 🎉" : "All Done! 🎉"}
                    </h2>
                    <p className="text-gray-600 mb-2">
                        You've swiped through {Math.min(currentIndex, products.length)} products.
                    </p>
                    <p className="text-gray-600 mb-8">
                        Liked: {likeCount} | Passed: {dislikeCount}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        {hasMoreProducts && (
                            <button
                                onClick={() => {/* Continue swiping */ }}
                                className="px-6 py-3 border-2 border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors font-semibold"
                            >
                                Swipe More
                            </button>
                        )}
                        <button
                            onClick={onComplete}
                            className="px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 font-semibold shadow-lg"
                        >
                            {likeCount > 0 ? 'Explore More Products' : 'Browse Products'}
                            <ArrowRight size={20} />
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* Header Stats */}
            <div className="flex justify-between items-center p-4 bg-white border-b">
                <div className="flex gap-4">
                    <div className="text-sm text-gray-600">
                        {currentIndex + 1} / {products.length}
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-sm font-semibold text-gray-900">
                        ❤️ {likeCount} | ✕ {dislikeCount}
                    </div>
                    {onExit && (
                        <button
                            onClick={onExit}
                            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            Exit
                        </button>
                    )}
                </div>
            </div>

            {/* Card Stack Container */}
            <div className="flex-1 relative p-4 overflow-hidden">
                <div className="relative w-full max-w-md mx-auto h-full">
                    <AnimatePresence>
                        {products.slice(currentIndex, currentIndex + 3).map((product, index) => (
                            <SwipeCard
                                key={`${currentIndex + index}-${product.link}`}
                                product={product}
                                onSwipe={index === 0 ? handleSwipe : () => { }}
                                isTop={index === 0}
                                style={{
                                    zIndex: 10 - index,
                                    scale: 1 - index * 0.05,
                                }}
                            />
                        ))}
                    </AnimatePresence>

                    {/* Swipe Direction Indicator */}
                    {lastSwipe && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 px-8 py-4 rounded-2xl font-bold text-2xl ${lastSwipe === 'like'
                                    ? 'bg-green-500 text-white'
                                    : 'bg-red-500 text-white'
                                }`}
                        >
                            {lastSwipe === 'like' ? '❤️ LIKE' : '✕ PASS'}
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Swipe Hint */}
            <div className="pb-4 bg-white">
                <p className="text-center text-sm text-gray-600">
                    👈 Swipe left to pass • Swipe right to like 👉
                </p>
            </div>
        </div>
    );
};

export default SwipeInterface;
