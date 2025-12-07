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
        <div className="bg-white/60 dark:bg-slate-900/30 backdrop-blur-md rounded-2xl border border-white/20 dark:border-white/5 h-full flex flex-col overflow-hidden shadow-sm">
            {/* User Header */}
            <div className="p-6 flex flex-col items-center border-b border-white/10 dark:border-white/5 bg-gradient-to-b from-blue-50/50 to-transparent dark:from-blue-900/20 dark:to-transparent">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 p-[2px] mb-4 shadow-lg shadow-blue-500/20">
                    <div className="w-full h-full rounded-full bg-white dark:bg-slate-900 flex items-center justify-center overflow-hidden">
                        {userPhoto ? (
                            <img src={userPhoto} alt={userName} className="w-full h-full object-cover" />
                        ) : (
                            <Icon svg={ICONS.user} className="w-10 h-10 text-slate-400" />
                        )}
                    </div>
                </div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white text-center">{userName}</h3>
                <span className="inline-block mt-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-semibold tracking-wide uppercase border border-blue-200 dark:border-blue-800">
                    {level}
                </span>
            </div>

            {/* Stats Grid */}
            <div className="p-6 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
                <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Estadísticas</h4>

                    <div className="flex items-center gap-4 p-3 rounded-xl bg-white/40 dark:bg-slate-800/40 border border-white/10 dark:border-white/5 hover:bg-white/60 dark:hover:bg-slate-800/60 transition-colors">
                        <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">
                            <Icon svg={ICONS.star} className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Puntaje Total</p>
                            <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{totalScore}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 p-3 rounded-xl bg-white/40 dark:bg-slate-800/40 border border-white/10 dark:border-white/5 hover:bg-white/60 dark:hover:bg-slate-800/60 transition-colors">
                        <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                            <Icon svg={ICONS.check} className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Juegos Completados</p>
                            <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{gamesPlayed}</p>
                        </div>
                    </div>
                </div>

                {/* Achievements Preview (Placeholder) */}
                <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Logros Recientes</h4>
                    <div className="grid grid-cols-4 gap-2">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className={`aspect-square rounded-lg flex items-center justify-center border border-white/10 ${i <= 2 ? 'bg-amber-100 dark:bg-amber-900/20 text-amber-500' : 'bg-slate-100 dark:bg-slate-800/50 text-slate-300'}`}>
                                <Icon svg={ICONS.award} className="w-5 h-5" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Motivational Footer */}
            <div className="mt-auto p-6 border-t border-white/10 dark:border-white/5 bg-slate-50/50 dark:bg-slate-800/30">
                <p className="text-[10px] text-center text-slate-400 italic font-medium leading-relaxed">
                    "El conocimiento es el ingrediente secreto que transforma una bebida en una experiencia."
                </p>
            </div>
        </div>
    );
};

export default ColegiumProfileSidebar;
