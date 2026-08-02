import React from 'react';
import { ICONS } from '../ui/icons';
import { Icon } from '../ui/Icon';

interface ColegiumProfileSidebarProps {
    level: string;
    totalScore: number;
    gamesPlayed: number;
    perfectGames?: number;
    avgAccuracy?: number;
    bestAccuracy?: number;
    currentStreak?: number;
    masteredTopics?: number;
    userName?: string;
    userPhoto?: string | null;
}

const ColegiumProfileSidebar: React.FC<ColegiumProfileSidebarProps> = ({ level, totalScore, gamesPlayed, perfectGames = 0, avgAccuracy = 0, bestAccuracy = 0, currentStreak = 0, masteredTopics = 0, userName = "Usuario Nexus", userPhoto }) => {
    // Real achievement logic — unlocked based on actual play history, with progress
    const achievements = [
        { id: 'first', label: 'Primera Partida', icon: ICONS.play, progress: Math.min(1, gamesPlayed / 1) },
        { id: 'perfect', label: 'Puntaje Perfecto', icon: ICONS.star, progress: Math.min(1, perfectGames / 1) },
        { id: 'sharp', label: 'Precisión 80%+', icon: ICONS.check, progress: gamesPlayed >= 3 ? Math.min(1, avgAccuracy / 80) : 0 },
        { id: 'streak', label: 'Racha de 3 días', icon: ICONS.zap, progress: Math.min(1, currentStreak / 3) },
        { id: 'veteran', label: 'Veterano · 10 juegos', icon: ICONS.award, progress: Math.min(1, gamesPlayed / 10) },
        { id: 'scholar', label: 'Erudito · 50 aciertos', icon: ICONS.book, progress: Math.min(1, totalScore / 50) },
        { id: 'master', label: 'Domina 3 categorías', icon: ICONS.trendingUp, progress: Math.min(1, masteredTopics / 3) },
        { id: 'legend', label: 'Leyenda · 25 juegos', icon: ICONS.award, progress: Math.min(1, gamesPlayed / 25) },
    ];
    const unlockedCount = achievements.filter(a => a.progress >= 1).length;
    return (
        <div className="relative h-full flex flex-col overflow-hidden rounded-3xl transition-all duration-300">
            {/* Premium Glassmorphism Container */}
            <div className="absolute inset-0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl border border-white/20 dark:border-white/10 rounded-3xl shadow-2xl" />

            {/* Gradient Overlay for Depth */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent dark:from-white/5 dark:to-transparent pointer-events-none rounded-3xl" />

            {/* Content Layer */}
            <div className="relative z-10 flex flex-col h-full">
                {/* User Header with Enhanced Styling */}
                <div className="p-8 flex flex-col items-center border-b border-white/10 dark:border-white/5 bg-gradient-to-b from-indigo-500/5 to-transparent">
                    {/* Avatar Ring */}
                    <div className="relative mb-5 group cursor-pointer">
                        <div className="absolute -inset-1 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full blur opacity-60 group-hover:opacity-100 transition duration-500"></div>
                        <div className="relative w-28 h-28 rounded-full bg-slate-100 dark:bg-slate-900 p-1 shadow-xl">
                            <div className="w-full h-full rounded-full overflow-hidden relative">
                                {userPhoto ? (
                                    <img src={userPhoto} alt={userName} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-slate-200 dark:bg-slate-800">
                                        <Icon svg={ICONS.user} className="w-12 h-12 text-slate-400" />
                                    </div>
                                )}
                            </div>
                        </div>
                        {/* Status Indicator */}
                        <div className="absolute bottom-1 right-1 w-6 h-6 bg-emerald-500 border-4 border-white dark:border-slate-900 rounded-full shadow-md" title="Online"></div>
                    </div>

                    <h3 className="text-2xl font-serif text-slate-900 dark:text-white text-center tracking-tight mb-2">{userName}</h3>

                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/20 shadow-sm backdrop-blur-sm">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 text-xs font-bold tracking-widest uppercase">
                            {level}
                        </span>
                    </div>
                </div>

                {/* Stats Grid - Enhanced Layout */}
                <div className="p-8 space-y-8 flex-1 overflow-y-auto custom-scrollbar">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between mb-1">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Perfil de Habilidad</h4>
                            <Icon svg={ICONS.chart} className="w-4 h-4 text-slate-400 opacity-50" />
                        </div>

                        {/* Hero: Precisión Media with bar */}
                        <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/5 border border-indigo-500/20 shadow-sm">
                            <div className="flex items-end justify-between mb-3">
                                <div>
                                    <p className="text-[10px] font-bold text-indigo-500 dark:text-indigo-300 uppercase tracking-widest mb-1">Precisión Media</p>
                                    <p className="text-4xl font-serif text-slate-800 dark:text-white leading-none">{avgAccuracy}<span className="text-lg text-slate-400">%</span></p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[9px] text-slate-400 uppercase tracking-wider">Mejor</p>
                                    <p className="text-sm font-bold text-emerald-500 dark:text-emerald-400">{bestAccuracy}%</p>
                                </div>
                            </div>
                            <div className="h-2 w-full bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full transition-all duration-1000 ${avgAccuracy >= 80 ? 'bg-emerald-500' : avgAccuracy >= 50 ? 'bg-indigo-500' : 'bg-rose-500'}`} style={{ width: `${avgAccuracy}%` }} />
                            </div>
                        </div>

                        {/* Compact stat trio */}
                        <div className="grid grid-cols-3 gap-2">
                            <div className="p-3 rounded-xl bg-white/50 dark:bg-slate-800/50 border border-white/40 dark:border-white/10 text-center">
                                <Icon svg={ICONS.check} className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
                                <p className="text-lg font-bold text-slate-800 dark:text-white leading-none">{totalScore.toLocaleString()}</p>
                                <p className="text-[8px] text-slate-400 uppercase tracking-wider mt-1">Aciertos</p>
                            </div>
                            <div className="p-3 rounded-xl bg-white/50 dark:bg-slate-800/50 border border-white/40 dark:border-white/10 text-center">
                                <Icon svg={ICONS.trendingUp} className="w-4 h-4 text-indigo-500 mx-auto mb-1" />
                                <p className="text-lg font-bold text-slate-800 dark:text-white leading-none">{masteredTopics}</p>
                                <p className="text-[8px] text-slate-400 uppercase tracking-wider mt-1">Dominadas</p>
                            </div>
                            <div className="p-3 rounded-xl bg-white/50 dark:bg-slate-800/50 border border-white/40 dark:border-white/10 text-center">
                                <span className="text-sm leading-none block mb-1">{currentStreak > 0 ? '🔥' : '💤'}</span>
                                <p className="text-lg font-bold text-slate-800 dark:text-white leading-none">{currentStreak}</p>
                                <p className="text-[8px] text-slate-400 uppercase tracking-wider mt-1">Racha</p>
                            </div>
                        </div>
                    </div>

                    {/* Achievements Section */}
                    <div className="pt-6 border-t border-white/10 dark:border-white/5">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Insignias</h4>
                            <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 rounded-full">{unlockedCount}/{achievements.length}</span>
                        </div>

                        <div className="grid grid-cols-4 gap-3">
                            {achievements.map((a) => {
                                const unlocked = a.progress >= 1;
                                const pct = Math.round(a.progress * 100);
                                return (
                                    <div
                                        key={a.id}
                                        title={`${a.label} — ${unlocked ? 'Desbloqueado ✓' : `${pct}%`}`}
                                        className={`relative aspect-square rounded-xl flex items-center justify-center border transition-transform cursor-help shadow-sm overflow-hidden ${unlocked
                                            ? 'border-amber-400/40 bg-gradient-to-br from-amber-400/20 to-amber-500/5 hover:scale-105'
                                            : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03]'}`}
                                    >
                                        <Icon svg={a.icon} className={`w-6 h-6 relative z-10 ${unlocked ? 'text-amber-500 drop-shadow-sm' : 'text-slate-300 dark:text-slate-600'}`} />
                                        {/* Progress fill for locked badges */}
                                        {!unlocked && a.progress > 0 && (
                                            <div className="absolute bottom-0 left-0 right-0 bg-indigo-500/20" style={{ height: `${pct}%` }} />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Footer Quote */}
                <div className="mt-auto p-6 bg-white/30 dark:bg-black/20 border-t border-white/10 backdrop-blur-sm">
                    <p className="text-xs text-center text-slate-500 dark:text-slate-400 italic font-medium leading-relaxed opacity-80">
                        "El dominio no es un destino, es un viaje continuo de refinamiento."
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ColegiumProfileSidebar;
