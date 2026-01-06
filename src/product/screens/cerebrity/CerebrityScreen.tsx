import React from 'react';
import { GlassCard } from '../../components/glass/GlassCard';
import { BTN_TEXT } from '../../narrative/text.tokens';

export const CerebrityScreen: React.FC = () => {
    return (
        <div className="h-full flex flex-col items-center justify-center p-6 pb-24 animate-in zoom-in-95 duration-500">
            <GlassCard tone="rose" halo className="w-full max-w-sm p-8 text-center space-y-4">
                <div className="w-16 h-16 mx-auto bg-gradient-to-tr from-rose-400 to-orange-400 rounded-2xl shadow-lg rotate-3 mb-4 flex items-center justify-center text-white text-2xl font-bold">
                    🧠
                </div>
                <h2 className="text-xl font-bold text-slate-800">Cerebrity AI</h2>
                <p className="text-slate-500 text-sm leading-relaxed">
                    This module is currently establishing neural links.
                    <br />
                    Analysis capabilities will be available shortly.
                </p>
                <div className="pt-4">
                    <span className="px-3 py-1 bg-rose-50 text-rose-600 rounded-full text-xs font-bold border border-rose-100">
                        {BTN_TEXT.CANCEL} (Simulation)
                    </span>
                </div>
            </GlassCard>
        </div>
    );
};
