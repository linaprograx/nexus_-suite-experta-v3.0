import React from 'react';
import { GlassCard } from '../../components/glass/GlassCard';
import { GlassStack } from '../../components/glass/GlassStack';
import { LABEL, SYS_STATE } from '../../narrative/text.tokens';

export const HomeScreen: React.FC = () => {
    const hours = new Date().getHours();
    const greeting = hours < 12 ? 'Good morning' : hours < 18 ? 'Good afternoon' : 'Good evening';

    return (
        <div className="p-6 pb-24 space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            {/* Greeting */}
            <div className="pt-8">
                <h1 className="text-3xl font-light text-slate-800">{greeting}, <span className="font-semibold block">Traveler</span></h1>
            </div>

            {/* Quick Stats or Highlights */}
            <GlassCard tone="cyan" halo className="p-4" onClick={() => { }}>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold uppercase text-slate-500 tracking-wider">Daily Focus</p>
                        <p className="text-lg font-medium text-slate-800">Review 3 pending recipes</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-cyan-100/50 flex items-center justify-center text-cyan-600">
                        ⚡️
                    </div>
                </div>
            </GlassCard>

            {/* Recent Activity Stack */}
            <GlassStack gap="md">
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest pl-1">{LABEL.STATUS}</p>

                <GlassCard tone="neutral" className="p-3 flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                    <div className="flex-1">
                        <p className="text-sm font-medium text-slate-700">System Operational</p>
                        <p className="text-xs text-slate-400">{SYS_STATE.NEUTRAL('All modules online')}</p>
                    </div>
                </GlassCard>

                <GlassCard tone="neutral" className="p-3 flex items-center gap-3 opacity-60">
                    <div className="w-2 h-2 rounded-full bg-amber-400" />
                    <div className="flex-1">
                        <p className="text-sm font-medium text-slate-700">Inventory Warning</p>
                        <p className="text-xs text-slate-400">Stock low on 'Essence'</p>
                    </div>
                </GlassCard>
            </GlassStack>
        </div>
    );
};
