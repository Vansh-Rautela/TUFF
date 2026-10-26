import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Sparkles, Stars, Zap, ShoppingBag } from 'lucide-react';
import ProductCardMini from './ProductCardMini';
import { useTuffyCart } from '../hooks/useTuffyCart';
import { ApiError, api } from '@/lib/api';
import { getOrCreateUserId } from '@/lib/session';
import type { MiniProduct, Product, TuffyUserData } from '@/types/fashion';

interface TuffyChatProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    userData: TuffyUserData;
}

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'tuffy';
    timestamp: Date;
    products?: MiniProduct[];
    showBrandSelector?: boolean;
}

const FALLBACK_REPLY = "✨ My divine powers are temporarily unavailable. Please try again in a moment!";

const toMiniProduct = (p: Product, brand: string): MiniProduct => ({
    product_title: p.title || 'Stylish Piece',
    product_brand: p.brand || brand,
    product_price: p.price || 'Check Price',
    product_image: p.thumbnail || '',
    product_link: p.link,
});

export const TuffyChat: React.FC<TuffyChatProps> = ({
    isOpen,
    onClose,
    userId,
    userData
}) => {
    const { addToCart, addToWishlist, cartCount } = useTuffyCart();
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            text: "✨ Greetings, mortal! I am TUFFY, the all-knowing Fashion God. I've gazed upon your color analysis and style preferences with my divine vision. How may I guide you on your journey to style enlightenment today?",
            sender: 'tuffy',
            timestamp: new Date()
        }
    ]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    // Chat works before onboarding too; fall back to this device's id.
    const [chatUserId] = useState(() => userId || getOrCreateUserId());

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const sendMessage = async (text: string = inputMessage, brandContext: string = '') => {
        if (!text.trim() && !brandContext) return;
        if (isLoading) return;

        // Add user message only if it's text input
        if (!brandContext) {
            const userMessage: Message = {
                id: Date.now().toString(),
                text: text,
                sender: 'user',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, userMessage]);
        }

        setInputMessage('');
        setIsLoading(true);

        try {
            if (brandContext) {
                // Show products for the user's last request from the chosen brand.
                const lastUserMsg = [...messages].reverse().find(m => m.sender === 'user')?.text || "outfit";
                const data = await api.tuffyProducts(lastUserMsg, brandContext, userData.gender, 5);
                const found = data.products.length > 0;
                setMessages((prev) => [...prev, {
                    id: (Date.now() + 1).toString(),
                    text: found
                        ? `✨ Divine choices from ${brandContext}! Here are some pieces I've selected for you:`
                        : `✨ ${brandContext} didn't return anything for that just now. Try another brand?`,
                    sender: 'tuffy',
                    timestamp: new Date(),
                    // The API returns `thumbnail`; the old code read `image`, so chat cards had no pictures.
                    products: data.products.map((p) => toMiniProduct(p, brandContext)),
                    showBrandSelector: !found,
                }]);
            } else {
                const data = await api.tuffyChat(chatUserId, text, userData);
                // Check if TUFFY is asking about brands to trigger selector
                const reply = data.tuffy_says;
                const showBrands = reply.toLowerCase().includes('brand') &&
                    (reply.includes('?') || reply.toLowerCase().includes('which'));

                setMessages(prev => [...prev, {
                    id: (Date.now() + 1).toString(),
                    text: reply,
                    sender: 'tuffy',
                    timestamp: new Date(),
                    showBrandSelector: showBrands
                }]);
            }
        } catch (error) {
            // A 503 carries a friendly "not configured" message from the server.
            const body = error instanceof ApiError ? (error.body as { tuffy_says?: string } | null) : null;
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                text: body?.tuffy_says || FALLBACK_REPLY,
                sender: 'tuffy',
                timestamp: new Date()
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const handleBrandSelect = (brand: string) => {
        const userMessage: Message = {
            id: Date.now().toString(),
            text: `Show me products from ${brand}`,
            sender: 'user',
            timestamp: new Date()
        };
        setMessages(prev => [...prev, userMessage]);
        sendMessage('', brand);
    };

    const quickQuestions = [
        "What colors suit me best?",
        "Outfit for an interview?",
        "Show me summer dresses",
        "What's trending right now?"
    ];

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-end justify-end p-4 sm:p-6 pointer-events-none">
                <motion.div
                    className="absolute inset-0 bg-black/20 backdrop-blur-sm pointer-events-auto"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                />

                <motion.div
                    className="relative w-full max-w-md bg-gradient-to-br from-purple-900 via-purple-800 to-pink-900 rounded-2xl shadow-2xl overflow-hidden pointer-events-auto flex flex-col"
                    style={{ height: 'min(600px, calc(100dvh - 2rem))' }}
                    initial={{ opacity: 0, scale: 0.9, y: 100 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 100 }}
                    transition={{ type: "spring", duration: 0.5 }}
                >
                    {/* Header */}
                    <div className="relative bg-gradient-to-r from-purple-600 to-pink-600 p-4 border-b border-white/20">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <motion.div
                                    className="relative w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full flex items-center justify-center"
                                    animate={{
                                        boxShadow: ['0 0 20px rgba(251, 191, 36, 0.5)', '0 0 40px rgba(251, 191, 36, 0.8)', '0 0 20px rgba(251, 191, 36, 0.5)'],
                                    }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                >
                                    <Sparkles className="text-white" size={24} />
                                    <motion.div
                                        className="absolute -top-1 -right-1"
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                    >
                                        <Stars className="text-yellow-300" size={16} />
                                    </motion.div>
                                </motion.div>

                                <div>
                                    <h3 className="font-bold text-white flex items-center gap-2">
                                        TUFFY <Zap className="text-yellow-300" size={14} />
                                    </h3>
                                    <p className="text-xs text-white/80">The Fashion God</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                {cartCount > 0 && (
                                    <div className="bg-white/20 px-2 py-1 rounded-full flex items-center gap-1">
                                        <ShoppingBag size={12} className="text-white" />
                                        <span className="text-xs text-white font-bold">{cartCount}</span>
                                    </div>
                                )}
                                <button onClick={onClose} aria-label="Close chat" className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                    <X size={20} className="text-white" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="relative flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/20">
                        {messages.map((message) => (
                            <motion.div
                                key={message.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`flex flex-col ${message.sender === 'user' ? 'items-end' : 'items-start'}`}
                            >
                                <div className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} w-full`}>
                                    <div
                                        className={`max-w-[85%] p-3 rounded-2xl ${message.sender === 'user'
                                                ? 'bg-white/10 text-white backdrop-blur-sm'
                                                : 'bg-gradient-to-r from-yellow-400/20 to-orange-400/20 text-white border border-yellow-400/30'
                                            }`}
                                    >
                                        {message.sender === 'tuffy' && (
                                            <div className="flex items-center gap-1 mb-1">
                                                <Sparkles size={12} className="text-yellow-300" />
                                                <span className="text-xs font-semibold text-yellow-300">TUFFY</span>
                                            </div>
                                        )}
                                        <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                                    </div>
                                </div>

                                {/* Products Carousel */}
                                {message.products && message.products.length > 0 && (
                                    <div className="w-full overflow-x-auto mt-2 pb-2 pl-1 flex gap-3">
                                        {message.products.map((product) => (
                                            <ProductCardMini
                                                key={product.product_link}
                                                product={product}
                                                onAddToCart={addToCart}
                                                onAddToWishlist={addToWishlist}
                                            />
                                        ))}
                                    </div>
                                )}

                                {/* Brand Selector */}
                                {message.showBrandSelector && (
                                    <div className="mt-2 flex flex-wrap gap-2 animate-pulse">
                                        {['Myntra', 'Flipkart', 'Amazon'].map((brand) => (
                                            <button
                                                key={brand}
                                                onClick={() => handleBrandSelect(brand)}
                                                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold rounded-full hover:from-purple-500 hover:to-pink-500 transition-all border border-white/20 shadow-lg transform hover:scale-105"
                                            >
                                                Shop {brand}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        ))}

                        {isLoading && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                                <div className="bg-gradient-to-r from-yellow-400/20 to-orange-400/20 text-white border border-yellow-400/30 p-3 rounded-2xl">
                                    <div className="flex items-center gap-2">
                                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                                            <Sparkles size={16} className="text-yellow-300" />
                                        </motion.div>
                                        <span className="text-sm">TUFFY is preparing your divine collection...</span>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Quick Questions */}
                    {messages.length < 3 && (
                        <div className="px-4 pb-2">
                            <div className="flex flex-wrap gap-2">
                                {quickQuestions.map((q, i) => (
                                    <button
                                        key={i}
                                        onClick={() => sendMessage(q)}
                                        className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white text-xs rounded-full transition-colors"
                                    >
                                        {q}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Input */}
                    <div className="relative p-4 bg-purple-900/50 backdrop-blur-sm border-t border-white/10">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={inputMessage}
                                onChange={(e) => setInputMessage(e.target.value)}
                                onKeyDown={handleKeyPress}
                                placeholder="Ask about style, outfits, trends..."
                                aria-label="Message TUFFY"
                                maxLength={2000}
                                className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-yellow-400/50 focus:ring-2 focus:ring-yellow-400/20"
                                disabled={isLoading}
                            />
                            <button
                                onClick={() => sendMessage()}
                                aria-label="Send message"
                                disabled={!inputMessage.trim() || isLoading}
                                className="p-3 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-xl hover:from-yellow-500 hover:to-orange-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Send size={20} className="text-white" />
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default TuffyChat;
