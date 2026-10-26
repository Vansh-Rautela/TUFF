import { useState, useEffect } from 'react';
import { readJSON, writeJSON } from '@/lib/session';
import type { MiniProduct } from '@/types/fashion';

type Product = MiniProduct;

export const useTuffyCart = () => {
    // Read saved lists synchronously so the save effects below never
    // overwrite them with an empty list on first render.
    const [cart, setCart] = useState<Product[]>(() => readJSON<Product[]>('tuffyCart') || []);
    const [wishlist, setWishlist] = useState<Product[]>(() => readJSON<Product[]>('tuffyWishlist') || []);

    // Save to localStorage whenever cart changes
    useEffect(() => {
        writeJSON('tuffyCart', cart);
    }, [cart]);

    // Save to localStorage whenever wishlist changes
    useEffect(() => {
        writeJSON('tuffyWishlist', wishlist);
    }, [wishlist]);

    const addToCart = (product: Product) => {
        // Check if already in cart
        const exists = cart.some(
            (item) => item.product_title === product.product_title && item.product_brand === product.product_brand
        );

        if (!exists) {
            setCart([...cart, product]);
            return true;
        }
        return false;
    };

    const removeFromCart = (product: Product) => {
        setCart(cart.filter(
            (item) => !(item.product_title === product.product_title && item.product_brand === product.product_brand)
        ));
    };

    const addToWishlist = (product: Product) => {
        // Check if already in wishlist
        const exists = wishlist.some(
            (item) => item.product_title === product.product_title && item.product_brand === product.product_brand
        );

        if (!exists) {
            setWishlist([...wishlist, product]);
            return true;
        } else {
            // Remove from wishlist (toggle)
            setWishlist(wishlist.filter(
                (item) => !(item.product_title === product.product_title && item.product_brand === product.product_brand)
            ));
            return false;
        }
    };

    const removeFromWishlist = (product: Product) => {
        setWishlist(wishlist.filter(
            (item) => !(item.product_title === product.product_title && item.product_brand === product.product_brand)
        ));
    };

    const clearCart = () => {
        setCart([]);
    };

    const clearWishlist = () => {
        setWishlist([]);
    };

    return {
        cart,
        wishlist,
        addToCart,
        removeFromCart,
        addToWishlist,
        removeFromWishlist,
        clearCart,
        clearWishlist,
        cartCount: cart.length,
        wishlistCount: wishlist.length
    };
};
