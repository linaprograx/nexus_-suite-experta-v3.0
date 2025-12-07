import React from 'react';
import { Card } from '../ui/Card';
import { Icon } from '../ui/Icon';
import { ICONS } from '../ui/icons';

interface PersonalHubProps {
    stats: {
        recipes: number;
        avgScore: number;
        ideas: number;
    };
}

export const PersonalHub: React.FC<PersonalHubProps> = ({ stats }) => {
    return (
        <div className="h-full overflow-y-auto custom-scrollbar p-1 space-y-6">
            {/* Nexus ID Card (Epicenter) */}
            <div className="relative overflow-hidden rounded-3xl bg-slate-900 text-white shadow-2xl p-8 min-h-[300px] flex flex-col justify-between group">
                {/* Background Effects */}
                <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-indigo-500 rounded-full filter blur-[100px] opacity-30 group-hover:opacity-40 transition-opacity duration-1000"></div>
                <div className="absolute bottom-0 left-0 w-[200px] h-[200px] bg-purple-500 rounded-full filter blur-[80px] opacity-20 group-hover:opacity-30 transition-opacity duration-1000"></div>
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150"></div>

                <div className="relative z-10 flex justify-between items-start">
                    <div>
                        <h1 className="text-lg font-mono text-indigo-300 tracking-[0.2em] mb-1">NEXUS ID</h1>
                        <p className="text-4xl font-bold tracking-tight">MEMBER PASS</p>
                    </div>
                    <Icon svg={ICONS.cpu} className="w-10 h-10 text-white/50" />
                </div>

                <div className="relative z-10 mt-8 grid grid-cols-3 gap-8">
                    <div>
                        <span className="block text-xs text-slate-400 uppercase tracking-wider mb-1">Recipes</span>
                        <span className="text-3xl font-bold">{stats.recipes}</span>
                    </div>
                    <div>
                        <span className="block text-xs text-slate-400 uppercase tracking-wider mb-1">Avg. Score</span>
                        <span className="text-3xl font-bold text-emerald-400">{stats.avgScore}%</span>
                    </div>
                    <div>
                        <span className="block text-xs text-slate-400 uppercase tracking-wider mb-1">Contribution</span>
                        <span className="text-3xl font-bold text-purple-400">{stats.ideas}</span>
                    </div>
                </div>

                <div className="relative z-10 font-mono text-xs text-white/30 mt-8 flex justify-between items-end">
                    <span>ID: 884-291-NEX</span>
                    <span className="px-2 py-1 bg-white/10 rounded">VERIFIED</span>
                </div>
            </div>

            {/* Recent Activity / Timeline Placeholder */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-6 border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-lg bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400">
                            <Icon svg={ICONS.activity} className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold">Actividad Reciente</h3>
                    </div>
                    <div className="space-y-4">
                        <div className="flex gap-3 text-sm">
                            <div className="w-1 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                            <div>
                                <p className="font-medium text-slate-800 dark:text-slate-200">Creó receta "Blue Lagoon"</p>
                                <p className="text-xs text-slate-400">Hace 2 horas</p>
                            </div>
                        </div>
                        <div className="flex gap-3 text-sm">
                            <div className="w-1 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                            <div>
                                <p className="font-medium text-slate-800 dark:text-slate-200">Completó "Speed Run"</p>
                                <p className="text-xs text-slate-400">Ayer</p>
                            </div>
                        </div>
                    </div>
                </Card>

                <Card className="p-6 border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                            <Icon svg={ICONS.award} className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold">Logros Próximos</h3>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between text-xs mb-1">
                                <span>Maestro del Gin</span>
                                <span>8/10</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 w-[80%] rounded-full"></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-xs mb-1">
                                <span>Creador Frecuente</span>
                                <span>15/20</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-green-500 w-[75%] rounded-full"></div>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Expanded Content: Tools & Daily Inspiration */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Quick Tools */}
                <Card className="md:col-span-1 p-6 border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
                    <h3 className="font-bold mb-4 flex items-center gap-2">
                        <Icon svg={ICONS.grid} className="w-4 h-4 text-indigo-500" />
                        Accesos Rápidos
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                        <button className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition-colors flex flex-col items-center justify-center gap-2">
                            <Icon svg={ICONS.plus} className="w-5 h-5" />
                            <span className="text-[10px] font-bold uppercase">Receta</span>
                        </button>
                        <button className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 transition-colors flex flex-col items-center justify-center gap-2">
                            <Icon svg={ICONS.calculator} className="w-5 h-5" />
                            <span className="text-[10px] font-bold uppercase">Escandallo</span>
                        </button>
                        <button className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 hover:bg-amber-100 transition-colors flex flex-col items-center justify-center gap-2">
                            <Icon svg={ICONS.book} className="w-5 h-5" />
                            <span className="text-[10px] font-bold uppercase">Menú</span>
                        </button>
                        <button className="p-3 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 hover:bg-purple-100 transition-colors flex flex-col items-center justify-center gap-2">
                            <Icon svg={ICONS.camera} className="w-5 h-5" />
                            <span className="text-[10px] font-bold uppercase">Scan</span>
                        </button>
                    </div>
                </Card>

                {/* Daily Tip / Inspiration */}
                <Card className="md:col-span-2 p-6 border-slate-200 dark:border-slate-800 bg-gradient-to-r from-slate-900 to-slate-800 text-white relative overflow-hidden">
                    <div className="absolute right-0 top-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2"></div>
                    <div className="relative z-10 flex flex-col h-full justify-center">
                        <div className="flex items-center gap-2 mb-2 text-yellow-400">
                            <Icon svg={ICONS.star} className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-wider">Tip del Maestro</span>
                        </div>
                        <p className="text-lg italic font-light leading-relaxed opacity-90">
                            "El hielo es el alma del cóctel. Nunca subestimes la importancia de la dilución controlada y la temperatura perfecta."
                        </p>
                        <div className="mt-4 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">JD</div>
                            <span className="text-xs opacity-60">John Doe, Master Mixologist</span>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};
