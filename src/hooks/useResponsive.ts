import { useState, useEffect } from 'react';

/**
 * Breakpoints — MUST mirror Tailwind's. This is the single source of truth so JS and
 * CSS can never disagree (the old useIsMobile used `max-width: 768` while Tailwind's
 * `md:` is `min-width: 768`, so at exactly 768px they contradicted each other and the
 * layout flashed on load).
 */
export const BREAKPOINTS = {
    sm: 640,
    md: 768,   // ← 3-column layout starts here
    lg: 1024,
    xl: 1280,
} as const;

export type Device = 'mobile' | 'tablet' | 'desktop';

export interface Responsive {
    /** < 768px — one column, sheets instead of side panels */
    isMobile: boolean;
    /** 768–1023px — two columns, detail still in a sheet */
    isTablet: boolean;
    /** ≥ 1024px — full three-column layout */
    isDesktop: boolean;
    device: Device;
    /** Phone held sideways: short viewport, needs compact chrome */
    isLandscape: boolean;
    /** Finger input available → enforce 44px touch targets regardless of width */
    isTouch: boolean;
    /** Live viewport width, for fine-grained decisions */
    width: number;
}

const read = (): Responsive => {
    if (typeof window === 'undefined') {
        // SSR / pre-hydration: assume desktop so the richest layout is the default
        return { isMobile: false, isTablet: false, isDesktop: true, device: 'desktop', isLandscape: false, isTouch: false, width: BREAKPOINTS.lg };
    }
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Aligned with Tailwind: `md:` applies FROM 768 upward, so mobile is strictly below.
    const isMobile = width < BREAKPOINTS.md;
    const isTablet = width >= BREAKPOINTS.md && width < BREAKPOINTS.lg;
    const isDesktop = width >= BREAKPOINTS.lg;

    return {
        isMobile,
        isTablet,
        isDesktop,
        device: isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop',
        isLandscape: width > height && height < BREAKPOINTS.md,
        isTouch: window.matchMedia('(hover: none) and (pointer: coarse)').matches,
        width,
    };
};

/**
 * Viewport awareness for the mobile-first layer: device tier, orientation and input type.
 * Replaces the old binary useIsMobile.
 */
export const useResponsive = (): Responsive => {
    // Read synchronously on first render so there is no wrong-layout flash
    const [state, setState] = useState<Responsive>(read);

    useEffect(() => {
        let frame = 0;
        const onChange = () => {
            // Coalesce resize storms into one update per frame
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(() => setState(read()));
        };

        window.addEventListener('resize', onChange);
        window.addEventListener('orientationchange', onChange);
        const pointer = window.matchMedia('(hover: none) and (pointer: coarse)');
        pointer.addEventListener('change', onChange);

        onChange(); // resync in case the viewport changed before mount

        return () => {
            cancelAnimationFrame(frame);
            window.removeEventListener('resize', onChange);
            window.removeEventListener('orientationchange', onChange);
            pointer.removeEventListener('change', onChange);
        };
    }, []);

    return state;
};

/** Convenience wrapper for the common case. */
export const useIsMobile = (): boolean => useResponsive().isMobile;
