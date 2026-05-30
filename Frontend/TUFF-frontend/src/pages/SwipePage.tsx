import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SwipeInterface from '../components/SwipeInterface';
import UserSizeModal from '../components/UserSizeModal';
import StylePreferencesModal from '../components/StylePreferencesModal';
import ColorAnalysisModal from '../components/ColorAnalysisModal';
import LoadingScreen from '../components/LoadingScreen';
import { Loader2, AlertCircle } from 'lucide-react';

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

type FlowStep = 'color-analysis' | 'sizes' | 'preferences' | 'loading' | 'swipe';

export const SwipePage: React.FC = () => {
    const navigate = useNavigate();
    const [userId] = useState(() => localStorage.getItem('userId') || `user_${Date.now()}`);
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentStep, setCurrentStep] = useState<FlowStep>('color-analysis');
    const [colorAnalysis, setColorAnalysis] = useState<any>(null);
    const [userInfo] = useState<any>(() => {
        // Get gender from localStorage or default
        const savedGender = localStorage.getItem('userGender');
        const savedBodyType = localStorage.getItem('userBodyType');
        return {
            gender: savedGender || 'Male',
            bodyType: savedBodyType || 'Average',
        };
    });

    // Save userId to localStorage
    useEffect(() => {
        localStorage.setItem('userId', userId);
    }, [userId]);

    // Check if user has completed previous steps
    useEffect(() => {
        const savedColorAnalysis = localStorage.getItem('colorAnalysis');
        const savedSizes = localStorage.getItem('userSizes');
        const savedPreferences = localStorage.getItem('userPreferences');

        if (savedColorAnalysis) {
            setColorAnalysis(JSON.parse(savedColorAnalysis));
            if (savedSizes && savedPreferences) {
                // Skip to swipe if everything is done
                loadProducts();
                setCurrentStep('swipe');
            } else if (savedSizes) {
                setCurrentStep('preferences');
            } else {
                setCurrentStep('sizes');
            }
        }
    }, []);

    const handleColorAnalysisComplete = async (analysis: any) => {
        if (analysis) {
            setColorAnalysis(analysis);
            localStorage.setItem('colorAnalysis', JSON.stringify(analysis));
            
            // Ensure gender is stored in localStorage
            if (userInfo.gender) {
                localStorage.setItem('userGender', userInfo.gender);
            }

            // Save color analysis to backend
            try {
                await fetch('http://localhost:5000/update_user_info', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: userId,
                        updates: {
                            color_analysis: analysis,
                            gender: userInfo.gender,
                            body_type: userInfo.bodyType,
                        }
                    })
                });
            } catch (err) {
                console.error('Failed to save color analysis:', err);
            }
        }

        setCurrentStep('sizes');
    };

    const handleSizesSubmit = async (sizes: any) => {
        localStorage.setItem('userSizes', JSON.stringify(sizes));

        // Save sizes to backend
        try {
            await fetch('http://localhost:5000/update_user_info', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: userId,
                    updates: {
                        clothing_sizes: sizes,
                    }
                })
            });
        } catch (err) {
            console.error('Failed to save sizes:', err);
        }

        setCurrentStep('preferences');
    };

    const handlePreferencesSubmit = async (prefs: any) => {
        localStorage.setItem('userPreferences', JSON.stringify(prefs));

        // Save preferences to backend
        try {
            await fetch('http://localhost:5000/update_user_info', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: userId,
                    updates: {
                        style_preferences: prefs.styles,
                        budget_range: prefs.budget,
                    }
                })
            });
        } catch (err) {
            console.error('Failed to save preferences:', err);
        }

        // Load products for swiping
        setCurrentStep('loading');
        await loadProducts();
        setCurrentStep('swipe');
    };

    const loadProducts = async () => {
        setIsLoading(true);
        setError(null);

        try {
            // Get gender from localStorage (ensure it's saved)
            const savedGender = localStorage.getItem('userGender') || userInfo.gender;
            if (savedGender) {
                localStorage.setItem('userGender', savedGender);
            }

            // Scrape products based on user preferences (gender is always included)
            const response = await fetch('http://localhost:5000/scrape_products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userData: {
                        userId: userId,
                        gender: savedGender,
                        bodyType: userInfo.bodyType,
                        colorAnalysisResult: colorAnalysis,
                        brands: ['Amazon', 'Flipkart', 'Myntra']
                    },
                    filters: {},
                    prompt: 'fashion clothing' // Gender and cloth type will be added automatically
                })
            });

            if (!response.ok) {
                throw new Error('Failed to load products');
            }

            const data = await response.json();

            // Get personalized recommendations (already filtered by gender in backend)
            const recsResponse = await fetch('http://localhost:5000/personalized_recommendations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: userId,
                    products: data.products
                })
            });

            if (recsResponse.ok) {
                const recsData = await recsResponse.json();
                setProducts(recsData.recommendations || data.products);
            } else {
                setProducts(data.products);
            }

        } catch (err) {
            setError('Failed to load products. Please try again.');
            console.error('Error loading products:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSwipeComplete = () => {
        // Navigate to personalized homepage
        navigate('/home');
    };

    const handleExit = () => {
        // Go back to main homepage
        navigate('/');
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
                gender={userInfo.gender}
            />

            {/* Style Preferences Modal */}
            <StylePreferencesModal
                isOpen={currentStep === 'preferences'}
                onClose={() => {
                    setCurrentStep('loading');
                    loadProducts().then(() => setCurrentStep('swipe'));
                }}
                onSubmit={handlePreferencesSubmit}
            />

            {/* Loading Screen */}
            {(isLoading || currentStep === 'loading') && (
                <LoadingScreen
                    message="Finding Perfect Matches..."
                    submessage="Analyzing thousands of products just for you"
                />
            )}

            {/* Error State */}
            {error && !isLoading && (
                <div className="flex-1 flex flex-col items-center justify-center p-4">
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
                        onClick={loadProducts}
                        className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            )}

            {/* Swipe Interface */}
            {currentStep === 'swipe' && products.length > 0 && !isLoading && (
                <SwipeInterface
                    products={products}
                    userId={userId}
                    onComplete={handleSwipeComplete}
                    onExit={handleExit}
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
                        No Products Found
                    </h2>
                    <p className="text-gray-600 mb-6 text-center max-w-md">
                        We couldn't find any products at the moment. Please try again later.
                    </p>
                    <button
                        onClick={loadProducts}
                        className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors"
                    >
                        Retry
                    </button>
                </div>
            )}
        </div>
    );
};

export default SwipePage;
