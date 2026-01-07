import React, { ButtonHTMLAttributes } from 'react';
import { GLASS_TOKENS, GlassTone } from '../../styles/nexusGlass.tokens';

interface GlassActionProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    tone?: GlassTone;
    variant?: 'primary' | 'ghost';
    loading?: boolean;
}

export const GlassAction: React.FC<GlassActionProps> = ({
    children,
    tone = 'neutral',
    variant = 'primary',
    loading = false,
    className = '',
    style = {},
    disabled,
    ...props
}) => {

    const baseStyles: React.CSSProperties = {
        borderRadius: GLASS_TOKENS.radius.md,
        transition: 'all 0.2s ease',
        fontWeight: 600,
        ...style
    };

    // Determine background based on variant and tone
    let background = '';
    let textColor = '';

    if (variant === 'primary') {
        if (tone === 'neutral') {
            background = '#ffffff';
            textColor = GLASS_TOKENS.palette.text.primary;
        } else {
            // Usually primary actions might look better with a solid distinct color or a stronger gradient
            // For "Glass", we might keep it subtle but defined.
            // Let's use the gradient but make it slightly more opaque/visible for actions
            background = GLASS_TOKENS.gradients[tone];
        }
    } else {
        // Ghost
        background = 'transparent';
    }

    const computedStyle: React.CSSProperties = {
        ...baseStyles,
        background: variant === 'primary' ? background : 'transparent',
        // Add a subtle border for primary
        border: variant === 'primary' ? GLASS_TOKENS.border.subtle : 'none',
        color: textColor || GLASS_TOKENS.palette.text.primary,
    };

    return (
        <button
            className={`px-4 py-3 flex items-center justify-center active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
            style={computedStyle}
            disabled={disabled || loading}
            {...props}
        >
            {loading ? <span className="animate-spin mr-2">⟳</span> : null}
            {children}
        </button>
    );
};
