import React from 'react';
import { GlassCard } from '../components/glass/GlassCard';
import { GlassAction } from '../components/glass/GlassAction';
import { GlassStack } from '../components/glass/GlassStack';
import { LABEL, BTN_TEXT, MSG_LAYER, SYS_STATE } from '../narrative/text.tokens';

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
        <GlassCard tone="violet" halo className="w-full max-w-sm p-6 relative overflow-hidden">
            {/* Decorative background element, keeping it code-only, no images */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />

            <GlassStack gap="md">
                {/* Header */}
                <div className="flex justify-between items-start z-10">
                    <div>
                        <h2 className="text-xl font-semibold text-slate-800 tracking-tight">{userName}</h2>
                        <p className="text-sm text-slate-500 font-medium">
                            {LABEL.LEVEL} {level} • {role}
                        </p>
                    </div>
                    <div className="px-2 py-1 bg-white/40 rounded text-xs font-mono text-slate-600 border border-white/20">
                        {isActive ? MSG_LAYER.STATUS.SYNCED : MSG_LAYER.STATUS.PENDING}
                    </div>
                </div>

                {/* XP Bar */}
                <div className="space-y-2 z-10">
                    <div className="flex justify-between text-xs text-slate-500 uppercase font-bold tracking-wider">
                        <span>{LABEL.XP}</span>
                        <span>{xpCurrent} / {xpMax}</span>
                    </div>
                    <div className="h-2 bg-slate-200/50 rounded-full overflow-hidden backdrop-blur-sm">
                        <div
                            className="h-full bg-slate-800/80 transition-all duration-1000 ease-out"
                            style={{ width: `${progress}%` }}
                        />
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
