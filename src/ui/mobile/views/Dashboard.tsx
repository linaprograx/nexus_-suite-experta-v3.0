import React, { useMemo } from 'react';
import { PageName, UserProfile } from '../types';
import { useApp } from '../../../context/AppContext';
import PremiumButton from '../components/PremiumButton';
import { useDashboardMetrics } from '../../../features/dashboard/useDashboardMetrics';
import { useRecipes } from '../../../hooks/useRecipes';
import { useIngredients } from '../../../hooks/useIngredients';
import { usePizarronData } from '../../../hooks/usePizarronData';
import { motion } from 'framer-motion';

interface DashboardProps {
    onNavigate: (page: PageName) => void;
    user: UserProfile;
    notify?: (message: string, type?: 'success' | 'error' | 'loading') => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate, user }) => {
    // 1. Data Hooks
    const { userProfile: globalUserProfile } = useApp(); // Get global profile
    // Merge prop with global context for PhotoURL stability, prioritizing global
    const effectiveUser = { ...user, ...globalUserProfile };
    const userPhoto = effectiveUser?.photoURL || user?.photoURL;
    const displayName = effectiveUser?.displayName || user?.name || 'Lian';
    const displayRole = effectiveUser?.role || user?.role || 'Mixologist';

    const { recipes: allRecipes } = useRecipes();
    const { ingredients: allIngredients } = useIngredients();
    const { tasks: allPizarronTasks } = usePizarronData();

    // 2. Intelligence Hook
    const {
        nba: { data: nbaData },
        kpis,
        creativeTrendData,
    } = useDashboardMetrics({
        allRecipes,
        allPizarronTasks,
        allIngredients,
        userProfile: user
    });

    return (
        <div className="px-5 pt-8 pb-32 min-h-full bg-[#F8F9FA] dark:bg-[#0f172a] transition-colors duration-500">

            {/* A. CONTEXT HEADER (Desktop Parity) */}
            <header className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-serif font-medium text-slate-900 dark:text-white leading-tight">
                        Buenas noches, <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{displayName}</span>
                    </h1>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        {displayRole} • "Servicio Estándar"
                    </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 p-[2px] shadow-lg">
                    <div className="w-full h-full rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden border-2 border-transparent">
                        {userPhoto ? (
                            <img src={userPhoto} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{displayName.charAt(0)}</span>
                        )}
                    </div>
                </div>
            </header>

            {/* B. OPERATIONAL SNAPSHOT (White Card) */}
            <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-none mb-6 border border-slate-100 dark:border-slate-700 transition-colors duration-500">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Snapshot Operativo</h3>
                <div className="grid grid-cols-2 gap-y-8 gap-x-4">
                    {/* Metric 1 */}
                    <div>
                        <h4 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">{allRecipes.length || 17}</h4>
                        <p className="text-xs font-medium text-indigo-500 dark:text-indigo-400 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">menu_book</span> Recetas
                        </p>
                    </div>
                    {/* Metric 2 */}
                    <div>
                        <h4 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">{kpis.ideasCount || 98}</h4>
                        <p className="text-xs font-medium text-amber-500 dark:text-amber-400 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">lightbulb</span> Ideas
                        </p>
                    </div>
                    {/* Metric 3 */}
                    <div className="border-t border-slate-100 dark:border-slate-700 pt-6">
                        <h4 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">33h</h4>
                        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Ahorro Tiempo</p>
                    </div>
                    {/* Metric 4 */}
                    <div className="border-t border-slate-100 dark:border-slate-700 pt-6">
                        <h4 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">85%</h4>
                        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Ritmo Creativo</p>
                    </div>
                </div>
            </div>

            {/* C. HERO AI (Purple Card - Exact Replica) */}
            <div className="relative rounded-[2rem] p-6 mb-6 overflow-hidden shadow-[0_20px_40px_-10px_rgba(79,70,229,0.3)] bg-gradient-to-br from-[#4338ca] to-[#7e22ce] text-white">
                {/* Top Label */}
                <div className="flex justify-between items-start mb-6">
                    <div className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[12px] animate-pulse text-white">auto_awesome</span>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-white">Recomendación IA</span>
                    </div>
                    <span className="material-symbols-outlined text-white/50 text-lg">refresh</span>
                </div>

                {/* Content */}
                <h2 className="text-2xl font-bold leading-tight mb-4">
                    {nbaData?.title || "Prueba y estandariza la receta 'PULSO'"}
                </h2>
                <p className="text-sm text-indigo-100 leading-relaxed mb-8 opacity-90 font-medium">
                    {nbaData?.description || "Esto iniciará el proceso de llevar recetas existentes a un estado de terminación para el menú FENÓMENO."}
                </p>

                {/* Action Bar */}
                <div className="flex items-center gap-3">
                    <div className="px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-[10px] font-bold uppercase tracking-wider">
                        Media
                    </div>
                    <div className="px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]">schedule</span> 3m
                    </div>

                    <button
                        onClick={() => onNavigate(nbaData?.actionRoute ? (nbaData.actionRoute as PageName) : PageName.CerebritySynthesis)}
                        className="flex-1 bg-white text-indigo-700 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2 shadow-lg"
                    >
                        Ejecutar <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </button>
                </div>
            </div>

            {/* D. PIZARRÓN HOY (White Card) */}
            <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-none mb-6 border border-slate-100 dark:border-slate-700 transition-colors duration-500">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pizarrón Hoy</h3>
                    <button onClick={() => onNavigate(PageName.Pizarron)} className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider hover:underline">Ver Todo</button>
                </div>

                <div className="space-y-4">
                    {/* Active Tasks or Fallback */}
                    {(allPizarronTasks.length > 0 ? allPizarronTasks.slice(0, 3) : [
                        { title: 'Low Waste Concept', status: 'urgente', label: 'Prioridad' },
                        { title: 'Margarita Clásica', status: 'desarrollo', label: 'Desarrollo' },
                        { title: 'Terminar Recetario', status: 'revision', label: 'Revisión' }
                    ]).map((task: any, i) => (
                        <div key={i} className="group">
                            <div className="flex items-center gap-3 mb-1">
                                <span className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-rose-500' : 'bg-amber-400'}`}></span>
                                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">{task.title}</h4>
                            </div>
                            <div className="pl-5 flex gap-2">
                                <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[9px] font-bold uppercase tracking-wider">
                                    {task.label || 'Tarea'}
                                </span>
                                {i === 0 && (
                                    <span className="px-2 py-0.5 bg-rose-50 text-rose-600 rounded text-[9px] font-bold uppercase tracking-wider flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[10px]">timer</span> Urgente
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <button
                    onClick={() => onNavigate(PageName.Pizarron)}
                    className="w-full mt-6 py-3 rounded-xl bg-indigo-50 text-indigo-600 text-xs font-bold uppercase tracking-widest hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2"
                >
                    <span className="material-symbols-outlined text-sm">add</span> Nueva Tarea
                </button>
            </div>

            {/* E. QUICK ACTIONS (2x2 Grid) */}
            <div className="grid grid-cols-2 gap-4 mb-8">
                {[
                    { label: 'Nueva Receta', icon: 'flask', color: 'text-emerald-500', bg: 'bg-emerald-50', route: PageName.GrimorioRecipes },
                    { label: 'Explorar', icon: 'search', color: 'text-purple-500', bg: 'bg-purple-50', route: PageName.CerebritySynthesis },
                    { label: 'Idea Rápida', icon: 'lightbulb', color: 'text-amber-500', bg: 'bg-amber-50', route: PageName.Pizarron },
                    { label: 'Analizar', icon: 'analytics', color: 'text-rose-500', bg: 'bg-rose-50', route: PageName.GrimorioStock },
                ].map((action, i) => (
                    <div
                        key={i}
                        onClick={() => onNavigate(action.route)}
                        className="bg-white p-5 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-slate-100 flex flex-col items-center justify-center gap-3 cursor-pointer active:scale-95 transition-transform"
                    >
                        <div className={`w-10 h-10 rounded-full ${action.bg} ${action.color} flex items-center justify-center`}>
                            <span className="material-symbols-outlined text-lg">{action.icon}</span>
                        </div>
                        <span className="text-xs font-bold text-slate-700">{action.label}</span>
                    </div>
                ))}
            </div>

            {/* Footer Brand */}
            <div className="flex justify-center mt-8 pb-4 opacity-30">
                <span className="text-[9px] font-serif text-slate-400 tracking-widest">NEXUS SUITE v3.0</span>
            </div>

        </div>
    );
};

export default Dashboard;
