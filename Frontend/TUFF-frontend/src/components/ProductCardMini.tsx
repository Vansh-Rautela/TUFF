import React from 'react';
import { motion } from 'framer-motion';
import { Heart, ShoppingCart, ExternalLink } from 'lucide-react';

interface ProductMiniProps {
    product: {
        product_title: string;
        product_brand: string;
        product_price: string;
        product_image: string;
        product_link: string;
    };
    onAddToCart: (product: any) => void;
    onAddToWishlist: (product: any) => void;
}

export const ProductCardMini: React.FC<ProductMiniProps> = ({
    product,
    onAddToCart,
    onAddToWishlist
}) => {
    const [isLiked, setIsLiked] = React.useState(false);
    const [isAdded, setIsAdded] = React.useState(false);

    const handleLike = () => {
        setIsLiked(!isLiked);
        onAddToWishlist(product);
    };

    const handleAddToCart = () => {
        setIsAdded(true);
        onAddToCart(product);
        setTimeout(() => setIsAdded(false), 2000);
    };

    return (
        <motion.div
            className="min-w-[200px] max-w-[200px] bg-white/10 backdrop-blur-md rounded-xl overflow-hidden border border-yellow-400/30 hover:border-yellow-400/60 transition-all"
            whileHover={{ scale: 1.02, y: -4 }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
        >
            {/* Image */}
            <div className="relative h-32 bg-white/5 overflow-hidden">
                <img
                    src={product.product_image}
                    alt={product.product_title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                        e.currentTarget.src = 'https://via.placeholder.com/200x200?text=No+Image';
                    }}
                />

                {/* Wishlist heart Overlay */}
                <button
                    onClick={handleLike}
                    className="absolute top-2 right-2 p-1.5 bg-black/40 backdrop-blur-sm rounded-full hover:bg-black/60 transition-all"
                >
                    <Heart
                        size={14}
                        className={`${isLiked ? 'fill-red-500 text-red-500' : 'text-white'}`}
                    />
                </button>
            </div>

            {/* Content */}
            <div className="p-3">
                <p className="text-xs text-yellow-300 font-semibold mb-1">
                    {product.product_brand}
                </p>
                <h4 className="text-white text-sm font-medium line-clamp-2 mb-2 h-10">
                    {product.product_title}
                </h4>
                <p className="text-yellow-400 font-bold text-sm mb-3">
                    {product.product_price}
                </p>

                {/* Actions */}
                <div className="flex gap-2">
                    <button
                        onClick={handleAddToCart}
                        className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${isAdded
                                ? 'bg-green-500 text-white'
                                : 'bg-gradient-to-r from-yellow-400 to-orange-400 text-white hover:from-yellow-500 hover:to-orange-500'
                            }`}
                        disabled={isAdded}
                    >
                        {isAdded ? '✓ Added!' : (
                            <>
                                <ShoppingCart size={12} className="inline mr-1" />
                                Cart
                            </>
                        )}
                    </button>
                    <a
                        href={product.product_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-all"
                    >
                        <ExternalLink size={14} className="text-white" />
                    </a>
                </div>
            </div>
        </motion.div>
    );
};

export default ProductCardMini;
