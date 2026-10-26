import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Heart, Loader2, Trash2 } from 'lucide-react';
import ProductImage from '../components/ProductImage';
import { api, errorMessage, swipeToProduct } from '@/lib/api';
import { getUserId } from '@/lib/session';
import type { Product } from '@/types/fashion';

/** Products the user liked while swiping, newest first, with remove. */
export const SavedPage: React.FC = () => {
    const navigate = useNavigate();
    const [userId] = useState(() => getUserId());
    const [items, setItems] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(Boolean(userId));
    const [error, setError] = useState<string | null>(null);
    const [removing, setRemoving] = useState<string | null>(null);

    useEffect(() => {
        if (!userId) return;
        let cancelled = false;
        api.likedProducts(userId)
            .then((data) => {
                if (!cancelled) setItems(data.liked_products.map(swipeToProduct).reverse());
            })
            .catch((err) => {
                if (!cancelled) setError(errorMessage(err, 'Could not load your saved items.'));
            })
            .finally(() => {
                if (!cancelled) setIsLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [userId]);

    const handleRemove = async (product: Product) => {
        if (!userId) return;
        setRemoving(product.link);
        try {
            await api.removeLiked(userId, product.link);
            setItems((prev) => prev.filter((p) => p.link !== product.link));
        } catch (err) {
            setError(errorMessage(err, 'Could not remove that item.'));
        } finally {
            setRemoving(null);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
            <header className="bg-white shadow-md sticky top-0 z-40">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-gray-700 hover:text-purple-700"
                    >
                        <ArrowLeft size={20} />
                        <span className="hidden sm:inline">Back</span>
                    </button>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Heart className="text-pink-600" fill="currentColor" size={24} />
                        Saved Items
                    </h1>
                    <Link to="/home" className="text-sm font-semibold text-purple-700 hover:underline">
                        My Feed
                    </Link>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                {error && (
                    <p role="alert" className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                        {error}
                    </p>
                )}

                {isLoading ? (
                    <div className="flex justify-center py-20" aria-busy="true">
                        <Loader2 className="animate-spin text-purple-600" size={40} />
                    </div>
                ) : items.length === 0 ? (
                    <div className="text-center py-20">
                        <Heart className="mx-auto mb-4 text-gray-300" size={48} />
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Nothing saved yet</h2>
                        <p className="text-gray-600 mb-6">Swipe right on pieces you love and they'll show up here.</p>
                        <button
                            onClick={() => navigate('/swipe')}
                            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold"
                        >
                            Start Swiping
                        </button>
                    </div>
                ) : (
                    <>
                        <p className="text-gray-600 mb-6">{items.length} saved {items.length === 1 ? 'item' : 'items'}</p>
                        <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {items.map((product) => (
                                <li key={product.link} className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col">
                                    <a
                                        href={product.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block group focus:outline-none focus-visible:ring-4 focus-visible:ring-purple-400"
                                    >
                                        <div className="aspect-square overflow-hidden bg-gray-100">
                                            <ProductImage
                                                src={product.thumbnail}
                                                alt={product.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                        </div>
                                        <div className="p-4 pb-2">
                                            {product.brand && (
                                                <p className="text-xs text-purple-500 uppercase font-semibold tracking-wider">{product.brand}</p>
                                            )}
                                            <h2 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-purple-600">
                                                {product.title}
                                            </h2>
                                            {product.price && <p className="text-lg font-bold text-purple-600 mt-1">{product.price}</p>}
                                        </div>
                                    </a>
                                    <div className="mt-auto flex gap-2 p-4 pt-2">
                                        <a
                                            href={product.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex-1 inline-flex items-center justify-center gap-1 py-2 rounded-lg bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700"
                                        >
                                            Shop <ExternalLink size={14} aria-hidden="true" />
                                        </a>
                                        <button
                                            onClick={() => handleRemove(product)}
                                            disabled={removing === product.link}
                                            aria-label={`Remove ${product.title} from saved items`}
                                            className="p-2 rounded-lg border-2 border-gray-200 text-gray-600 hover:border-red-400 hover:text-red-600 disabled:opacity-50"
                                        >
                                            {removing === product.link ? <Loader2 className="animate-spin" size={18} /> : <Trash2 size={18} />}
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </>
                )}
            </main>
        </div>
    );
};

export default SavedPage;
