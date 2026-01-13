import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { pizarronStore } from '../../state/store';

/**
 * MobileSelectionHUD
 * Visual feedback showing selection count
 * Appears at top center when elements are selected
 */
export const MobileSelectionHUD: React.FC = () => {
    const { selection } = pizarronStore.useState();

    if (selection.size === 0) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -50, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="fixed top-20 left-1/2 -translate-x-1/2 z-[60]
                           bg-slate-900/90 dark:bg-slate-800/90 backdrop-blur-md
                           text-white rounded-full px-5 py-2.5
                           text-sm font-semibold shadow-xl border border-white/10"
            >
                <span className="text-indigo-300">{selection.size}</span>
                {' '}{selection.size === 1 ? 'element' : 'elements'} selected
            </motion.div>
        </AnimatePresence>
    );
};
