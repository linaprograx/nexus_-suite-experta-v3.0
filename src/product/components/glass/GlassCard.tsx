import React, { ReactNode } from 'react';
import { GLASS_TOKENS, GlassTone } from '../../styles/nexusGlass.tokens';

interface GlassCardProps {
    children: ReactNode;
    tone?: GlassTone;
    halo?: boolean;
    className?: string;
    onClick?: () => void;
}

export const GlassCard: React.FC<GlassCardProps> = ({
    children,
    tone = 'neutral',
    halo = false,
    className = '',
    onClick
}) => {

    // Construct styles dynamically based on props to leverage tokens
    const style: React.CSSProperties = {
        background: tone === 'neutral' ? GLASS_TOKENS.palette.base.surface : GLASS_TOKENS.gradients[tone],
        backdropFilter: GLASS_TOKENS.blur.md,
        WebkitBackdropFilter: GLASS_TOKENS.blur.md,
        border: GLASS_TOKENS.border.light,
        borderRadius: GLASS_TOKENS.radius.lg,
        boxShadow: halo ? `${GLASS_TOKENS.shadow.glass}, ${GLASS_TOKENS.halo[tone]}` : GLASS_TOKENS.shadow.glass,
    };

    return (
        <div
            className={`transition-all duration-300 ${onClick ? 'cursor-pointer hover:-translate-y-1' : ''} ${className}`}
            style={style}
            onClick={onClick}
        >
            {children}
        </div>
    );
};
