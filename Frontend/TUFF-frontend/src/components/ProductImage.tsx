import React, { useState } from 'react';

const FALLBACK_SRC = '/placeholder.svg';

interface ProductImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src' | 'onError'> {
    src?: string | null;
    alt: string;
}

/**
 * Product photo with a local fallback for missing or broken retailer images.
 * Falls back once, so a failing placeholder can't cause an error loop.
 */
export const ProductImage: React.FC<ProductImageProps> = ({ src, alt, loading = 'lazy', ...rest }) => {
    const [failed, setFailed] = useState(false);
    const usable = src && !failed ? src : FALLBACK_SRC;

    return (
        <img
            {...rest}
            src={usable}
            alt={alt}
            loading={loading}
            decoding="async"
            referrerPolicy="no-referrer"
            onError={() => setFailed(true)}
        />
    );
};

export default ProductImage;
