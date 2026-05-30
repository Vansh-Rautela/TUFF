import { useState, useEffect } from 'react';

interface Product {
    product_title: string;
    product_brand: string;
    product_price: string;
    product_image: string;
    product_link: string;
}

export const useTuffyCart = () => {
    const [cart, setCart] = useState<Product[]>([]);
    const [wishlist, setWishlist] = useState<Product[]>([]);

    // Load from localStorage on mount
    useEffect(() => {
        const savedCart = localStorage.getItem('tuffyCart');
        const savedWishlist = localStorage.getItem('tuffyWishlist');

        if (savedCart) {
            try {
                setCart(JSON.parse(savedCart));
            } catch (e) {
                console.error('Error loading cart:', e);
            }
        }

        if (savedWishlist) {
            try {
                setWishlist(JSON.parse(savedWishlist));
            } catch (e) {
                console.error('Error loading wishlist:', e);
            }
        }
    }, []);

    // Save to localStorage whenever cart changes
    useEffect(() => {
        localStorage.setItem('tuffyCart', JSON.stringify(cart));
    }, [cart]);

    // Save to localStorage whenever wishlist changes
    useEffect(() => {
        localStorage.setItem('tuffyWishlist', JSON.stringify(wishlist));
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
