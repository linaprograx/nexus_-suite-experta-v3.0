import React from 'react';
import { MOBILE_SHADOWS, MOBILE_COLORS, ModuleName } from '../design-tokens';
import { CLASS_NAMES } from '../../../theme/motion';

interface PremiumButtonProps {
    children: React.ReactNode;
    module?: ModuleName;
    variant?: 'primary' | 'secondary' | 'outline' | 'glass' | 'gradient';
    size?: 'sm' | 'md' | 'lg';
    fullWidth?: boolean;
    onClick?: () => void;
    disabled?: boolean;
    icon?: React.ReactNode;
    iconPosition?: 'left' | 'right';
    className?: string;
    glowEffect?: boolean;
    customGradient?: string;
    customColor?: string;
    loading?: boolean;
}

const PremiumButton: React.FC<PremiumButtonProps> = ({
    children,
    module,
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    onClick,
    disabled = false,
    icon,
    iconPosition = 'right',
    className = '',
    glowEffect = true,
    customGradient,
    customColor,
    loading = false,
}) => {
    // Size classes
    const sizeClasses = {
        sm: 'py-2.5 px-4 text-[10px]',
        md: 'py-3 px-5 text-[11px]',
        lg: 'py-4 px-6 text-sm',
    };

    // Get module color
    const moduleColor = module ? MOBILE_COLORS[module] : customColor || '#6D28D9';

    // Variant styles
    const getVariantStyles = () => {
        switch (variant) {
            case 'primary':
                return {
                    background: customGradient || `linear-gradient(135deg, ${moduleColor} 0%, ${moduleColor}dd 100%)`,
                    color: 'white',
                    boxShadow: glowEffect ? MOBILE_SHADOWS.actionGlow(moduleColor + '80') : 'none',
                };

            case 'gradient':
                return {
                    background: customGradient || `linear-gradient(135deg, ${moduleColor} 0%, ${adjustColorBrightness(moduleColor, 20)} 100%)`,
                    color: 'white',
                    boxShadow: glowEffect ? MOBILE_SHADOWS.buttonGlow(moduleColor + '80') : 'none',
                };

            case 'secondary':
                return {
                    background: `${moduleColor}15`,
                    color: moduleColor,
                    border: `1px solid ${moduleColor}30`,
                    boxShadow: 'none',
                };

            case 'outline':
                return {
                    background: 'transparent',
                    color: moduleColor,
                    border: `2px solid ${moduleColor}`,
                    boxShadow: 'none',
                };

            case 'glass':
                return {
                    background: 'rgba(255, 255, 255, 0.6)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    color: '#1F2937',
                    border: '1px solid rgba(255, 255, 255, 0.6)',
                    boxShadow: MOBILE_SHADOWS.glassCard,
                };

            default:
                return {};
        }
    };

    const variantStyles = getVariantStyles();

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`
        ${sizeClasses[size]}
        ${fullWidth ? 'w-full' : ''}
        rounded-2xl
        font-black
        uppercase
        tracking-widest
        transition-all
        duration-300
        hover:brightness-110
        ${CLASS_NAMES.pressEffect}
        ${className}
      `}
            style={variantStyles}
        >
            {icon && iconPosition === 'left' && !loading && <span className="flex-shrink-0">{icon}</span>}
            {loading && (
                <span className="material-symbols-outlined animate-spin text-inherit !text-lg">
                    sync
                </span>
            )}
            <span>{loading ? 'Procesando...' : children}</span>
            {icon && iconPosition === 'right' && !loading && <span className="flex-shrink-0">{icon}</span>}
        </button>
    );
};

// Helper function to adjust color brightness
function adjustColorBrightness(color: string, percent: number): string {
    // Simple implementation - in production use a color manipulation library
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = ((num >> 8) & 0x00ff) + amt;
    const B = (num & 0x0000ff) + amt;

    return (
        '#' +
        (
            0x1000000 +
            (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
            (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
            (B < 255 ? (B < 1 ? 0 : B) : 255)
        )
            .toString(16)
            .slice(1)
    );
}

export default PremiumButton;
