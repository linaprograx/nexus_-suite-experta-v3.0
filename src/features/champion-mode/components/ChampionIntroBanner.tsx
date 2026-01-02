import React, { useState } from 'react';
import { Icon } from '../../../components/ui/Icon';
import { ICONS } from '../../../components/ui/icons';

export const ChampionIntroBanner: React.FC = () => {
    const [isVisible, setIsVisible] = useState(true);

    if (!isVisible) return null;

    return (
        <div className="w-full max-w-7xl mx-auto mb-6 relative z-40 animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-1 shadow-lg border border-slate-700/50 relative overflow-hidden">
                {/* Decoration */}
                <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-violet-500/10 to-transparent pointer-events-none" />
                <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-cyan-500/10 blur-3xl rounded-full pointer-events-none" />

                <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl p-4 flex items-start md:items-center gap-5 relative z-10">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center shrink-0 shadow-lg shadow-violet-500/20">
                        <Icon svg={ICONS.trophy} className="w-5 h-5 text-white" />
                    </div>

                    <div className="flex-1">
                        <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                            Modo Competitivo Profesional
                            <span className="text-[9px] bg-white/10 text-white/70 px-2 py-0.5 rounded-full uppercase tracking-wider font-medium">BETA</span>
                        </h3>
                        <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">
                            Simulacro completo de competición en 4 fases: <span className="text-cyan-400 font-bold">Briefing</span> (Reglas), <span className="text-violet-400 font-bold">Creatividad</span> (Diseño), <span className="text-emerald-400 font-bold">Validación</span> (Jurado) y <span className="text-indigo-400 font-bold">Plan</span> (Presentación). Navega secuencialmente para asegurar la victoria.
                        </p>
                    </div>

                    <button
                        onClick={() => setIsVisible(false)}
                        className="p-2 hover:bg-white/5 rounded-full text-slate-500 hover:text-white transition-colors"
                    >
                        <Icon svg={ICONS.x} className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};
