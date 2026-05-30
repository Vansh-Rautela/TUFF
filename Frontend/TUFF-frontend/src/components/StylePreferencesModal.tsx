import React, { useState } from 'react';
import { X, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface StylePreferencesModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (preferences: {
        styles: string[];
        occasions: string[];
        budget: { min: number; max: number };
    }) => void;
}

const styleOptions = [
    { value: 'casual', label: 'Casual', emoji: '👕' },
    { value: 'formal', label: 'Formal', emoji: '🤵' },
    { value: 'business', label: 'Business', emoji: '💼' },
    { value: 'streetwear', label: 'Streetwear', emoji: '🧢' },
    { value: 'athletic', label: 'Athletic', emoji: '⚽' },
    { value: 'bohemian', label: 'Bohemian', emoji: '🌸' },
    { value: 'minimalist', label: 'Minimalist', emoji: '⚪' },
    { value: 'vintage', label: 'Vintage', emoji: '🕰️' },
    { value: 'trendy', label: 'Trendy', emoji: '✨' },
    { value: 'elegant', label: 'Elegant', emoji: '💎' },
];

const occasionOptions = [
    { value: 'everyday', label: 'Everyday', emoji: '☀️' },
    { value: 'work', label: 'Work/Office', emoji: '💻' },
    { value: 'party', label: 'Party', emoji: '🎉' },
    { value: 'date', label: 'Date Night', emoji: '💕' },
    { value: 'gym', label: 'Gym/Sports', emoji: '🏋️' },
    { value: 'formal_event', label: 'Formal Events', emoji: '🎩' },
    { value: 'vacation', label: 'Vacation', emoji: '🏖️' },
    { value: 'outdoor', label: 'Outdoor', emoji: '🏔️' },
];

const budgetRanges = [
    { label: 'Budget Friendly', min: 0, max: 2000, emoji: '💵' },
    { label: 'Mid Range', min: 2000, max: 5000, emoji: '💰' },
    { label: 'Premium', min: 5000, max: 15000, emoji: '💎' },
    { label: 'Luxury', min: 15000, max: 100000, emoji: '👑' },
];

export const StylePreferencesModal: React.FC<StylePreferencesModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
}) => {
    const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
    const [selectedOccasions, setSelectedOccasions] = useState<string[]>([]);
    const [budgetRange, setBudgetRange] = useState({ min: 0, max: 5000 });

    const toggleStyle = (style: string) => {
        setSelectedStyles(prev =>
            prev.includes(style)
                ? prev.filter(s => s !== style)
                : [...prev, style]
        );
    };

    const toggleOccasion = (occasion: string) => {
        setSelectedOccasions(prev =>
            prev.includes(occasion)
                ? prev.filter(o => o !== occasion)
                : [...prev, occasion]
        );
    };

    const handleSubmit = () => {
        onSubmit({
            styles: selectedStyles,
            occasions: selectedOccasions,
            budget: budgetRange,
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
                >
                    {/* Header */}
                    <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                <Sparkles className="text-purple-600" size={20} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">Style Preferences</h2>
                                <p className="text-sm text-gray-600">Tell us about your fashion taste</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-8">
                        {/* Style Preferences */}
                        <div>
                            <div className="mb-4">
                                <h3 className="text-lg font-bold text-gray-900 mb-1">
                                    Your Style
                                </h3>
                                <p className="text-sm text-gray-600">
                                    Select all styles you like (choose at least 2)
                                </p>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {styleOptions.map((style) => (
                                    <button
                                        key={style.value}
                                        onClick={() => toggleStyle(style.value)}
                                        className={`p-4 rounded-xl border-2 transition-all ${selectedStyles.includes(style.value)
                                                ? 'border-purple-600 bg-purple-50 shadow-lg scale-105'
                                                : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                                            }`}
                                    >
                                        <div className="text-3xl mb-2">{style.emoji}</div>
                                        <div className="font-semibold text-gray-900">{style.label}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Occasion Preferences */}
                        <div>
                            <div className="mb-4">
                                <h3 className="text-lg font-bold text-gray-900 mb-1">
                                    Shopping For
                                </h3>
                                <p className="text-sm text-gray-600">
                                    What occasions do you need clothes for?
                                </p>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {occasionOptions.map((occasion) => (
                                    <button
                                        key={occasion.value}
                                        onClick={() => toggleOccasion(occasion.value)}
                                        className={`p-3 rounded-xl border-2 transition-all ${selectedOccasions.includes(occasion.value)
                                                ? 'border-purple-600 bg-purple-50 shadow-lg scale-105'
                                                : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                                            }`}
                                    >
                                        <div className="text-2xl mb-1">{occasion.emoji}</div>
                                        <div className="text-xs font-semibold text-gray-900">
                                            {occasion.label}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Budget Range */}
                        <div>
                            <div className="mb-4">
                                <h3 className="text-lg font-bold text-gray-900 mb-1">
                                    Budget Range
                                </h3>
                                <p className="text-sm text-gray-600">
                                    What's your typical spending range?
                                </p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {budgetRanges.map((range) => (
                                    <button
                                        key={range.label}
                                        onClick={() => setBudgetRange({ min: range.min, max: range.max })}
                                        className={`p-4 rounded-xl border-2 transition-all ${budgetRange.min === range.min && budgetRange.max === range.max
                                                ? 'border-purple-600 bg-purple-50 shadow-lg'
                                                : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="text-3xl">{range.emoji}</div>
                                            <div className="text-left">
                                                <div className="font-semibold text-gray-900">{range.label}</div>
                                                <div className="text-sm text-gray-600">
                                                    ₹{range.min.toLocaleString()} - ₹{range.max.toLocaleString()}
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Selection Summary */}
                        {(selectedStyles.length > 0 || selectedOccasions.length > 0) && (
                            <div className="p-4 bg-purple-50 rounded-xl">
                                <h4 className="font-semibold text-purple-900 mb-2">Your Selections</h4>
                                <div className="text-sm text-purple-700 space-y-1">
                                    {selectedStyles.length > 0 && (
                                        <p>✓ {selectedStyles.length} style{selectedStyles.length > 1 ? 's' : ''} selected</p>
                                    )}
                                    {selectedOccasions.length > 0 && (
                                        <p>✓ {selectedOccasions.length} occasion{selectedOccasions.length > 1 ? 's' : ''} selected</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 px-6 border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            Skip for Now
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={selectedStyles.length < 2}
                            className="flex-1 py-3 px-6 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Save Preferences
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default StylePreferencesModal;
