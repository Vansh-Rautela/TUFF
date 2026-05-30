import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check } from 'lucide-react';

interface BrandFilterModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApply: (selectedBrands: string[]) => void;
    currentBrands?: string[];
}

// Available Indian fashion brands
const AVAILABLE_BRANDS = [
    { name: 'Myntra', logo: '👗', description: 'Ethnic & Western Wear' },
    { name: 'Flipkart', logo: '🛍️', description: 'Budget Fashion' },
    { name: 'Amazon', logo: '📦', description: 'Wide Selection' },
    { name: 'Ajio', logo: '✨', description: 'Trendy Styles' },
    { name: 'Nykaa', logo: '💄', description: 'Beauty & Fashion' },
    { name: 'Zara', logo: '👔', description: 'Premium Fashion' },
    { name: 'H&M', logo: '👚', description: 'Fast Fashion' },
    { name: 'Levis', logo: '👖', description: 'Denim & Casual' },
    { name: 'Lifestyle', logo: '🏪', description: 'Multi-Brand' },
    { name: 'Bewakoof', logo: '😎', description: 'Quirky & Casual' },
    { name: 'Westside', logo: '🏬', description: 'Classic Styles' },
    { name: 'Urbanic', logo: '🌆', description: 'Urban Fashion' },
    { name: 'Libas', logo: '🕌', description: 'Ethnic Collection' },
    { name: 'Monte Carlo', logo: '🧥', description: 'Winter Wear' },
    { name: 'Souled Store', logo: '🎨', description: 'Pop Culture' },
];

export const BrandFilterModal: React.FC<BrandFilterModalProps> = ({
    isOpen,
    onClose,
    onApply,
    currentBrands = []
}) => {
    const [selectedBrands, setSelectedBrands] = useState<string[]>(currentBrands);

    const toggleBrand = (brandName: string) => {
        setSelectedBrands(prev =>
            prev.includes(brandName)
                ? prev.filter(b => b !== brandName)
                : [...prev, brandName]
        );
    };

    const handleSelectAll = () => {
        if (selectedBrands.length === AVAILABLE_BRANDS.length) {
            setSelectedBrands([]);
        } else {
            setSelectedBrands(AVAILABLE_BRANDS.map(b => b.name));
        }
    };

    const handleApply = () => {
        onApply(selectedBrands);
        onClose();
    };

    const handleClear = () => {
        setSelectedBrands([]);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* Background overlay */}
                <motion.div
                    className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                />

                {/* Modal content */}
                <motion.div
                    className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    transition={{ type: "spring", duration: 0.5 }}
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white">
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-2xl font-bold">Select Brands</h2>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>
                        <p className="text-white/90 text-sm">
                            Choose brands to search from • {selectedBrands.length} selected
                        </p>
                    </div>

                    {/* Quick actions */}
                    <div className="px-6 py-4 border-b bg-gray-50 flex gap-3">
                        <button
                            onClick={handleSelectAll}
                            className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm font-semibold"
                        >
                            {selectedBrands.length === AVAILABLE_BRANDS.length ? 'Deselect All' : 'Select All'}
                        </button>
                        <button
                            onClick={handleClear}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-semibold"
                        >
                            Clear
                        </button>
                    </div>

                    {/* Brand grid */}
                    <div className="p-6 overflow-y-auto max-h-96">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {AVAILABLE_BRANDS.map((brand) => {
                                const isSelected = selectedBrands.includes(brand.name);

                                return (
                                    <motion.button
                                        key={brand.name}
                                        onClick={() => toggleBrand(brand.name)}
                                        className={`
                                            relative p-4 rounded-xl border-2 transition-all text-left
                                            ${isSelected
                                                ? 'border-purple-500 bg-purple-50'
                                                : 'border-gray-200 bg-white hover:border-purple-300 hover:shadow-md'
                                            }
                                        `}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="text-3xl">{brand.logo}</div>
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-gray-900 mb-1">
                                                    {brand.name}
                                                </h3>
                                                <p className="text-sm text-gray-600">
                                                    {brand.description}
                                                </p>
                                            </div>
                                            <div className={`
                                                w-6 h-6 rounded-full border-2 flex items-center justify-center
                                                ${isSelected
                                                    ? 'bg-purple-500 border-purple-500'
                                                    : 'border-gray-300'
                                                }
                                            `}>
                                                {isSelected && <Check size={16} className="text-white" />}
                                            </div>
                                        </div>
                                    </motion.button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t bg-gray-50 flex justify-between items-center">
                        <p className="text-sm text-gray-600">
                            {selectedBrands.length === 0
                                ? 'Select at least one brand'
                                : `${selectedBrands.length} brand${selectedBrands.length > 1 ? 's' : ''} selected`
                            }
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-semibold"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleApply}
                                disabled={selectedBrands.length === 0}
                                className={`
                                    px-6 py-2 rounded-lg font-semibold transition-colors
                                    ${selectedBrands.length > 0
                                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700'
                                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    }
                                `}
                            >
                                Apply Filters
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default BrandFilterModal;
