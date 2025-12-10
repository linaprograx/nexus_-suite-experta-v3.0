import React, { useState, useMemo } from 'react';
import { BarArea, BarWorker } from '../scene/digitalBarTypes';
import { Icon } from '../../../components/ui/Icon';
import { ICONS } from '../../../components/ui/icons';
import { DigitalBarService } from '../web/DigitalBarService';

interface DigitalBarContextPanelProps {
    selectedArea: BarArea | undefined;
    workers: BarWorker[];
}

export const DigitalBarContextPanel: React.FC<DigitalBarContextPanelProps> = ({ selectedArea, workers }) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'ops' | 'team'>('overview');

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

                {/* KPI Cards */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col justify-between">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Carga</span>
                        <div className="flex items-end gap-1">
                            <span className="text-lg font-black text-slate-700 dark:text-slate-200">{selectedArea.stats.load}%</span>
                            <div className="w-full h-1 bg-slate-100 rounded-full mb-1.5 ml-2 overflow-hidden">
                                <div className="h-full bg-slate-400" style={{ width: `${selectedArea.stats.load}%` }} />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col justify-between">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Tickets</span>
                        <span className="text-lg font-black text-cyan-500">{selectedArea.stats.activeTickets}</span>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col justify-between">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Efic.</span>
                        <span className="text-lg font-black text-emerald-500">{selectedArea.stats.efficiency}%</span>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-200 dark:border-slate-700">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`px-4 py-2 text-xs font-bold uppercase tracking-wide border-b-2 transition-colors ${activeTab === 'overview' ? 'border-cyan-500 text-cyan-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                    >
                        Visión General
                    </button>
                    <button
                        onClick={() => setActiveTab('ops')}
                        className={`px-4 py-2 text-xs font-bold uppercase tracking-wide border-b-2 transition-colors ${activeTab === 'ops' ? 'border-cyan-500 text-cyan-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                    >
                        Operaciones
                    </button>
                    <button
                        onClick={() => setActiveTab('team')}
                        className={`px-4 py-2 text-xs font-bold uppercase tracking-wide border-b-2 transition-colors ${activeTab === 'team' ? 'border-cyan-500 text-cyan-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                    >
                        Equipo ({areaWorkers.length})
                    </button>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 pt-2">

                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        {/* AI Insights */}
                        <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-3 opacity-10">
                                <Icon svg={ICONS.activity} className="w-12 h-12" />
                            </div>
                            <h4 className="text-xs font-black text-indigo-800 dark:text-indigo-300 uppercase mb-3 flex items-center gap-2">
                                <Icon svg={ICONS.activity} className="w-4 h-4" /> Nexus AI Insights
                            </h4>
                            <ul className="space-y-2">
                                {insights.map((insight: string, idx: number) => (
                                    <li key={idx} className="flex items-start gap-2 text-xs text-indigo-700 dark:text-indigo-200">
                                        <span className="mt-1 w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                                        {insight}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Recent Alerts mock */}
                        <div>
                            <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">Alertas Recientes</h4>
                            <div className="space-y-2">
                                <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-orange-400" />
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
                                    <Icon svg={ICONS.list} className="w-4 h-4 text-cyan-500" />
                                    Ver en Pizarrón
                                </button>
                                <button className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] font-bold text-slate-600 hover:bg-slate-50 transition-colors flex flex-col items-center gap-2 text-center">
                                    <Icon svg={ICONS.box} className="w-4 h-4 text-emerald-500" />
                                    Chequear Stocks
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
        case 'production': return 'from-emerald-400 to-teal-500';
        case 'dispatch': return 'from-violet-400 to-purple-500';
        case 'backbar': return 'from-slate-400 to-gray-500';
        default: return 'from-slate-400 to-slate-500';
    }
};

