import React, { useState, useRef, useEffect } from 'react';
import { Heart, X, Info, ExternalLink } from 'lucide-react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';

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

interface SwipeCardProps {
  product: Product;
  onSwipe: (direction: 'like' | 'dislike') => void;
  style?: React.CSSProperties;
  isTop?: boolean;
}

export const SwipeCard: React.FC<SwipeCardProps> = ({ 
  product, 
  onSwipe, 
  style, 
  isTop = false 
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Motion values for drag
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  // Transform for rotation based on drag
  const rotate = useTransform(x, [-200, 0, 200], [-25, 0, 25]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);
  
  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 100;
    
    if (Math.abs(info.offset.x) > threshold) {
      const direction = info.offset.x > 0 ? 'like' : 'dislike';
      onSwipe(direction);
    }
  };

  return (
    <motion.div
      ref={cardRef}
      className="absolute w-full h-full"
      style={{
        ...style,
        x,
        y,
        rotate,
        opacity,
        cursor: isTop ? 'grab' : 'default',
      }}
      drag={isTop}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={1}
      onDragEnd={handleDragEnd}
      whileDrag={{ cursor: 'grabbing' }}
    >
      <div className="relative w-full h-full bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Product Image */}
        <div className="relative h-[70%] overflow-hidden">
          <img 
            src={product.thumbnail || '/placeholder-product.jpg'} 
            alt={product.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = '/placeholder-product.jpg';
            }}
          />
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          
          {/* Info button */}
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-lg hover:bg-white transition-colors"
          >
            <Info size={20} className="text-gray-800" />
          </button>

          {/* Recommendation score badge */}
          {product.recommendation_score !== undefined && product.recommendation_score > 0 && (
            <div className="absolute top-4 left-4 bg-purple-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
              {product.recommendation_score}% Match
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="p-6 h-[30%] flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900 line-clamp-2 mb-1">
              {product.title}
            </h3>
            {product.brand && (
              <p className="text-sm text-gray-600 mb-2">{product.brand}</p>
            )}
            {product.price && (
              <p className="text-2xl font-bold text-purple-600 mb-2">{product.price}</p>
            )}
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {product.category && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                {product.category}
              </span>
            )}
            {product.color && (
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                {product.color}
              </span>
            )}
            {product.style && (
              <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                {product.style}
              </span>
            )}
          </div>
        </div>

        {/* Details Panel (slides up) */}
        {showDetails && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            className="absolute inset-0 bg-white p-6 overflow-y-auto z-10"
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-2xl font-bold text-gray-900">{product.title}</h3>
              <button
                onClick={() => setShowDetails(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X size={24} />
              </button>
            </div>

            {product.brand && (
              <div className="mb-4">
                <p className="text-sm text-gray-500">Brand</p>
                <p className="text-lg font-semibold">{product.brand}</p>
              </div>
            )}

            {product.price && (
              <div className="mb-4">
                <p className="text-sm text-gray-500">Price</p>
                <p className="text-2xl font-bold text-purple-600">{product.price}</p>
              </div>
            )}

            {product.tags && product.tags.length > 0 && (
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-2">Tags</p>
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag, idx) => (
                    <span key={idx} className="px-3 py-1 bg-gray-100 rounded-full text-sm">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <a
              href={product.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              View Product <ExternalLink size={18} />
            </a>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default SwipeCard;
