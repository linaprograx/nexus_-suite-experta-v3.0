import React from 'react';
import { PlanTier } from '../../core/product/plans.types';
import { Icon } from '../ui/Icon';
import { ICONS } from '../ui/icons';

interface AscensionInviteProps {
    featureName: string;
    requiredState: string;
    requiredPlan: PlanTier;
    benefit: string;
    onExplore?: () => void;
}

/**
 * AscensionInvite Component
 * 
 * Displays narrative invitation to expand Avatar capabilities
 * instead of technical "locked" message
 */
export const AscensionInvite: React.FC<AscensionInviteProps> = ({
    featureName,
    requiredState,
    benefit,
    onExplore,
}) => {
    // State-specific styling
    const getStateColor = (state: string) => {
        switch (state) {
            case 'Ascendente':
                return 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30';
            case 'Platinum':
                return 'from-indigo-500/20 to-purple-500/20 border-indigo-500/30';
            case 'Jupiter':
                return 'from-amber-500/20 to-orange-500/20 border-amber-500/30';
            default:
                return 'from-slate-500/20 to-slate-600/20 border-slate-500/30';
        }
    };

    const getStateIcon = (state: string) => {
        switch (state) {
            case 'Ascendente':
                return ICONS.trendingUp;
            case 'Platinum':
                return ICONS.star;
            case 'Jupiter':
                return ICONS.zap;
            default:
                return ICONS.lock;
        }
    };

    return (
        <div className="relative w-full h-full flex items-center justify-center p-8">
            {/* Glassmorphism Card */}
            <div className={`
        relative max-w-md w-full
        bg-gradient-to-br ${getStateColor(requiredState)}
        backdrop-blur-2xl border rounded-3xl p-8
        shadow-[0_20px_80px_-12px_rgba(0,0,0,0.3)]
        animate-in zoom-in-95 fade-in duration-500
      `}>
                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-3xl" />

                {/* Content */}
                <div className="relative z-10 text-center space-y-6">
                    {/* Icon */}
                    <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mx-auto">
                        <Icon svg={getStateIcon(requiredState)} className="w-10 h-10 text-white" />
                    </div>

                    {/* Feature Name */}
                    <h3 className="text-2xl font-serif text-white">
                        {featureName}
                    </h3>

                    {/* State Requirement */}
                    <div className="space-y-2">
                        <p className="text-sm text-slate-300 uppercase tracking-widest font-bold">
                            Disponible en estado
                        </p>
                        <p className="text-xl text-white font-serif">
                            {requiredState}
                        </p>
                    </div>

                    {/* Benefit */}
                    <p className="text-slate-200 leading-relaxed">
                        {benefit}
                    </p>

                    {/* CTA */}
                    <button
                        onClick={onExplore}
                        className="
              w-full py-3 px-6 rounded-xl
              bg-gradient-to-r from-white/20 to-white/10
              hover:from-white/30 hover:to-white/20
              border border-white/20 hover:border-white/30
              text-white font-medium
              transition-all duration-300
              hover:scale-[1.02]
              shadow-lg hover:shadow-xl
            "
                    >
                        Explorar Expansión →
                    </button>

                    {/* Subtle note */}
                    <p className="text-xs text-slate-400 mt-4">
                        Tu capacidad actual se mantiene intacta
                    </p>
                </div>
            </div>
        </div>
    );
};
