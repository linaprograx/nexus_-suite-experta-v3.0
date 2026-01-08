import { useState, useEffect } from 'react';

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
    const [isMobile, setIsMobile] = useState<boolean>(() => {
        // Initial check (SSR safe)
        if (typeof window === 'undefined') return false;
        return window.innerWidth < MOBILE_BREAKPOINT;
    });

    useEffect(() => {
        const mediaQuery = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`);

        const handleChange = (e: MediaQueryListEvent) => {
            setIsMobile(e.matches);
        };

        // Modern API
        mediaQuery.addEventListener('change', handleChange);

        // Set initial value in case it changed between init and effect
        setIsMobile(mediaQuery.matches);

        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    return isMobile;
}
