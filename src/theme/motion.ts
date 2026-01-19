import { Variants } from 'framer-motion';

/**
 * Mobile Motion System - "Calm, Confident, Native"
 */

export const TRANSITIONS = {
    fast: { duration: 0.15, ease: [0.25, 0.46, 0.45, 0.94] },
    normal: { duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] },
    slow: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
    spring: { type: "spring", stiffness: 400, damping: 30 },
    springBouncy: { type: "spring", stiffness: 400, damping: 20 },
};

export const VARIANTS = {
    // Page Entry
    pageFadeIn: {
        initial: { opacity: 0 },
        animate: { opacity: 1, transition: { duration: 0.3 } },
        exit: { opacity: 0, transition: { duration: 0.2 } },
    },
    pageSlideUp: {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0, transition: TRANSITIONS.normal },
        exit: { opacity: 0, y: -20, transition: TRANSITIONS.fast },
    },

    // Component Entry (Staggered Children)
    containerStagger: {
        animate: {
            transition: {
                staggerChildren: 0.05
            }
        }
    },
    itemFadeUp: {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0, transition: TRANSITIONS.normal }
    },

    // Interactive Feedback
    tapScale: {
        tap: { scale: 0.98, transition: { duration: 0.1 } }
    },
    tapScaleSm: {
        tap: { scale: 0.95, transition: { duration: 0.1 } }
    }
};

export const CLASS_NAMES = {
    // Tailwind utility strings for common interactions
    hoverScale: "transition-transform active:scale-95 duration-200 ease-out",
    hoverGlow: "transition-all hover:shadow-lg hover:shadow-indigo-500/20",
    pressEffect: "active:scale-[0.98] active:opacity-90 transition-all duration-150",
};
