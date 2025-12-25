import React from 'react';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { ICONS } from '../ui/icons';
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { ChartContainer } from '../ui/ChartContainer';
import { useUserIntelProfile } from '../../features/learning/hooks/useUserIntelProfile';
import { LearningEngine } from '../../core/learning/learning.engine';
import { useApp, useCapabilities } from '../../context/AppContext';
import { generateActiveSuggestions } from '../../core/active/active.engine'; // Assume this import exists or similar
import { AssignedInsight } from '../../core/assisted/assisted.types'; // Or ActiveSuggestion types

interface ReportData {
    costo: number;
    baseImponible: number;
    ivaSoportado: number;
    margenBruto: number;
    rentabilidad: number;
    precioVenta: number;
}

interface EscandalloSummaryCardProps {
    recipeName: string;
    reportData: ReportData;
    pieData: { name: string; value: number }[];
    onSaveHistory: (data: ReportData) => void;
    onExport: () => void;
    recipe?: any; // Should be Recipe type
    activeSignals?: any[]; // Should be Signal type
    assistedInsights?: any[]; // Should be AssistedInsight type
}

const COLORS = ['#ef4444', '#10b981', '#6366f1'];

const EscandalloSummaryCard: React.FC<EscandalloSummaryCardProps> = ({
    recipeName,
    reportData,
    pieData,
    onSaveHistory,
    onExport,
    recipe,
    activeSignals = [],
    assistedInsights = []
}) => {
    const { profile } = useUserIntelProfile();
    const { db, userId } = useApp();
    const { hasLayer } = useCapabilities();

    // Phase 3.0 - Active Suggestions
    const activeSuggestions = React.useMemo(() => {
        if (!hasLayer('active_intelligence')) return [];
        // Ensure generateActiveSuggestions is imported or available
        return generateActiveSuggestions ? generateActiveSuggestions(assistedInsights, profile) : [];
    }, [assistedInsights, profile, hasLayer]);

    const primarySuggestion = activeSuggestions.length > 0 ? activeSuggestions[0] : null;

    const handleDismissSuggestion = async (id: string) => {
        console.log('Dismissing suggestion', id);
        if (db && userId) {
            await LearningEngine.trackEvent(db, userId, {
                type: 'suggestion_dismissed',
                scope: 'cost',
                entity: {},
                signalIds: [],
                suggestionId: id,
                meta: {}
            });
        }
    };

    return (
        <div className="h-full flex flex-col bg-white/30 dark:bg-slate-900/30 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-white/5 shadow-premium overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-white/10 dark:border-white/5 flex justify-between items-center">
                <div>
                    <h3 className="font-bold text-xl text-slate-900 dark:text-white mb-1">Escandallo Profesional</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{recipeName}</p>
                </div>
                <div className="px-4 py-2 rounded-xl bg-rose-50 dark:bg-rose-900/30 border border-rose-100 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-bold">
                    Rentabilidad: {reportData.rentabilidad.toFixed(1)}%
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-8 w-full max-w-[95%] mx-auto">

                {/* 1. Ingredients Table */}
                <div className="bg-white/40 dark:bg-slate-800/40 rounded-xl p-1 border border-white/20 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-white/50 dark:bg-slate-900/50 text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">
                            <tr>
                                <th className="px-4 py-3 text-left">Ingrediente</th>
                                <th className="px-4 py-3 text-right">Cant.</th>
                                <th className="px-4 py-3 text-center">Und.</th>
                                <th className="px-4 py-3 text-right">Costo U.</th>
                                <th className="px-4 py-3 text-right">Costo Prop.</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {recipe && recipe.ingredientes && recipe.ingredientes.map((ing: any, i: number) => {
                                const propCost = (ing.costo || 0);
                                return (
                                    <tr key={i} className="hover:bg-white/30 dark:hover:bg-slate-800/30 transition-colors">
                                        <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">{ing.nombre}</td>
                                        <td className="px-4 py-3 text-right tabular-nums text-slate-600 dark:text-slate-400">{ing.cantidad}</td>
                                        <td className="px-4 py-3 text-center text-xs text-slate-400">{ing.unidad}</td>
                                        <td className="px-4 py-3 text-right tabular-nums text-slate-500 text-xs">€{((ing.precioCompra || 0)).toFixed(2)}</td>
                                        <td className="px-4 py-3 text-right tabular-nums font-bold text-slate-800 dark:text-slate-200">€{propCost.toFixed(2)}</td>
                                    </tr>
                                );
                            })}
                            {!recipe && <tr><td colSpan={5} className="p-4 text-center opacity-50">Sin datos de ingredientes</td></tr>}
                        </tbody>
                        <tfoot className="bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700 font-bold">
                            <tr>
                                <td colSpan={4} className="px-4 py-3 text-right text-slate-600 dark:text-slate-400">Costo Total</td>
                                <td className="px-4 py-3 text-right text-rose-600 dark:text-rose-400 text-base">€{reportData.costo.toFixed(2)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {/* 2. Visual & Financial Summary */}
                <div className="grid grid-cols-1 gap-6">
                    {/* Financial Breakdown */}
                    <div className="space-y-4">
                        <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-2 border-b border-slate-200 pb-2">Desglose PVP</h4>
                        <div className="flex justify-between items-center bg-white/40 p-3 rounded-lg border border-white/20">
                            <span className="text-slate-500 font-medium">Costo Total</span>
                            <span className="font-bold text-slate-800">€{reportData.costo.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center bg-white/40 p-3 rounded-lg border border-white/20">
                            <span className="text-slate-500 font-medium">Margen Bruto</span>
                            <span className="font-bold text-emerald-600">€{reportData.margenBruto.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center bg-white/40 p-3 rounded-lg border border-white/20">
                            <span className="text-slate-500 font-medium">IVA (21%)</span>
                            <span className="font-bold text-slate-600">€{reportData.ivaSoportado.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center bg-rose-50/50 p-4 rounded-xl border border-rose-100 shadow-sm mt-4">
                            <span className="text-rose-800 font-bold text-lg">Precio de Venta</span>
                            <span className="font-black text-rose-600 text-2xl">€{reportData.precioVenta.toFixed(2)}</span>
                        </div>
                        {/* SIGNALS SECTION */}
                        {activeSignals.length > 0 && (
                            <div className="space-y-2 mt-4 pt-2 border-t border-dashed border-slate-200">
                                {activeSignals.map(sig => (
                                    <div
                                        key={sig.id}
                                        title={sig.explanation || sig.message}
                                        className={`px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2 cursor-help ${sig.severity === 'warning'
                                            ? 'bg-amber-50 text-amber-700 border border-amber-100'
                                            : sig.severity === 'critical'
                                                ? 'bg-red-50 text-red-700 border border-red-100'
                                                : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                                            }`}
                                    >
                                        <Icon
                                            svg={sig.severity === 'info' ? ICONS.info : ICONS.alertCircle}
                                            className="w-4 h-4 shrink-0"
                                        />
                                        <span>{sig.message}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Doughnut Chart */}
                    <div className="flex flex-col items-center justify-center bg-white/20 dark:bg-slate-900/20 rounded-2xl p-4 border border-white/10 relative">
                        <h4 className="absolute top-4 left-4 font-bold text-xs uppercase text-slate-400 tracking-wider">Distribución</h4>
                        <div className="w-full h-48 relative z-10">
                            <ChartContainer>
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        cornerRadius={5}
                                        stroke="none"
                                    >
                                        {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value: number) => `€${value.toFixed(2)}`}
                                        contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(10px)', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                    />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                </PieChart>
                            </ChartContainer>
                            {/* Center Text */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="text-center">
                                    <p className="text-xs text-slate-400 font-bold uppercase">Profit</p>
                                    <p className="text-xl font-black text-emerald-500">{reportData.rentabilidad.toFixed(0)}%</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="p-4 border-t border-white/10 dark:border-white/5 flex gap-3 bg-white/20 dark:bg-slate-900/20 backdrop-blur-md">
                <Button onClick={() => onSaveHistory(reportData)} className="flex-1 bg-rose-700 hover:bg-rose-800 text-white shadow-lg shadow-rose-900/20 h-10 text-sm font-bold rounded-xl transition-all hover:-translate-y-0.5">
                    <Icon svg={(ICONS as any).save || (ICONS as any).book} className="mr-2 h-4 w-4 opacity-80" /> Guardar en Historial
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onSaveHistory(reportData)} title="Guardar en historial"><Icon svg={(ICONS as any).book} className="w-4 h-4" /></Button>
                <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-2" />
                <Button variant="ghost" size="sm" onClick={onExport} title="Exportar PDF"><Icon svg={(ICONS as any).fileText} className="w-4 h-4" /></Button>
            </div>
        </div>
    );
};

export default EscandalloSummaryCard;

