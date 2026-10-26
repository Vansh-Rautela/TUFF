import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import SwipeInterface from '../components/SwipeInterface';
import UserSizeModal from '../components/UserSizeModal';
import StylePreferencesModal from '../components/StylePreferencesModal';
import ColorAnalysisModal from '../components/ColorAnalysisModal';
import LoadingScreen from '../components/LoadingScreen';
import { AlertCircle } from 'lucide-react';
import { api, errorMessage, isAbortError } from '@/lib/api';
import {
    STORAGE_KEYS,
    getOrCreateUserId,
    getSavedBodyType,
    getSavedGender,
    hasStored,
    profileCache,
    saveGenderAndBody,
    writeJSON,
} from '@/lib/session';
import type { ClothingSizes, ColorAnalysisResult, Product, ProfileUpdates, StylePreferences } from '@/types/fashion';

type FlowStep = 'color-analysis' | 'sizes' | 'preferences' | 'loading' | 'swipe';

const SWIPE_BRANDS = ['Amazon', 'Flipkart', 'Myntra'];

export const SwipePage: React.FC = () => {
    const navigate = useNavigate();
    const [userId] = useState(getOrCreateUserId);
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentStep, setCurrentStep] = useState<FlowStep>('color-analysis');
    const [gender, setGender] = useState<string>(() => getSavedGender() || '');
    const [bodyType, setBodyType] = useState<string>(() => getSavedBodyType() || '');
    const requestRef = useRef<AbortController | null>(null);

    const saveProfile = useCallback(async (updates: ProfileUpdates) => {
        try {
            await api.updateProfile(userId, updates);
        } catch (err) {
            // Local copy is kept; the next save will sync it.
            console.error('Failed to save profile:', err);
        }
    }, [userId]);

    /** Search retailers for the user's gender, then rank for this user. */
    const loadProducts = useCallback(async (searchGender: string) => {
        requestRef.current?.abort();
        const controller = new AbortController();
        requestRef.current = controller;
        setIsLoading(true);
        setError(null);

        try {
            const found = await api.searchProducts(
                {
                    userId,
                    gender: searchGender || undefined,
                    brands: SWIPE_BRANDS,
                    filters: { styles: profileCache.preferences()?.styles ?? [] },
                },
                controller.signal,
            );
            let deck = found.products;
            try {
                const ranked = await api.rankProducts(userId, found.products, { excludeSwiped: true }, controller.signal);
                deck = ranked.recommendations;
            } catch (err) {
                if (isAbortError(err)) throw err;
                console.error('Ranking failed, showing unranked products:', err);
            }
            setProducts(deck);
            setCurrentStep('swipe');
        } catch (err) {
            if (isAbortError(err)) return;
            setError(errorMessage(err, 'Failed to load products. Please try again.'));
            setCurrentStep('swipe');
        } finally {
            if (requestRef.current === controller) setIsLoading(false);
        }
    }, [userId]);

    // Resume onboarding where the user left off.
    useEffect(() => {
        if (!hasStored(STORAGE_KEYS.colorAnalysis)) return;
        if (profileCache.sizes() && profileCache.preferences()) {
            setCurrentStep('loading');
            loadProducts(getSavedGender() || '');
        } else if (profileCache.sizes()) {
            setCurrentStep('preferences');
        } else {
            setCurrentStep('sizes');
        }
        return () => requestRef.current?.abort();
    }, [loadProducts]);

    const handleColorAnalysisComplete = (analysis: ColorAnalysisResult | null) => {
        // "null" means the user skipped; remember that so we don't ask again.
        writeJSON(STORAGE_KEYS.colorAnalysis, analysis);
        if (analysis) {
            saveProfile({ color_analysis: analysis });
        }
        setCurrentStep('sizes');
    };

    const handleSizesSubmit = (sizes: ClothingSizes) => {
        writeJSON(STORAGE_KEYS.sizes, sizes);
        saveGenderAndBody(sizes.gender, sizes.physique);
        setGender(sizes.gender);
        setBodyType(sizes.physique);
        saveProfile({ clothing_sizes: sizes, gender: sizes.gender, body_type: sizes.physique });
        setCurrentStep('preferences');
    };

    const handlePreferencesSubmit = (prefs: StylePreferences) => {
        writeJSON(STORAGE_KEYS.preferences, prefs);
        saveProfile({
            style_preferences: prefs.styles,
            occasions: prefs.occasions,
            budget_range: prefs.budget,
        });
        setCurrentStep('loading');
        loadProducts(gender);
    };

    const skipPreferences = () => {
        writeJSON(STORAGE_KEYS.preferences, { styles: [], occasions: [], budget: { min: 0, max: 0 } });
        setCurrentStep('loading');
        loadProducts(gender);
    };

    return (
        <div className="h-screen flex flex-col bg-gray-50">
            {/* Color Analysis Modal */}
            <ColorAnalysisModal
                isOpen={currentStep === 'color-analysis'}
                onClose={() => navigate('/')}
                onComplete={handleColorAnalysisComplete}
            />

            {/* Size Modal */}
            <UserSizeModal
                isOpen={currentStep === 'sizes'}
                onClose={() => setCurrentStep('preferences')}
                onSubmit={handleSizesSubmit}
                gender={gender || undefined}
                physique={bodyType || undefined}
            />

            {/* Style Preferences Modal */}
            <StylePreferencesModal
                isOpen={currentStep === 'preferences'}
                onClose={skipPreferences}
                onSubmit={handlePreferencesSubmit}
            />

            {/* Loading Screen */}
            {(isLoading || currentStep === 'loading') && (
                <LoadingScreen
                    message="Finding Perfect Matches..."
                    submessage="Searching Amazon, Flipkart and Myntra for you"
                />
            )}

            {/* Error State */}
            {error && !isLoading && (
                <div className="flex-1 flex flex-col items-center justify-center p-4" role="alert">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                        <AlertCircle className="text-red-600" size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        Oops! Something went wrong
                    </h2>
                    <p className="text-gray-600 mb-6 text-center max-w-md">
                        {error}
                    </p>
                    <button
                        onClick={() => loadProducts(gender)}
                        className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            )}

            {/* Swipe Interface */}
            {currentStep === 'swipe' && products.length > 0 && !isLoading && !error && (
                <SwipeInterface
                    products={products}
                    userId={userId}
                    onComplete={() => navigate('/home')}
                    onExit={() => navigate('/')}
                    showButtons={false}  // Gesture-only mode
                />
            )}

            {/* No Products State */}
            {currentStep === 'swipe' && products.length === 0 && !isLoading && !error && (
                <div className="flex-1 flex flex-col items-center justify-center p-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <AlertCircle className="text-gray-600" size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        No New Products Right Now
                    </h2>
                    <p className="text-gray-600 mb-6 text-center max-w-md">
                        You've seen everything we found for now, or the stores didn't respond. Try again, or browse your personalized feed.
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={() => loadProducts(gender)}
                            className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors"
                        >
                            Retry
                        </button>
                        <button
                            onClick={() => navigate('/home')}
                            className="px-6 py-3 border-2 border-purple-600 text-purple-600 rounded-lg font-semibold hover:bg-purple-50 transition-colors"
                        >
                            Go to My Feed
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SwipePage;
