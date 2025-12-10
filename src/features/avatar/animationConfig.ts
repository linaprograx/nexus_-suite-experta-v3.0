export const AVATAR_ANIMATIONS = {
    // Timings
    duration: {
        fast: 120,    // Micro-interactions (hover, click)
        normal: 200,  // Standard UI transitions
        slow: 320,    // Panel entrances, large movements
        extraSlow: 480 // Complex sequences, drawing attention
    },
    // Easings
    easing: {
        softSpring: 'cubic-bezier(0.18, 0.89, 0.32, 1.28)', // Bouncy, playful
        smooth: 'cubic-bezier(0.22, 1, 0.36, 1)',           // Premium, silky
        standard: 'cubic-bezier(0.4, 0.0, 0.2, 1)'          // Standard Material-like
    },
    // Reusable Variants (Tailwind classes or inline styles)
    variants: {
        fadeSlideUp: "animate-in slide-in-from-bottom-4 fade-in duration-300 ease-out",
        fadeSlideRight: "animate-in slide-in-from-left-4 fade-in duration-300 ease-out",
        scaleIn: "animate-in zoom-in-95 fade-in duration-200 ease-out",
        hoverLift: "transition-transform duration-200 ease-out hover:-translate-y-1 hover:shadow-lg",
        clickDepress: "active:scale-[0.98] transition-transform duration-100"
    }
};

export const getStaggerDelay = (index: number, baseDelay: number = 50) => {
    return `${index * baseDelay}ms`;
};
