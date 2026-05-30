import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Loader2, ShoppingBag, Heart, Star } from 'lucide-react';

interface LoadingScreenProps {
    message?: string;
    submessage?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
    message = "Finding Your Perfect Style...",
    submessage = "Analyzing thousands of products just for you"
}) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600">
            {/* Animated background particles */}
            <div className="absolute inset-0 overflow-hidden">
                {[...Array(20)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-2 h-2 bg-white rounded-full opacity-30"
                        initial={{
                            x: Math.random() * window.innerWidth,
                            y: Math.random() * window.innerHeight
                        }}
                        animate={{
                            x: [null, Math.random() * window.innerWidth],
                            y: [null, Math.random() * window.innerHeight],
                        }}
                        transition={{
                            duration: Math.random() * 10 + 10,
                            repeat: Infinity,
                            ease: "linear"
                        }}
                    />
                ))}
            </div>

            {/* Main loading content */}
            <div className="relative z-10 text-center px-4">
                {/* Animated logo/icon */}
                <motion.div
                    className="mb-8 flex justify-center"
                    animate={{
                        scale: [1, 1.2, 1],
                        rotate: [0, 360],
                    }}
                    transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                >
                    <div className="relative">
                        <motion.div
                            className="absolute inset-0 bg-white rounded-full blur-2xl opacity-50"
                            animate={{
                                scale: [1, 1.5, 1],
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                        />
                        <ShoppingBag className="relative text-white" size={80} strokeWidth={1.5} />
                    </div>
                </motion.div>

                {/* Animated icons orbit */}
                <div className="relative w-64 h-64 mx-auto mb-8">
                    {[
                        { Icon: Heart, delay: 0, color: 'text-pink-300' },
                        { Icon: Star, delay: 0.5, color: 'text-yellow-300' },
                        { Icon: Sparkles, delay: 1, color: 'text-blue-300' },
                        { Icon: ShoppingBag, delay: 1.5, color: 'text-purple-300' },
                    ].map(({ Icon, delay, color }, i) => (
                        <motion.div
                            key={i}
                            className={`absolute ${color}`}
                            style={{
                                left: '50%',
                                top: '50%',
                            }}
                            animate={{
                                rotate: [0, 360],
                            }}
                            transition={{
                                duration: 8,
                                repeat: Infinity,
                                ease: "linear",
                                delay: delay,
                            }}
                        >
                            <motion.div
                                style={{
                                    x: 100 * Math.cos((i * Math.PI) / 2),
                                    y: 100 * Math.sin((i * Math.PI) / 2),
                                }}
                                animate={{
                                    scale: [1, 1.3, 1],
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                    delay: delay,
                                }}
                            >
                                <Icon size={32} fill="currentColor" />
                            </motion.div>
                        </motion.div>
                    ))}
                </div>

                {/* Loading spinner */}
                <motion.div
                    className="mb-6 flex justify-center"
                    animate={{ rotate: 360 }}
                    transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                >
                    <Loader2 className="text-white" size={48} />
                </motion.div>

                {/* Text content */}
                <motion.h2
                    className="text-4xl font-bold text-white mb-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    {message}
                </motion.h2>

                <motion.p
                    className="text-xl text-white/90 mb-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    {submessage}
                </motion.p>

                {/* Progress dots */}
                <div className="flex justify-center gap-2">
                    {[0, 1, 2].map((i) => (
                        <motion.div
                            key={i}
                            className="w-3 h-3 bg-white rounded-full"
                            animate={{
                                scale: [1, 1.5, 1],
                                opacity: [0.5, 1, 0.5],
                            }}
                            transition={{
                                duration: 1.5,
                                repeat: Infinity,
                                delay: i * 0.2,
                                ease: "easeInOut"
                            }}
                        />
                    ))}
                </div>

                {/* Fun facts that rotate */}
                <motion.div
                    className="mt-12 text-white/80 text-sm max-w-md mx-auto"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 1, 1, 0] }}
                    transition={{
                        duration: 4,
                        repeat: Infinity,
                        times: [0, 0.1, 0.9, 1],
                    }}
                >
                    <p>✨ We're scanning through thousands of products to find your perfect match</p>
                </motion.div>
            </div>
        </div>
    );
};

export default LoadingScreen;
