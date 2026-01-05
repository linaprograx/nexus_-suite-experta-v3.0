import React from 'react';
import { ICONS } from '../ui/icons';
import { Icon } from '../ui/Icon';

interface ColegiumProfileSidebarProps {
    level: string;
    totalScore: number;
    gamesPlayed: number;
    userName?: string;
    userPhoto?: string | null;
}

const ColegiumProfileSidebar: React.FC<ColegiumProfileSidebarProps> = ({ level, totalScore, gamesPlayed, userName = "Usuario Nexus", userPhoto }) => {
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
                    <div className="space-y-6">
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Rendimiento</h4>
                            <Icon svg={ICONS.chart} className="w-4 h-4 text-slate-400 opacity-50" />
                        </div>

                        {/* Stat Card 1 */}
                        <div className="group relative p-4 rounded-2xl bg-white/50 dark:bg-slate-800/50 border border-white/40 dark:border-white/10 hover:bg-white/70 dark:hover:bg-slate-800/70 transition-all duration-300 shadow-sm hover:shadow-md">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-orange-500/20 group-hover:scale-110 transition-transform duration-300">
                                    <Icon svg={ICONS.star} className="w-6 h-6" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Puntaje Total</p>
                                    <p className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">{totalScore.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>

                        {/* Stat Card 2 */}
                        <div className="group relative p-4 rounded-2xl bg-white/50 dark:bg-slate-800/50 border border-white/40 dark:border-white/10 hover:bg-white/70 dark:hover:bg-slate-800/70 transition-all duration-300 shadow-sm hover:shadow-md">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform duration-300">
                                    <Icon svg={ICONS.check} className="w-6 h-6" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Juegos</p>
                                    <p className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">{gamesPlayed}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Achievements Section */}
                    <div className="pt-6 border-t border-white/10 dark:border-white/5">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Insignias</h4>
                            <span className="text-[10px] font-semibold text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 rounded-full cursor-pointer hover:bg-indigo-100 transition-colors">Ver todas</span>
                        </div>

                        <div className="grid grid-cols-4 gap-3">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="aspect-square rounded-xl flex items-center justify-center border border-white/20 dark:border-white/10 bg-gradient-to-br from-white/40 to-white/10 dark:from-white/5 dark:to-transparent hover:scale-105 transition-transform cursor-pointer shadow-sm group">
                                    <Icon svg={ICONS.award} className={`w-6 h-6 ${i <= 2 ? 'text-amber-500 drop-shadow-sm' : 'text-slate-300 opacity-50'}`} />
                                </div>
                            ))}
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
