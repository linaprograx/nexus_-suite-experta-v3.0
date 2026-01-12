import React from 'react';
import { MOBILE_BACKGROUNDS, MOBILE_BORDERS, MOBILE_BLUR, MOBILE_SHADOWS } from '../design-tokens';

interface GlassCardProps {
    children: React.ReactNode;
    className?: string;
    variant?: 'standard' | 'light' | 'dark' | 'intense';
    rounded?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
    padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
    onClick?: () => void;
    style?: React.CSSProperties;
}

const GlassCard: React.FC<GlassCardProps> = ({
    children,
    className = '',
    variant = 'standard',
    rounded = '3xl',
    padding = 'md',
    onClick,
    style = {},
}) => {
    // Determine background and border based on variant
    const backgrounds = {
        standard: MOBILE_BACKGROUNDS.glass,
        light: MOBILE_BACKGROUNDS.glassLight,
        dark: MOBILE_BACKGROUNDS.glassDark,
        intense: MOBILE_BACKGROUNDS.glassBlur,
    };

    const shadows = {
        standard: MOBILE_SHADOWS.glassCard,
        light: MOBILE_SHADOWS.glassCard,
        dark: MOBILE_SHADOWS.glassDeep,
        intense: MOBILE_SHADOWS.glassIntense,
    };

    const roundedClasses = {
        sm: 'rounded-lg',
        md: 'rounded-xl',
        lg: 'rounded-2xl',
        xl: 'rounded-[1.5rem]',
        '2xl': 'rounded-[2rem]',
        '3xl': 'rounded-[2.5rem]',
    };

    const paddingClasses = {
        none: '',
        sm: 'p-3',
        md: 'p-5',
        lg: 'p-6',
        xl: 'p-8',
    };

    const glassBorder = variant === 'dark' ? MOBILE_BORDERS.glassDark : MOBILE_BORDERS.glass;

    return (
        <div
            className={`
        ${roundedClasses[rounded]}
        ${paddingClasses[padding]}
        ${onClick ? 'cursor-pointer active:scale-[0.98]' : ''}
        transition-all duration-300
        ${className}
      `}
            onClick={onClick}
            style={{
                background: backgrounds[variant],
                backdropFilter: MOBILE_BLUR.standard,
                WebkitBackdropFilter: MOBILE_BLUR.standard,
                border: glassBorder,
                boxShadow: shadows[variant],
                ...style,
            }}
        >
            {children}
        </div>
    );
};

export default GlassCard;
