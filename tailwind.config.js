/**
 * Fluid scale: interpolates between a mobile and a desktop value instead of jumping at
 * breakpoints. The MAX equals the previous fixed value, so desktop renders identically
 * and only smaller screens scale down.
 *   fluid(40, 72) → 40px at 360px viewport … 72px at 1280px, linear in between.
 */
const fluid = (minPx, maxPx, minVw = 360, maxVw = 1280) => {
    const slope = (maxPx - minPx) / (maxVw - minVw);
    const intercept = minPx - slope * minVw;
    return `clamp(${minPx / 16}rem, ${(intercept / 16).toFixed(4)}rem + ${(slope * 100).toFixed(4)}vw, ${maxPx / 16}rem)`;
};

/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
        "!./src/mobile-ref/**/*",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            },
            /**
             * Display sizes become fluid. Max = the current fixed value, so DESKTOP IS
             * UNCHANGED; phones stop getting a 72px headline on a 390px screen.
             * Line-heights are unitless so they scale with the font.
             * Sizes below 2xl stay fixed — body text must not shrink below legibility.
             */
            fontSize: {
                '2xl': [fluid(20, 24), { lineHeight: '1.3' }],
                '3xl': [fluid(22, 30), { lineHeight: '1.25' }],
                '4xl': [fluid(26, 36), { lineHeight: '1.2' }],
                '5xl': [fluid(30, 48), { lineHeight: '1.15' }],
                '6xl': [fluid(34, 60), { lineHeight: '1.1' }],
                '7xl': [fluid(38, 72), { lineHeight: '1.05' }],
                '8xl': [fluid(44, 96), { lineHeight: '1' }],
                '9xl': [fluid(52, 128), { lineHeight: '1' }],
            },
            /** Fluid container padding/gaps — opt-in, applied where big layouts breathe. */
            spacing: {
                'fluid-xs': fluid(8, 12),
                'fluid-sm': fluid(12, 16),
                'fluid-md': fluid(14, 24),
                'fluid-lg': fluid(16, 32),
                'fluid-xl': fluid(20, 40),
            },
            colors: {
                brand: {
                    primary: "#8b5cf6",
                    secondary: "#06b6d4",
                    accent: "#10b981"
                },
                nexus: {
                    orange: '#ff6b00',
                    graphite: '#1a1a1a',
                    slate: '#2d2d2d',
                    cream: '#f5f5f5',
                    champagne: '#e8e8e8'
                },
                border: 'hsl(var(--border))',
                input: 'hsl(var(--input))',
                ring: 'hsl(var(--ring))',
                background: 'hsl(var(--background))',
                foreground: 'hsl(var(--foreground))',
                primary: {
                    DEFAULT: 'hsl(var(--primary))',
                    foreground: 'hsl(var(--primary-foreground))',
                },
                secondary: {
                    DEFAULT: 'hsl(var(--secondary))',
                    foreground: 'hsl(var(--secondary-foreground))',
                },
                destructive: {
                    DEFAULT: 'hsl(var(--destructive))',
                    foreground: 'hsl(var(--destructive-foreground))',
                },
                muted: {
                    DEFAULT: 'hsl(var(--muted))',
                    foreground: 'hsl(var(--muted-foreground))',
                },
                accent: {
                    DEFAULT: 'hsl(var(--accent))',
                    foreground: 'hsl(var(--accent-foreground))',
                },
                popover: {
                    DEFAULT: 'hsl(var(--popover))',
                    foreground: 'hsl(var(--popover-foreground))',
                },
                card: {
                    DEFAULT: 'hsl(var(--card))',
                    foreground: 'hsl(var(--card-foreground))',
                },
            },
            borderRadius: {
                "xl2": "1.25rem"
            },
            boxShadow: {
                "soft": "0 4px 20px rgba(0,0,0,0.08)",
                "glass": "0 8px 32px 0 rgba(31, 38, 135, 0.07)",
                "floating": "0 10px 40px -10px rgba(0,0,0,0.1)",
                "premium": "0 20px 60px -15px rgba(0,0,0,0.15)"
            },
            transitionTimingFunction: {
                'nexus': 'var(--ease-nexus)',
                'out-expo': 'var(--ease-out-expo)',
            },
            transitionDuration: {
                'instant': 'var(--duration-instant)',
                'fast': 'var(--duration-fast)',
                'normal': 'var(--duration-normal)',
            },
        },
    },
    plugins: [],
}
