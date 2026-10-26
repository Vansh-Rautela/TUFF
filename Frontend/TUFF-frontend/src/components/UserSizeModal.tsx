import React, { useState } from 'react';
import { X, ShoppingBag, User, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import type { ClothingSizes } from '@/types/fashion';

interface UserSizeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (sizes: ClothingSizes) => void;
    gender?: string;
    physique?: string;
}

const genders = ['Male', 'Female', 'Unisex'];
const physiques = ['Slim', 'Athletic', 'Average', 'Curvy', 'Plus Size'];
const topSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];
const bottomSizes = ['26', '28', '30', '32', '34', '36', '38', '40', '42'];
const shoeSizes = ['6', '7', '8', '9', '10', '11', '12', '13'];
const dressSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

export const UserSizeModal: React.FC<UserSizeModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    gender: defaultGender,
    physique: defaultPhysique
}) => {
    const [sizes, setSizes] = useState<ClothingSizes>({
        gender: defaultGender || 'Male',
        physique: defaultPhysique || 'Average',
        tops: 'M',
        bottoms: '32',
        shoes: '9',
        dresses: 'M'
    });

    const handleSubmit = () => {
        // onClose means "skip"; the parent moves on after onSubmit.
        onSubmit(sizes);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                >
                    {/* Header */}
                    <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                                <ShoppingBag className="text-white" size={20} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white">Your Profile & Sizes</h2>
                                <p className="text-sm text-white/90">Help us find the perfect fit</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/20 rounded-full transition-colors"
                        >
                            <X size={24} className="text-white" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-6">
                        {/* Gender Selection */}
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <User size={20} className="text-purple-600" />
                                <label className="block text-sm font-semibold text-gray-700">
                                    Gender
                                </label>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                {genders.map((g) => (
                                    <button
                                        key={g}
                                        onClick={() => setSizes({ ...sizes, gender: g })}
                                        className={`py-4 px-4 rounded-xl font-semibold transition-all ${sizes.gender === g
                                                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg scale-105'
                                                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                            }`}
                                    >
                                        {g}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Physique/Body Type Selection */}
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <Activity size={20} className="text-purple-600" />
                                <label className="block text-sm font-semibold text-gray-700">
                                    Body Type / Physique
                                </label>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                {physiques.map((p) => (
                                    <button
                                        key={p}
                                        onClick={() => setSizes({ ...sizes, physique: p })}
                                        className={`py-3 px-4 rounded-xl font-semibold transition-all text-sm ${sizes.physique === p
                                                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg scale-105'
                                                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                            }`}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="border-t pt-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Clothing Sizes</h3>

                            {/* Tops Size */}
                            <div className="mb-6">
                                <label className="block text-sm font-semibold text-gray-700 mb-3">
                                    Tops / Shirts Size
                                </label>
                                <div className="grid grid-cols-4 gap-2">
                                    {topSizes.map((size) => (
                                        <button
                                            key={size}
                                            onClick={() => setSizes({ ...sizes, tops: size })}
                                            className={`py-3 px-4 rounded-lg font-semibold transition-all ${sizes.tops === size
                                                    ? 'bg-purple-600 text-white shadow-lg scale-105'
                                                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                                }`}
                                        >
                                            {size}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Bottoms Size */}
                            <div className="mb-6">
                                <label className="block text-sm font-semibold text-gray-700 mb-3">
                                    Bottoms / Pants Size (Waist)
                                </label>
                                <div className="grid grid-cols-5 gap-2">
                                    {bottomSizes.map((size) => (
                                        <button
                                            key={size}
                                            onClick={() => setSizes({ ...sizes, bottoms: size })}
                                            className={`py-3 px-4 rounded-lg font-semibold transition-all ${sizes.bottoms === size
                                                    ? 'bg-purple-600 text-white shadow-lg scale-105'
                                                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                                }`}
                                        >
                                            {size}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Dresses (for female users) */}
                            {sizes.gender === 'Female' && (
                                <div className="mb-6">
                                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                                        Dress Size
                                    </label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {dressSizes.map((size) => (
                                            <button
                                                key={size}
                                                onClick={() => setSizes({ ...sizes, dresses: size })}
                                                className={`py-3 px-4 rounded-lg font-semibold transition-all ${sizes.dresses === size
                                                        ? 'bg-purple-600 text-white shadow-lg scale-105'
                                                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                                    }`}
                                            >
                                                {size}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Shoe Size */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-3">
                                    Shoe Size (US)
                                </label>
                                <div className="grid grid-cols-4 gap-2">
                                    {shoeSizes.map((size) => (
                                        <button
                                            key={size}
                                            onClick={() => setSizes({ ...sizes, shoes: size })}
                                            className={`py-3 px-4 rounded-lg font-semibold transition-all ${sizes.shoes === size
                                                    ? 'bg-purple-600 text-white shadow-lg scale-105'
                                                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                                }`}
                                        >
                                            {size}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
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
                            className="flex-1 py-3 px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg"
                        >
                            Save Profile
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default UserSizeModal;
