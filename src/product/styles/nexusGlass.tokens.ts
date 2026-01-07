export const GLASS_TOKENS = {
    radius: {
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        full: '9999px',
    },
    border: {
        light: '1px solid rgba(255, 255, 255, 0.6)',
        subtle: '1px solid rgba(255, 255, 255, 0.3)',
    },
    shadow: {
        glass: '0 8px 32px 0 rgba(31, 38, 135, 0.05)',
        raised: '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.025)',
    },
    blur: {
        md: 'blur(12px)',
    },
    palette: {
        base: {
            bg: '#f8fafc', // slate-50
            surface: 'rgba(255, 255, 255, 0.65)',
        },
        text: {
            primary: '#0f172a', // slate-900
            secondary: '#475569', // slate-600
            tertiary: '#94a3b8', // slate-400
        }
    },
    gradients: {
        rose: 'linear-gradient(135deg, rgba(255, 228, 230, 0.5) 0%, rgba(255, 255, 255, 0.1) 100%)',
        violet: 'linear-gradient(135deg, rgba(237, 233, 254, 0.5) 0%, rgba(255, 255, 255, 0.1) 100%)',
        cyan: 'linear-gradient(135deg, rgba(207, 250, 254, 0.5) 0%, rgba(255, 255, 255, 0.1) 100%)',
        neutral: 'linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.4) 100%)',
    },
    halo: {
        rose: '0 0 20px rgba(251, 113, 133, 0.15)',
        violet: '0 0 20px rgba(139, 92, 246, 0.15)',
        cyan: '0 0 20px rgba(6, 182, 212, 0.15)',
        none: 'none'
    }
};

export type GlassTone = 'neutral' | 'rose' | 'violet' | 'cyan';
