import React from 'react';
import { GlassCard } from '../../../components/glass/GlassCard';
import { GlassAction } from '../../../components/glass/GlassAction';
import { GlassStack } from '../../../components/glass/GlassStack';
import { LABEL, BTN_TEXT, MSG_LAYER, SYS_STATE } from '../../../narrative/text.tokens';

interface AvatarCardProps {
    userName?: string;
    xpCurrent?: number;
    xpMax?: number;
    level?: number;
    role?: string;
    memberSince?: string;
    isActive?: boolean;
}

export const AvatarCard: React.FC<AvatarCardProps> = ({
    userName = 'Nexus Traveler',
    xpCurrent = 0,
    xpMax = 1000,
    level = 1,
    role = 'Explorer',
    memberSince = '2024',
    isActive = true
}) => {

    const progress = Math.min((xpCurrent / xpMax) * 100, 100);

    return (
        <GlassCard tone="violet" halo className="w-full max-w-sm p-6 relative overflow-hidden group hover:scale-[1.02] transition-all duration-500 shadow-xl ring-1 ring-white/60">
            {/* Atmosphere: Primary Glow (Stronger) */}
            <div className="absolute -top-24 -right-24 w-72 h-72 bg-violet-500/30 rounded-full blur-[60px] pointer-events-none mix-blend-multiply opacity-80 animate-pulse" style={{ animationDuration: '4s' }} />
            {/* Atmosphere: Secondary Accent (Stronger) */}
            <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-cyan-400/30 rounded-full blur-[50px] pointer-events-none mix-blend-multiply opacity-70" />
            {/* Atmosphere: Surface Sheen (Diamond) */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/60 via-white/10 to-transparent opacity-80 pointer-events-none border-t border-white/80 rounded-[inherit]" />

            <GlassStack gap="md">
                {/* Header */}
                <div className="flex justify-between items-start z-10">
                    <div className="flex-1">
                        <h2 className="text-2xl font-bold text-slate-800 tracking-tight mb-1 drop-shadow-sm">{userName}</h2>
                        <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                            <span className="px-1.5 py-0.5 rounded-md bg-white/30 border border-white/20 text-xs">
                                {LABEL.LEVEL} {level}
                            </span>
                            <span>{role}</span>
                        </div>
                    </div>
                    <div className="px-3 py-1 bg-gradient-to-br from-indigo-50/80 to-purple-50/80 backdrop-blur-md rounded-full text-[10px] font-bold tracking-wider text-indigo-900 border border-indigo-100/50 shadow-sm flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-300'}`}></span>
                        {isActive ? MSG_LAYER.STATUS.SYNCED : MSG_LAYER.STATUS.PENDING}
                    </div>
                </div>

                {/* XP Bar */}
                <div className="space-y-2 z-10 pt-2">
                    <div className="flex justify-between text-xs text-slate-500 uppercase font-bold tracking-wider px-1">
                        <span>{LABEL.XP}</span>
                        <span className="text-slate-700">{xpCurrent} <span className="text-slate-400 font-normal">/</span> {xpMax}</span>
                    </div>
                    <div className="h-3 bg-slate-200/50 rounded-full overflow-hidden backdrop-blur-sm border border-white/40 shadow-inner">
                        <div
                            className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-1000 ease-out shadow-[0_0_12px_rgba(167,139,250,0.6)] relative"
                            style={{ width: `${progress}%` }}
                        >
                            <div className="absolute top-0 bottom-0 right-0 w-px bg-white/50 blur-[1px]"></div>
                        </div>
                    </div>
                </div>

                {/* Meta Info */}
                <div className="pt-2 z-10">
                    <p className="text-xs text-slate-400">
                        {LABEL.MEMBER_SINCE} {memberSince}
                    </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-2 z-10">
                    <GlassAction variant="primary" tone="violet" className="flex-1 text-sm">
                        {BTN_TEXT.VIEW_PROFILE}
                    </GlassAction>
                    <GlassAction variant="ghost" className="flex-1 text-sm text-slate-500">
                        {BTN_TEXT.VALIDATE_MEMBERSHIP}
                    </GlassAction>
                </div>

            </GlassStack>
        </GlassCard>
    );
};
