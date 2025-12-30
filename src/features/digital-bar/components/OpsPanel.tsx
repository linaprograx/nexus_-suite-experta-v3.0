import React, { useState, useMemo, useEffect, useRef } from 'react';
import { BarArea, BarWorker } from '../scene/digitalBarTypes';
import { Icon } from '../../../components/ui/Icon';
import { ICONS } from '../../../components/ui/icons';
import { DigitalBarService } from '../web/DigitalBarService';
import { soundEngine } from '../../avatar/soundEngine';

interface DigitalBarContextPanelProps {
    selectedArea: BarArea | undefined;
    workers: BarWorker[];
}

export const OpsPanel: React.FC<DigitalBarContextPanelProps> = ({ selectedArea, workers }) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'ops' | 'team' | 'insights'>('overview');
    const prevLoadRef = useRef(selectedArea?.stats.load || 0);

    // Watch for high load
    useEffect(() => {
        if (selectedArea) {
            if (selectedArea.stats.load > 80 && prevLoadRef.current <= 80) {
                soundEngine.playAlertSoft();
            }
            prevLoadRef.current = selectedArea.stats.load;
        }
    }, [selectedArea?.stats.load]);

    // Hoisted hooks to prevent "Rendered more hooks" error
    const areaWorkers = useMemo(() => {
        if (!selectedArea) return [];
        return workers.filter(w => w.areaId === selectedArea.id);
    }, [selectedArea, workers]);

    const insights = useMemo(() => {
        if (!selectedArea) return [];
        return DigitalBarService.getDigitalBarInsights({ areas: [selectedArea] });
    }, [selectedArea]);

    if (!selectedArea) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800/50 flex items-center justify-center mb-6 shadow-inner">
                    <Icon svg={ICONS.map} className="w-8 h-8 opacity-30" />
                </div>
                <h3 className="text-sm font-black uppercase tracking-widest mb-2">Selecciona un Área</h3>
                <p className="text-xs max-w-[200px] leading-relaxed opacity-70">Haz clic en los bloques isométricos para inspeccionar operaciones.</p>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-xl animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Header */}
            <div className="p-6 pb-2">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <span className={`p-2 rounded-lg bg-gradient-to-br ${getAreaGradient(selectedArea.type)} shadow-lg`}>
                                <Icon svg={ICONS[selectedArea.icon as keyof typeof ICONS] || ICONS.activity} className="w-5 h-5 text-white" />
                            </span>
                            <div>
                                <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight leading-none">
                                    {selectedArea.name}
                                </h2>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{selectedArea.type} Unit</span>
                            </div>
                        </div>
                    </div>
                    <span className={`
                        px-3 py-1 rounded-full text-[10px] font-black uppercase border shadow-sm
                        ${selectedArea.stats.load > 80 ? 'bg-rose-50 text-rose-600 border-rose-200 animate-pulse' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}
                    `}>
                        {selectedArea.stats.load > 80 ? 'Sobrecarga' : 'Óptimo'}
                    </span>
                </div>

                {/* KPI Cards - Uniform Grid */}
                <div className="grid grid-cols-4 gap-3 mb-6">
                    <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col justify-between h-[80px] hover:shadow-md transition-shadow group">
                        <div className="flex items-center gap-1.5 text-slate-400">
                            <Icon svg={ICONS.activity} className="w-3 h-3 group-hover:text-cyan-500 transition-colors" />
                            <span className="text-[9px] font-bold uppercase tracking-wide">Carga</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-lg font-black text-slate-700 dark:text-slate-200 leading-none">{selectedArea.stats.load}%</span>
                            <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-slate-500 transition-all duration-500" style={{ width: `${selectedArea.stats.load}%` }} />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col justify-between h-[80px] hover:shadow-md transition-shadow group">
                        <div className="flex items-center gap-1.5 text-slate-400">
                            <Icon svg={ICONS.fileText} className="w-3 h-3 group-hover:text-cyan-500 transition-colors" />
                            <span className="text-[9px] font-bold uppercase tracking-wide">Tckts</span>
                        </div>
                        <span className="text-lg font-black text-cyan-500 leading-none">{selectedArea.stats.activeTickets}</span>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col justify-between h-[80px] hover:shadow-md transition-shadow group">
                        <div className="flex items-center gap-1.5 text-slate-400">
                            <Icon svg={ICONS.alertCircle} className="w-3 h-3 group-hover:text-orange-500 transition-colors" />
                            <span className="text-[9px] font-bold uppercase tracking-wide">Stress</span>
                        </div>
                        <span className={`text-lg font-black leading-none ${areaWorkers.some(w => w.stressLevel > 70) ? 'text-red-500' : 'text-orange-500'}`}>
                            {Math.round(areaWorkers.reduce((acc, w) => acc + w.stressLevel, 0) / (areaWorkers.length || 1))}%
                        </span>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col justify-between h-[80px] hover:shadow-md transition-shadow group">
                        <div className="flex items-center gap-1.5 text-slate-400">
                            <Icon svg={ICONS.zap} className="w-3 h-3 group-hover:text-emerald-500 transition-colors" />
                            <span className="text-[9px] font-bold uppercase tracking-wide">Efic.</span>
                        </div>
                        <span className="text-lg font-black text-emerald-500 leading-none">{selectedArea.stats.efficiency}%</span>
                    </div>
                </div>

                {/* Styled Pills Tabs */}
                <div className="flex gap-1 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl">
                    {['overview', 'ops', 'team', 'insights'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => {
                                setActiveTab(tab as any);
                                soundEngine.playClickSoft();
                            }}
                            className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all ${activeTab === tab
                                ? 'bg-white text-slate-900 shadow-sm scale-100'
                                : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
                                }`}
                        >
                            {tab === 'insights' ? 'AI' : tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* Scrollable Content */}
            <div className={`flex-1 overflow-y-auto p-6 pt-2 custom-scrollbar`}>

                {activeTab === 'overview' && (
                    <div className="space-y-6 animate-in slide-in-from-bottom-4 fade-in duration-500">
                        {/* Area Description Stub */}
                        <p className="text-xs text-slate-500 leading-relaxed">
                            Monitorización en tiempo real de la zona {selectedArea.name}. El rendimiento actual es del {selectedArea.stats.efficiency}%.
                        </p>

                        {/* IA Timeline (Event Log) */}
                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
                            <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-3 flex items-center gap-2">
                                <Icon svg={ICONS.list} className="w-3 h-3" />
                                IA Event Log
                            </h4>
                            <div className="space-y-2">
                                {[
                                    { time: '10:42', text: `${selectedArea.name} superó carga del 80%`, type: 'warning' },
                                    { time: '10:30', text: 'Inventario de cítricos reabastecido', type: 'info' },
                                    { time: '09:15', text: 'Inicio de turno: Equipo completo', type: 'success' }
                                ].map((event, i) => (
                                    <div
                                        key={i}
                                        className="flex gap-3 text-[10px] p-2 hover:bg-white/50 rounded-lg transition-colors cursor-default"
                                        style={{ animationDelay: `${i * 100}ms` }}
                                    >
                                        <span className="font-mono text-slate-400">{event.time}</span>
                                        <span className={`font-medium ${event.type === 'warning' ? 'text-amber-600' :
                                            event.type === 'success' ? 'text-emerald-600' :
                                                'text-slate-600'
                                            }`}>
                                            {event.text}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Recent Alerts mock */}
                        <div>
                            <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">Alertas Recientes</h4>
                            <div className="space-y-2">
                                <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
                                    <span className="text-[10px] text-slate-600 dark:text-slate-300">Stock bajo en <b>Limones</b> detectado hace 10m.</span>
                                </div>
                                <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-emerald-400" />
                                    <span className="text-[10px] text-slate-600 dark:text-slate-300">Eficiencia subió un <b>12%</b> en la última hora.</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* NEXUS INSIGHTS TAB */}
                {activeTab === 'insights' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="bg-violet-50 dark:bg-violet-900/10 p-5 rounded-xl border border-violet-100 dark:border-violet-800 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-5">
                                <Icon svg={ICONS.brain} className="w-32 h-32" />
                            </div>

                            <h3 className="text-sm font-black text-violet-800 dark:text-violet-300 uppercase tracking-wide mb-4 flex items-center gap-2">
                                <Icon svg={ICONS.brain} className="w-5 h-5" />
                                Análisis Inteligente
                            </h3>

                            <ul className="space-y-3 relative z-10">
                                {insights.map((insight: string, idx: number) => (
                                    <li key={idx} className="flex gap-3 text-xs text-violet-900 dark:text-violet-200 bg-white/50 dark:bg-slate-900/40 p-3 rounded-lg border border-violet-100/50">
                                        <Icon svg={ICONS.sparkles} className="w-4 h-4 text-violet-500 shrink-0 mt-0.5" />
                                        <span className="leading-relaxed">{insight}</span>
                                    </li>
                                ))}
                            </ul>

                            {insights.length === 0 && (
                                <p className="text-xs text-slate-400 italic">No hay suficientes datos para generar insights operativos en este momento.</p>
                            )}
                        </div>

                        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50">
                            <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-3">Sugerencias de Optimización</h4>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                                    <span>Redistribución de Personal</span>
                                    <span className="font-bold text-emerald-500">Alta Prioridad</span>
                                </div>
                                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                    <div className="bg-emerald-500 w-[85%] h-full rounded-full" />
                                </div>
                                <p className="text-[10px] text-slate-400 mt-1">Se recomienda mover 1 barback de Prep Room a Barra Principal.</p>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'team' && (
                    <div className="space-y-3">
                        {areaWorkers.map(worker => (
                            <div key={worker.id} className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm group hover:border-cyan-200 transition-colors cursor-pointer">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-[10px] font-black text-slate-600 shadow-inner">
                                            {worker.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{worker.name}</p>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase">{worker.role}</p>
                                        </div>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${worker.activity === 'idle' ? 'bg-slate-100 text-slate-400' : 'bg-green-100 text-green-600'}`}>
                                        {worker.activity}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase w-12">Estrés</span>
                                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ${worker.stressLevel > 70 ? 'bg-red-500' : 'bg-cyan-500'}`}
                                            style={{ width: `${worker.stressLevel}%` }}
                                        />
                                    </div>
                                    <span className="text-[9px] font-mono text-slate-500">{Math.round(worker.stressLevel)}%</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'ops' && (
                    <div className="space-y-4">
                        {/* Mock operations data - simulating integration */}
                        <div>
                            <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center justify-between">
                                Recetas Activas <span className="text-cyan-500">3</span>
                            </h4>
                            <div className="space-y-2">
                                {['Mojito Clásico', 'Old Fashioned', 'Espresso Martini'].map((drink, i) => (
                                    <div key={i} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/50 border border-transparent hover:border-slate-100 transition-all cursor-pointer">
                                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{drink}</span>
                                        <Icon svg={ICONS.chevronRight} className="w-3 h-3 text-slate-300" />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                            <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">Acciones Rápidas</h4>
                            <div className="grid grid-cols-2 gap-2">
                                <button className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] font-bold text-slate-600 hover:bg-slate-50 transition-colors flex flex-col items-center gap-2 text-center">
                                    <Icon svg={ICONS.book} className="w-4 h-4 text-amber-500" />
                                    Ver Recetas
                                </button>
                                <button className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] font-bold text-slate-600 hover:bg-slate-50 transition-colors flex flex-col items-center gap-2 text-center">
                                    <Icon svg={ICONS.list} className="w-4 h-4 text-cyan-500" />
                                    Pizarrón
                                </button>
                                <button className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] font-bold text-slate-600 hover:bg-slate-50 transition-colors flex flex-col items-center gap-2 text-center">
                                    <Icon svg={ICONS.box} className="w-4 h-4 text-emerald-500" />
                                    Stock
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// Helper for dynamic colors
const getAreaGradient = (type: string) => {
    switch (type) {
        case 'main-bar': return 'from-cyan-400 to-blue-500';
        case 'prep-room': return 'from-emerald-400 to-teal-500'; // Updated
        case 'dispatch-zone': return 'from-violet-400 to-purple-500'; // Updated
        case 'production': return 'from-emerald-400 to-teal-500'; // Legacy fallback
        case 'dispatch': return 'from-violet-400 to-purple-500'; // Legacy fallback
        case 'backbar': return 'from-slate-400 to-gray-500';
        default: return 'from-slate-400 to-slate-500';
    }
};

export default OpsPanel;

