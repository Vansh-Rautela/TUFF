import React, { useState, useRef } from 'react';
import { X, Camera, Upload, Loader2, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ColorAnalysisModalProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete: (analysis: any) => void;
}

export const ColorAnalysisModal: React.FC<ColorAnalysisModalProps> = ({
    isOpen,
    onClose,
    onComplete,
}) => {
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysis, setAnalysis] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setSelectedImage(reader.result as string);
                setError(null);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAnalyze = async () => {
        if (!selectedImage) return;

        setIsAnalyzing(true);
        setError(null);

        try {
            const response = await fetch('http://localhost:5000/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    image: selectedImage,
                }),
            });

            if (!response.ok) {
                throw new Error('Analysis failed');
            }

            const data = await response.json();

            if (data.error) {
                setError(data.error);
                setIsAnalyzing(false);
                return;
            }

            setAnalysis(data);
            setIsAnalyzing(false);

            // Auto-complete after 2 seconds to show results
            setTimeout(() => {
                onComplete(data);
            }, 2000);

        } catch (err) {
            setError('Failed to analyze image. Please try again.');
            setIsAnalyzing(false);
        }
    };

    const handleSkip = () => {
        onComplete(null);
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
                    <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                <Camera className="text-purple-600" size={20} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">Color Analysis</h2>
                                <p className="text-sm text-gray-600">Discover your perfect colors</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        {!analysis ? (
                            <>
                                {/* Upload Section */}
                                <div className="text-center mb-6">
                                    <p className="text-gray-600 mb-4">
                                        Upload a clear photo of your face to analyze your skin tone and find colors that suit you best.
                                    </p>
                                </div>

                                {/* Image Preview or Upload Area */}
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`relative border-2 border-dashed rounded-xl p-8 mb-6 cursor-pointer transition-all ${selectedImage
                                            ? 'border-purple-500 bg-purple-50'
                                            : 'border-gray-300 hover:border-purple-400 hover:bg-gray-50'
                                        }`}
                                >
                                    {selectedImage ? (
                                        <div className="relative">
                                            <img
                                                src={selectedImage}
                                                alt="Selected"
                                                className="max-h-64 mx-auto rounded-lg"
                                            />
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedImage(null);
                                                    setError(null);
                                                }}
                                                className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="text-center">
                                            <Upload className="mx-auto mb-4 text-gray-400" size={48} />
                                            <p className="text-gray-600 font-semibold mb-2">
                                                Click to upload your photo
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                JPG, PNG or BMP (Max 5MB)
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageSelect}
                                    className="hidden"
                                />

                                {/* Error Message */}
                                {error && (
                                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                                        <p className="text-red-600 text-sm">{error}</p>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex gap-3">
                                    <button
                                        onClick={handleSkip}
                                        className="flex-1 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                                    >
                                        Skip for Now
                                    </button>
                                    <button
                                        onClick={handleAnalyze}
                                        disabled={!selectedImage || isAnalyzing}
                                        className="flex-1 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {isAnalyzing ? (
                                            <>
                                                <Loader2 className="animate-spin" size={20} />
                                                Analyzing...
                                            </>
                                        ) : (
                                            'Analyze Photo'
                                        )}
                                    </button>
                                </div>
                            </>
                        ) : (
                            /* Results Section */
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-center"
                            >
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle className="text-green-600" size={32} />
                                </div>

                                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                                    Analysis Complete!
                                </h3>

                                <p className="text-gray-600 mb-6">
                                    Your skin tone: <strong>{analysis.skintone?.name}</strong>
                                </p>

                                {/* Color Palette */}
                                <div className="bg-purple-50 rounded-xl p-6 mb-6">
                                    <h4 className="font-semibold text-gray-900 mb-4">
                                        Your Perfect Colors
                                    </h4>
                                    <div className="flex justify-center gap-3 flex-wrap">
                                        {analysis.complementaryColors?.map((color: any, idx: number) => (
                                            <div key={idx} className="text-center">
                                                <div
                                                    className="w-16 h-16 rounded-full border-4 border-white shadow-lg mb-2"
                                                    style={{ backgroundColor: color.hex }}
                                                />
                                                <p className="text-xs text-gray-600">{color.name}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <p className="text-sm text-gray-600">
                                    Proceeding to style preferences...
                                </p>
                            </motion.div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default ColorAnalysisModal;
