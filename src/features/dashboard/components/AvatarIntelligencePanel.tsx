import React from 'react';
import { Icon } from '../../../components/ui/Icon';
import { ICONS } from '../../../components/ui/icons';
import { useAvatarCognition } from '../../../hooks/useAvatarCognition';
import { useNavigate } from 'react-router-dom';

export const AvatarIntelligencePanel: React.FC = () => {
    const navigate = useNavigate();
    const { activeAvatarType, getActiveConfig, getActiveProfile } = useAvatarCognition();
    const config = getActiveConfig();
    const profile = getActiveProfile();

    if (!config || !profile) return null;

    // Map Risk Tolerance to Color/Icon
    const getRiskInfo = (risk: string) => {
        const r = risk.toLowerCase();
        if (r === 'conservador') return { color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Conservador' };
        if (r === 'moderado') return { color: 'text-amber-400', bg: 'bg-amber-500/10', label: 'Moderado' };
        if (r === 'audaz') return { color: 'text-rose-400', bg: 'bg-rose-500/10', label: 'Audaz' };
        return { color: 'text-indigo-400', bg: 'bg-indigo-500/10', label: 'Experimental' };
    };

    const riskInfo = getRiskInfo(profile.riskTolerance);

    return (
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-[24px] p-6 border border-indigo-500/50 shadow-[0_0_15px_-3px_rgba(99,102,241,0.25),_0_20px_40px_-5px_rgba(0,0,0,0.1)] dark:shadow-[0_0_25px_-5px_rgba(99,102,241,0.4),_0_20px_50px_-12px_rgba(0,0,0,0.6)] hover:shadow-[0_0_30px_-5px_rgba(99,102,241,0.4),_0_25px_60px_-12px_rgba(0,0,0,0.2)] dark:hover:shadow-[0_0_40px_-5px_rgba(99,102,241,0.6),_0_25px_60px_-12px_rgba(0,0,0,0.7)] transition-all duration-500 relative overflow-hidden group">
            {/* Glass Highlight */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            {/* Subtle glow effect based on tone */}
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-indigo-500/10 blur-3xl rounded-full group-hover:bg-indigo-500/20 transition-all duration-700"></div>

            <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1">
                        Inteligencia Activa
                    </span>
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                        {config.emoji} {config.name}
                    </h3>
                </div>
                <div className="bg-indigo-500/10 p-2 rounded-lg text-indigo-500">
                    <Icon svg={ICONS.brain} className="w-5 h-5" />
                </div>
            </div>

            {/* Stats Grid */}
            <div className="space-y-3 relative z-10">
                {/* Tone */}
                <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500 dark:text-gray-400">Tono Cognitivo</span>
                    <span className="font-bold text-indigo-500 dark:text-indigo-400">{profile.tone}</span>
                </div>

                {/* Risk */}
                <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500 dark:text-gray-400">Riesgo</span>
                    <span className={`font-bold px-2 py-0.5 rounded-full ${riskInfo.bg} ${riskInfo.color}`}>
                        {riskInfo.label}
                    </span>
                </div>

                {/* Active Principles Chips */}
                <div className="pt-2">
                    <span className="text-[10px] text-gray-400 dark:text-slate-500 uppercase tracking-widest block mb-2">
                        Principios Activos
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                        {profile.activePrinciples.slice(0, 3).map((p, idx) => (
                            <span key={idx} className="text-[10px] px-2 py-1 bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-white/5 rounded-md text-gray-600 dark:text-gray-300">
                                {p}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Adjust Button */}
            <button
                onClick={() => navigate('/avatar')}
                className="w-full mt-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 hover:scale-[1.02]"
            >
                <Icon svg={ICONS.sliders} className="w-4 h-4 text-indigo-100" /> Ajustar Parámetros
            </button>
        </div>
    );
};
