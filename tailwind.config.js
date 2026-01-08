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
