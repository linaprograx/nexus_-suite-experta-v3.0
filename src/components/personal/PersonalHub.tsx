import React from 'react';
import { Card } from '../ui/Card';
import { Icon } from '../ui/Icon';
import { ICONS } from '../ui/icons';
import { useNavigate } from 'react-router-dom';

interface PersonalHubProps {
    stats: {
        recipes: number;
        avgScore: number;
        ideas: number;
    };
}

import { useCapabilities } from '../../context/AppContext';

export const PersonalHub: React.FC<PersonalHubProps> = ({ stats }) => {
    const { currentPlan } = useCapabilities();
    const navigate = useNavigate();

    return (
        <div className="h-full overflow-y-auto custom-scrollbar p-1 space-y-6">
            {/* Nexus ID Card (Epicenter) - Dynamic Styling */}
            <div className={`relative overflow-hidden rounded-3xl text-white p-8 min-h-[300px] flex flex-col justify-between group transition-all duration-500
                ${(currentPlan?.name && (currentPlan.name.toUpperCase().includes('EXPERT') || currentPlan.name.toUpperCase().includes('JUPITER')))
                    ? 'bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-fuchsia-900 to-slate-900 shadow-[0_0_40px_rgba(192,38,211,0.6)] ring-1 ring-fuchsia-500'
                    : 'bg-[linear-gradient(135deg,#C1005B_0%,#E83A8A_50%,#FF9BCB_100%)] shadow-[0_20px_50px_rgba(232,58,138,0.3),inset_0_2px_4px_rgba(255,255,255,0.3)]'
                }`}>

                {/* Background Effects */}
                {(currentPlan?.name && (currentPlan.name.toUpperCase().includes('EXPERT') || currentPlan.name.toUpperCase().includes('JUPITER'))) ? (
                    <>
                        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-fuchsia-500/20 rounded-full blur-[120px] pointer-events-none mix-blend-screen"></div>
                        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none"></div>
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
                    </>
                ) : (
                    <>
                        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-indigo-500 rounded-full filter blur-[100px] opacity-30 group-hover:opacity-40 transition-opacity duration-1000"></div>
                        <div className="absolute bottom-0 left-0 w-[200px] h-[200px] bg-purple-500 rounded-full filter blur-[80px] opacity-20 group-hover:opacity-30 transition-opacity duration-1000"></div>
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150"></div>
                    </>
                )}

                <div className="relative z-10 flex justify-between items-start">
                    <div>
                        <h1 className="text-sm font-mono opacity-80 tracking-[0.3em] mb-2 text-white/80">NEXUS ID</h1>
                        <p className="text-4xl font-black tracking-tight uppercase drop-shadow-sm">
                            {(currentPlan?.name && (currentPlan.name.toUpperCase().includes('EXPERT') || currentPlan.name.toUpperCase().includes('JUPITER'))) ? 'JUPITER INTERNAL PASS' : (currentPlan?.name || 'MEMBER PASS')}
                        </p>
                    </div>
                    <div className="p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 shadow-xl">
                        <Icon svg={ICONS.cpu} className="w-8 h-8 text-white" />
                    </div>
                </div>

                <div className="relative z-10 mt-8 grid grid-cols-3 gap-8">
                    <div>
                        <span className="block text-[10px] font-bold text-white/70 uppercase tracking-widest mb-1">Recipes</span>
                        <span className="text-3xl font-bold tracking-tight text-white">{stats.recipes}</span>
                    </div>
                    <div>
                        <span className="block text-[10px] font-bold text-white/70 uppercase tracking-widest mb-1">Avg. Score</span>
                        <span className="text-3xl font-bold text-emerald-200 drop-shadow-[0_0_10px_rgba(110,231,183,0.5)]">{stats.avgScore}%</span>
                    </div>
                    <div>
                        <span className="block text-[10px] font-bold text-white/70 uppercase tracking-widest mb-1">Contribution</span>
                        <span className="text-3xl font-bold text-purple-200 drop-shadow-[0_0_10px_rgba(167,139,250,0.5)]">{stats.ideas}</span>
                    </div>
                </div>

                <div className="relative z-10 font-mono text-xs text-white/50 mt-8 flex justify-between items-end">
                    <div className="flex items-center gap-3">
                        <span className="font-mono text-[10px] opacity-60 tracking-wider">ID: 884-291-NEX</span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border flex items-center gap-1
                            ${(currentPlan?.name && (currentPlan.name.toUpperCase().includes('EXPERT') || currentPlan.name.toUpperCase().includes('JUPITER')))
                                ? 'border-cyan-500/50 bg-cyan-500/20 text-cyan-200 shadow-[0_0_15px_rgba(34,211,238,0.3)]'
                                : 'border-white/20 bg-white/10 backdrop-blur-md text-white'
                            }`}>
                            {(currentPlan?.name && (currentPlan.name.toUpperCase().includes('EXPERT') || currentPlan.name.toUpperCase().includes('JUPITER'))) && <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_5px_cyan]" />}
                            {currentPlan?.name || 'MEMBER'}
                        </span>
                    </div>
                    <span className="px-2 py-1 bg-white/10 border border-white/20 rounded text-[10px] font-bold tracking-widest text-white/80">VERIFIED</span>
                </div>
            </div>

            {/* Recent Activity / Timeline Placeholder */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-6 bg-transparent ring-1 ring-slate-200 dark:ring-slate-800 hover:ring-pink-500/50 transition-all">
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



                <Card className="p-6 bg-transparent ring-1 ring-slate-200 dark:ring-slate-800 hover:ring-pink-500/50 transition-all">
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Smart Actions (Replaces Quick Tools) */}
                <Card className="md:col-span-1 p-6 bg-transparent ring-1 ring-slate-200 dark:ring-slate-800 hover:ring-pink-500/50 transition-all flex flex-col">
                    <h3 className="font-bold mb-4 flex items-center gap-2 text-indigo-400">
                        <Icon svg={ICONS.zap} className="w-4 h-4" />
                        Acciones Estratégicas
                    </h3>
                    <div className="space-y-3 flex-1 flex flex-col justify-center">
                        <button
                            onClick={() => navigate('/grimorium')}
                            className="w-full text-left p-2 rounded-lg hover:bg-white/5 group transition-colors flex items-center gap-3"
                        >
                            <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                                <Icon svg={ICONS.refresh || ICONS.activity} className="w-4 h-4" />
                            </div>
                            <div>
                                <span className="block text-xs font-bold text-slate-700 dark:text-slate-300">Auditoría de Stock</span>
                                <span className="text-[10px] text-slate-400">Hace 3 días</span>
                            </div>
                        </button>
                        <button
                            onClick={() => navigate('/cerebrity', { state: { tab: 'makeMenu' } })}
                            className="w-full text-left p-2 rounded-lg hover:bg-white/5 group transition-colors flex items-center gap-3"
                        >
                            <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all">
                                <Icon svg={ICONS.calendar} className="w-4 h-4" />
                            </div>
                            <div>
                                <span className="block text-xs font-bold text-slate-700 dark:text-slate-300">Planificar Menú</span>
                                <span className="text-[10px] text-slate-400">Semana 42</span>
                            </div>
                        </button>
                    </div>
                </Card>

                {/* Editable Daily Tip / Mantra */}
                <MantraCard />
            </div>
        </div >
    );
};

// Extracted for cleaner state
const MantraCard = () => {
    const [isEditing, setIsEditing] = React.useState(false);
    const [mantra, setMantra] = React.useState("El hielo es el alma del cóctel. Nunca subestimes la importancia de la dilución controlada y la temperatura perfecta.");
    const [author, setAuthor] = React.useState("John Doe, Master Mixologist");

    return (
        <Card
            className="md:col-span-2 p-6 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-fuchsia-900 to-slate-900 text-white relative overflow-hidden shadow-[0_0_40px_rgba(192,38,211,0.5)] ring-1 ring-fuchsia-500/50 cursor-pointer group"
            onClick={() => !isEditing && setIsEditing(true)}
        >
            <div className="absolute right-0 top-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2"></div>

            {/* Edit Hint */}
            {!isEditing && (
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[10px] font-bold uppercase bg-white/20 px-2 py-1 rounded backdrop-blur-md">Editar Frase</span>
                </div>
            )}

            <div className="relative z-10 flex flex-col h-full justify-center">
                <div className="flex items-center gap-2 mb-2 text-yellow-400">
                    <Icon svg={ICONS.star} className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Tip del Maestro</span>
                </div>

                {isEditing ? (
                    <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                        <textarea
                            value={mantra}
                            onChange={(e) => setMantra(e.target.value)}
                            className="w-full bg-white/10 border border-white/20 rounded-lg p-3 text-lg font-light italic text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/40 h-24 resize-none"
                            autoFocus
                        />
                        <div className="flex justify-between items-center">
                            <input
                                value={author}
                                onChange={(e) => setAuthor(e.target.value)}
                                className="bg-transparent border-b border-white/20 text-xs text-white/80 focus:outline-none focus:border-white w-1/2"
                            />
                            <button
                                onClick={(e) => { e.stopPropagation(); setIsEditing(false); }}
                                className="px-3 py-1 bg-white text-pink-600 rounded-full text-xs font-bold shadow-lg"
                            >
                                Guardar
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <p className="text-lg italic font-light leading-relaxed opacity-90">
                            "{mantra}"
                        </p>
                        <div className="mt-4 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">JD</div>
                            <span className="text-xs opacity-60">{author}</span>
                        </div>
                    </>
                )}
            </div>
        </Card>
    );
};
