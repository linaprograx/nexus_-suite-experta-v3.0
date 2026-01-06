import React from 'react';
import { GlassCard } from './components/glass/GlassCard';
import { AvatarCard } from './avatar/AvatarCard';

export const ProductApp: React.FC = () => {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 gap-8" style={{ background: '#f8fafc' }}>

            {/* Main Shell Placeholder */}
            <GlassCard tone="cyan" halo className="max-w-sm w-full p-8 text-center hidden">
                {/* Hidden for now to focus on Pilot */}
            </GlassCard>

            <div className="w-full max-w-sm space-y-4">
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-light text-slate-900">Nexus Glass</h1>
                    <p className="text-sm text-slate-400">Narrative Pilot: Avatar</p>
                </div>

                {/* Pilot Component */}
                <AvatarCard
                    userName="Lian Alviz"
                    role="Architect"
                    level={42}
                    xpCurrent={8500}
                    xpMax={10000}
                />
            </div>

            <div className="fixed bottom-4 right-4 px-3 py-1 bg-slate-200/50 rounded-full text-xs text-slate-400 font-mono">
                mode: {import.meta.env.VITE_UI_MODE || 'legacy'}
            </div>
        </div>
    );
};
