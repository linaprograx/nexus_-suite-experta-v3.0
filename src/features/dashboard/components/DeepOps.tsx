import React from 'react';
import { Icon } from '../../../components/ui/Icon';
import { ICONS } from '../../../components/ui/icons';

interface DeepOpsProps {
    // We can extend this with real props later
}

export const DeepOps: React.FC<DeepOpsProps> = () => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
            {/* 1. Key Metrics */}
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-[24px] p-6 border border-indigo-500/50 shadow-[0_0_15px_-3px_rgba(99,102,241,0.25),_0_20px_40px_-5px_rgba(0,0,0,0.1)] dark:shadow-[0_0_25px_-5px_rgba(99,102,241,0.4),_0_20px_50px_-12px_rgba(0,0,0,0.6)] hover:shadow-[0_0_30px_-5px_rgba(99,102,241,0.4),_0_25px_60px_-12px_rgba(0,0,0,0.2)] dark:hover:shadow-[0_0_40px_-5px_rgba(99,102,241,0.6),_0_25px_60px_-12px_rgba(0,0,0,0.7)] transition-all duration-500 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                <h3 className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Icon svg={ICONS.activity} className="w-3 h-3 text-indigo-500" /> Métricas de Flujo
                </h3>
                <div className="space-y-4">
                    {[
                        { label: 'Ritmo Creativo', val: '92%', trend: '+4%', color: 'text-emerald-500' },
                        { label: 'Ratio Idea → Ejecución', val: '3.5', trend: 'Optimo', color: 'text-indigo-500' },
                        { label: 'Enfoque Activo', val: '5.2h', trend: '-20m', color: 'text-amber-500' }
                    ].map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center group">
                            <span className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200 transition-colors">{item.label}</span>
                            <div className="flex items-center gap-3">
                                <span className={`text-xs font-bold ${item.color}`}>{item.trend}</span>
                                <span className="text-sm font-bold text-gray-800 dark:text-white">{item.val}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 2. System Status */}
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-[24px] p-6 border border-indigo-500/50 shadow-[0_0_15px_-3px_rgba(99,102,241,0.25),_0_20px_40px_-5px_rgba(0,0,0,0.1)] dark:shadow-[0_0_25px_-5px_rgba(99,102,241,0.4),_0_20px_50px_-12px_rgba(0,0,0,0.6)] hover:shadow-[0_0_30px_-5px_rgba(99,102,241,0.4),_0_25px_60px_-12px_rgba(0,0,0,0.2)] dark:hover:shadow-[0_0_40px_-5px_rgba(99,102,241,0.6),_0_25px_60px_-12px_rgba(0,0,0,0.7)] transition-all duration-500 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                <h3 className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Icon svg={ICONS.cpu} className="w-3 h-3 text-rose-500" /> Estado del Sistema
                </h3>
                <div className="grid grid-cols-2 gap-3">
                    {[
                        { label: 'Producción', status: 'Nominal', color: 'bg-emerald-500' },
                        { label: 'Creatividad', status: 'Peak', color: 'bg-indigo-500' },
                        { label: 'Aprendizaje', status: 'Activo', color: 'bg-amber-500' },
                        { label: 'Rentabilidad', status: 'Estable', color: 'bg-emerald-500' }
                    ].map((item, idx) => (
                        <div key={idx} className="bg-gray-50 dark:bg-white/5 rounded-xl p-3 flex flex-col items-center justify-center text-center hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                            <div className={`w-1.5 h-1.5 rounded-full ${item.color} mb-2 shadow-[0_0_8px_currentColor]`} />
                            <span className="text-[10px] uppercase text-gray-400 tracking-wider mb-0.5">{item.label}</span>
                            <span className="text-xs font-bold text-gray-700 dark:text-gray-200">{item.status}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* 3. Activity Timeline */}
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-[24px] p-6 border border-indigo-500/50 shadow-[0_0_15px_-3px_rgba(99,102,241,0.25),_0_20px_40px_-5px_rgba(0,0,0,0.1)] dark:shadow-[0_0_25px_-5px_rgba(99,102,241,0.4),_0_20px_50px_-12px_rgba(0,0,0,0.6)] hover:shadow-[0_0_30px_-5px_rgba(99,102,241,0.4),_0_25px_60px_-12px_rgba(0,0,0,0.2)] dark:hover:shadow-[0_0_40px_-5px_rgba(99,102,241,0.6),_0_25px_60px_-12px_rgba(0,0,0,0.7)] transition-all duration-500 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                <h3 className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Icon svg={ICONS.clock} className="w-3 h-3 text-amber-500" /> Línea de Tiempo
                </h3>
                <div className="relative space-y-4 pl-2">
                    {/* Vertical Line */}
                    <div className="absolute top-2 bottom-2 left-3.5 w-[1px] bg-gray-200 dark:bg-slate-700" />

                    {[
                        { time: '10:00', event: 'Sesión Creativa', type: 'idea' },
                        { time: '13:30', event: 'Stock Update', type: 'system' },
                        { time: '15:45', event: 'Receta Aprobada', type: 'success' }
                    ].map((item, idx) => (
                        <div key={idx} className="relative flex items-center gap-3">
                            <div className={`relative z-10 w-3 h-3 rounded-full border-2 border-white dark:border-slate-800 flex-shrink-0 
                                ${item.type === 'idea' ? 'bg-indigo-500' : item.type === 'success' ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                            <div className="flex-1 flex justify-between items-center bg-gray-50/50 dark:bg-white/5 rounded-lg px-3 py-2">
                                <span className="text-xs text-gray-800 dark:text-gray-300 font-medium">{item.event}</span>
                                <span className="text-[10px] text-gray-400 font-mono">{item.time}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
