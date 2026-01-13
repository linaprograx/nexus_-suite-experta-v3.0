import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { pizarronStore } from '../../state/store';
import {
    LuPlus, LuSquare, LuType, LuImage,
    LuShapes, LuChefHat, LuX
} from 'react-icons/lu';

/**
 * MobileFloatingToolbar
 * FAB (Floating Action Button) at bottom-right
 * Expands to show creation tools
 */
export const MobileFloatingToolbar: React.FC = () => {
    const [isExpanded, setExpanded] = useState(false);

    const tools = [
        {
            id: 'shape',
            icon: LuSquare,
            label: 'Shape',
            color: 'bg-blue-500',
            action: () => {
                pizarronStore.setUIFlag('activeTool', 'rectangle');
                setExpanded(false);
            }
        },
        {
            id: 'text',
            icon: LuType,
            label: 'Text',
            color: 'bg-purple-500',
            action: () => {
                pizarronStore.setUIFlag('activeTool', 'text');
                setExpanded(false);
            }
        },
        {
            id: 'image',
            icon: LuImage,
            label: 'Image',
            color: 'bg-green-500',
            action: () => {
                const url = window.prompt('Enter image URL:');
                if (url) {
                    const viewport = pizarronStore.getState().viewport;
                    const centerX = (window.innerWidth / 2 - viewport.x) / viewport.zoom;
                    const centerY = (window.innerHeight / 2 - viewport.y) / viewport.zoom;

                    pizarronStore.addNode({
                        id: crypto.randomUUID(),
                        type: 'image',
                        x: centerX - 100,
                        y: centerY - 100,
                        w: 200,
                        h: 200,
                        content: { image: { url } }, // Use 'image' property with url
                        zIndex: pizarronStore.getState().order.length,
                        createdAt: Date.now(),
                        updatedAt: Date.now()
                    });
                }
                setExpanded(false);
            }
        },
        {
            id: 'library',
            icon: LuShapes,
            label: 'Library',
            color: 'bg-orange-500',
            action: () => {
                pizarronStore.setUIFlag('showLibrary', true);
                setExpanded(false);
            }
        },
        {
            id: 'grimorio',
            icon: LuChefHat,
            label: 'Grimorio',
            color: 'bg-rose-500',
            action: () => {
                pizarronStore.setUIFlag('grimorioPickerOpen', 'recipes');
                setExpanded(false);
            }
        }
    ];

    return (
        <div className="fixed bottom-6 right-6 z-[70] flex flex-col items-end gap-3">
            {/* Expanded Tools */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                        className="flex flex-col gap-3"
                    >
                        {tools.map((tool, index) => (
                            <motion.button
                                key={tool.id}
                                initial={{ x: 20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: 20, opacity: 0 }}
                                transition={{ delay: index * 0.05 }}
                                onClick={tool.action}
                                className={`${tool.color} text-white rounded-2xl px-4 py-3 
                                           shadow-xl flex items-center gap-3 min-w-[140px]
                                           active:scale-95 transition-transform`}
                            >
                                <tool.icon size={20} />
                                <span className="text-sm font-bold">{tool.label}</span>
                            </motion.button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main FAB */}
            <motion.button
                onClick={() => setExpanded(!isExpanded)}
                className="w-16 h-16 rounded-full bg-indigo-600 dark:bg-indigo-500 
                           text-white shadow-2xl flex items-center justify-center
                           active:scale-95 transition-transform"
                whileTap={{ scale: 0.9 }}
                animate={{ rotate: isExpanded ? 45 : 0 }}
            >
                {isExpanded ? <LuX size={28} /> : <LuPlus size={28} />}
            </motion.button>
        </div>
    );
};
