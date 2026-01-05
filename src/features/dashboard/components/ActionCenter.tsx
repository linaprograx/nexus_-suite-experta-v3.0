import React from 'react';
import { Icon } from '../../../components/ui/Icon';
import { ICONS } from '../../../components/ui/icons';
import { useNavigate } from 'react-router-dom';
import { useAvatarCognition } from '../../../hooks/useAvatarCognition';

interface ActionCenterProps {
    nbaData: {
        action: string;
        reason?: string;
        description?: string;
        impact: string;
        difficulty?: string;
        time: number | string;
        route?: string;
    } | null;
    loading?: boolean;
    onRefresh?: () => void;
}

export const ActionCenter: React.FC<ActionCenterProps> = ({ nbaData, loading, onRefresh }) => {
    const navigate = useNavigate();
    const { getActiveProfile } = useAvatarCognition();
    const profile = getActiveProfile();

    // Dynamic Gradient Logic based on Tone
    const getGradient = (tone?: string) => {
        const t = (tone || '').toLowerCase().trim();

        // Debug or explicit match
        if (t === 'eficiente' || t === 'técnico') return 'from-indigo-600 to-violet-900 border-indigo-400/30';
        if (t === 'creativo' || t === 'creative') return 'from-fuchsia-700 to-purple-900 border-fuchsia-400/30 shadow-[0_10px_40px_-10px_rgba(192,38,211,0.5)]'; // Stronger purple pop
        if (t === 'vanguardista') return 'from-cyan-600 to-blue-900 border-cyan-400/30';
        if (t === 'michelin-grade' || t === 'exclusivo') return 'from-slate-800 to-neutral-950 border-amber-500/50';

        // Default Fallback
        return 'from-indigo-900 to-slate-900 border-indigo-500/30';
    };

    const gradientClass = getGradient(profile?.tone);

    // Map difficulty to color
    const getDifficultyColor = (diff: string) => {
        const d = diff.toLowerCase();
        if (d.includes('baja') || d.includes('fácil')) return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
        if (d.includes('media')) return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
        return 'text-rose-400 bg-rose-400/10 border-rose-400/20';
    };

    if (loading) {
        return (
            <div className="h-64 rounded-3xl bg-gray-100 dark:bg-slate-800 animate-pulse flex items-center justify-center">
                <span className="text-sm text-gray-400">Analizando contexto operativo...</span>
            </div>
        );
    }

    if (!nbaData) return null;

    return (
        <div className={`relative group overflow-hidden rounded-[32px] p-8 bg-gradient-to-br ${gradientClass} border shadow-2xl transition-colors duration-1000`}>
            {/* Background Effects */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 blur-[100px] rounded-full pointer-events-none group-hover:bg-indigo-400/20 transition-colors duration-700" />

            <div className="relative z-10 flex flex-col h-full justify-between">
                <div>
                    <div className="flex justify-between items-start mb-6">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 backdrop-blur-sm">
                            <Icon svg={ICONS.sparkles} className="w-3 h-3" />
                            <span className="text-[10px] uppercase tracking-widest font-bold">Recomendación IA</span>
                        </div>
                        <button onClick={onRefresh} className="text-indigo-300 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full">
                            <Icon svg={ICONS.refresh} className="w-4 h-4" />
                        </button>
                    </div>

                    <h2 className="text-3xl font-serif text-white leading-tight mb-4 drop-shadow-lg max-w-lg">
                        {nbaData.action}
                    </h2>

                    <p className="text-slate-300 text-sm leading-relaxed max-w-lg mb-8 font-light">
                        {nbaData.reason || nbaData.description}
                    </p>
                </div>

                <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
                    {/* Metrics Chips */}
                    <div className="flex flex-wrap gap-2">
                        <div className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-wider ${getDifficultyColor(nbaData.difficulty || 'media')}`}>
                            {nbaData.difficulty || 'Media'}
                        </div>
                        <div className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/50 text-slate-300 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                            <Icon svg={ICONS.clock} className="w-3 h-3" /> {nbaData.time}
                        </div>
                        <div className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/50 text-slate-300 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                            <Icon svg={ICONS.trendingUp} className="w-3 h-3 text-emerald-400" /> {nbaData.impact}
                        </div>
                    </div>

                    {/* CTA */}
                    <button
                        onClick={() => navigate(nbaData.route || '/cerebrity')}
                        className="w-full md:w-auto px-8 py-3 bg-white text-slate-900 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-indigo-50 hover:text-indigo-900 hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] flex items-center justify-center gap-2"
                    >
                        Ejecutar Ahora <Icon svg={ICONS.arrowRight} className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};
