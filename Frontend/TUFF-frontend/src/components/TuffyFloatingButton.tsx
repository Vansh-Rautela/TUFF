import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface TuffyFloatingButtonProps {
    onClick: () => void;
}

export const TuffyFloatingButton: React.FC<TuffyFloatingButtonProps> = ({ onClick }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <motion.button
            onClick={onClick}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            className="fixed bottom-6 right-6 z-40 group"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
        >
            {/* Glow Effect */}
            <motion.div
                className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full blur-xl opacity-60"
                animate={{
                    scale: isHovered ? [1, 1.2, 1] : 1,
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                }}
            />

            {/* Main Button */}
            <div className="relative w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center shadow-2xl">
                {/* Inner Glow */}
                <div className="absolute inset-1 bg-gradient-to-br from-yellow-400/30 to-transparent rounded-full" />

                {/* Icon */}
                <motion.div
                    animate={{
                        rotate: isHovered ? [0, 10, -10, 0] : 0,
                    }}
                    transition={{
                        duration: 0.5,
                    }}
                >
                    <Sparkles className="text-white relative z-10" size={28} />
                </motion.div>

                {/* Orbiting Particles */}
                {isHovered && (
                    <>
                        {[0, 120, 240].map((angle, i) => (
                            <motion.div
                                key={i}
                                className="absolute w-2 h-2 bg-yellow-300 rounded-full"
                                style={{
                                    left: '50%',
                                    top: '50%',
                                }}
                                animate={{
                                    x: [
                                        0,
                                        Math.cos((angle * Math.PI) / 180) * 40,
                                    ],
                                    y: [
                                        0,
                                        Math.sin((angle * Math.PI) / 180) * 40,
                                    ],
                                    opacity: [0, 1, 0],
                                }}
                                transition={{
                                    duration: 1.5,
                                    repeat: Infinity,
                                    delay: i * 0.2,
                                }}
                            />
                        ))}
                    </>
                )}

                {/* Notification Dot (optional - for new tips) */}
                <motion.div
                    className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white"
                    animate={{
                        scale: [1, 1.2, 1],
                    }}
                    transition={{
                        duration: 1,
                        repeat: Infinity,
                    }}
                />
            </div>

            {/* Tooltip */}
            <AnimatePresence>
                {isHovered && (
                    <motion.div
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className="absolute right-full mr-4 top-1/2 -translate-y-1/2 whitespace-nowrap"
                    >
                        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
                            <Sparkles size={16} />
                            <span className="font-semibold">Ask TUFFY for Style Advice!</span>
                        </div>
                        {/* Arrow */}
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-l-8 border-l-pink-600" />
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.button>
    );
};

export default TuffyFloatingButton;
