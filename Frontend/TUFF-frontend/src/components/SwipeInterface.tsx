import React, { useState, useEffect } from 'react';
import { Zap, ArrowRight } from 'lucide-react';
import SwipeCard from '../components/SwipeCard';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import { STORAGE_KEYS, readJSON, writeJSON } from '@/lib/session';
import type { Product } from '@/types/fashion';

/** Show a progress checkpoint every this many swipes. */
const CHECKPOINT_EVERY = 10;

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
    const [checkpoint, setCheckpoint] = useState(CHECKPOINT_EVERY);

    const currentProduct = products[currentIndex];
    const remainingProducts = products.length - currentIndex;

    useEffect(() => {
        onSwipeUpdate?.({
            likes: likeCount,
            dislikes: dislikeCount,
            remaining: remainingProducts
        });
    }, [onSwipeUpdate, likeCount, dislikeCount, remainingProducts]);

    const handleSwipe = async (direction: 'like' | 'dislike') => {
        if (!currentProduct || isLoading) return;

        setIsLoading(true);
        setLastSwipe(direction);

        // Saving is best-effort: a failed save shouldn't block swiping.
        api.swipe(userId, { ...currentProduct, id: currentProduct.id || currentProduct.link }, direction)
            .catch((error) => console.error('Failed to save swipe action:', error));

        if (direction === 'like') {
            setLikeCount(prev => prev + 1);

            // Keep a local copy of likes for offline display.
            const likedProducts = readJSON<Product[]>(STORAGE_KEYS.likedProducts) || [];
            if (!likedProducts.some((p) => p.link === currentProduct.link)) {
                writeJSON(STORAGE_KEYS.likedProducts, [...likedProducts, currentProduct]);
            }
        } else {
            setDislikeCount(prev => prev + 1);
        }

        // Move to next product after the swipe animation
        const isLast = currentIndex + 1 >= products.length;
        setTimeout(() => {
            setCurrentIndex(prev => prev + 1);
            setLastSwipe(null);
            setIsLoading(false);
            if (isLast) {
                onComplete?.();
            }
        }, 300);
    };

    const handleUndo = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        }
    };

    // Show a checkpoint every CHECKPOINT_EVERY swipes, or when all products are done
    const shouldShowCompletion = currentIndex >= checkpoint || currentIndex >= products.length;
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
                                onClick={() => setCheckpoint(currentIndex + CHECKPOINT_EVERY)}
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
