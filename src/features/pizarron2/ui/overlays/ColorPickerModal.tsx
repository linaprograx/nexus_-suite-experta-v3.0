import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface ColorPickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (color: string) => void;
    currentColor?: string;
}

/**
 * Simplified ColorPickerModal
 * Just shows the custom color picker with gradient selector
 */
export const ColorPickerModal: React.FC<ColorPickerModalProps> = ({
    isOpen,
    onClose,
    onSelect,
    currentColor = '#6366f1'
}) => {
    const [selectedColor, setSelectedColor] = useState(currentColor);

    const handleConfirm = () => {
        onSelect(selectedColor);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-end"
            onClick={onClose}
        >
            <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="w-full bg-white dark:bg-slate-900 rounded-t-3xl p-6 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                        Custom Color
                    </h3>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 
                                   flex items-center justify-center text-slate-600 dark:text-slate-300"
                    >
                        ✕
                    </button>
                </div>

                {/* Color Picker */}
                <div className="mb-6">
                    <div className="flex gap-4 items-start">
                        {/* Native Color Input */}
                        <div className="flex-shrink-0">
                            <input
                                type="color"
                                value={selectedColor}
                                onChange={(e) => setSelectedColor(e.target.value)}
                                className="w-20 h-20 rounded-xl border-2 border-slate-200 dark:border-slate-700 cursor-pointer"
                            />
                        </div>

                        {/* Hex Input */}
                        <div className="flex-1">
                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-wide">
                                Color Code
                            </label>
                            <input
                                type="text"
                                value={selectedColor}
                                onChange={(e) => setSelectedColor(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 
                                           bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white
                                           font-mono text-sm uppercase"
                                placeholder="#FFFFFF"
                            />
                        </div>
                    </div>
                </div>

                {/* Preview */}
                <div className="mb-6">
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-wide">
                        Preview
                    </label>
                    <div
                        className="w-full h-16 rounded-xl border-2 border-slate-200 dark:border-slate-700"
                        style={{ backgroundColor: selectedColor }}
                    />
                </div>

                {/* Save Button */}
                <button
                    onClick={handleConfirm}
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white 
                               rounded-2xl font-bold text-sm uppercase tracking-wide
                               active:scale-95 transition-all shadow-lg"
                >
                    Save Color
                </button>
            </motion.div>
        </div>
    );
};
