import React from 'react';
import { Button } from '../ui/Button';
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { ChartContainer } from '../ui/ChartContainer';

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
    onSaveHistory: (reportData: ReportData) => void;
    onExport: () => void;
}

const COLORS = ['#ef4444', '#22c55e', '#64748b'];

const EscandalloSummaryCard: React.FC<EscandalloSummaryCardProps> = ({
    recipeName,
    reportData,
    pieData,
    onSaveHistory,
    onExport
}) => {
    return (
        <div className="h-full flex flex-col bg-white/50 dark:bg-slate-900/30 backdrop-blur-md rounded-2xl border border-white/20 dark:border-white/5 overflow-hidden">
            <div className="p-4 border-b border-white/10 dark:border-white/5 bg-white/40 dark:bg-slate-900/40">
                <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">Análisis Financiero</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{recipeName}</p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {/* KPIs Grid */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/60 dark:bg-slate-800/40 rounded-lg p-3 border border-white/20">
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Costo</p>
                        <p className="text-lg font-bold text-slate-900 dark:text-white">€{reportData.costo.toFixed(2)}</p>
                    </div>
                    <div className="bg-white/60 dark:bg-slate-800/40 rounded-lg p-3 border border-white/20">
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">PVP</p>
                        <p className="text-lg font-bold text-slate-900 dark:text-white">€{reportData.precioVenta.toFixed(2)}</p>
                    </div>
                    <div className="bg-white/60 dark:bg-slate-800/40 rounded-lg p-3 border border-white/20">
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Margen</p>
                        <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">€{reportData.margenBruto.toFixed(2)}</p>
                    </div>
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3 border border-emerald-200 dark:border-emerald-800">
                        <p className="text-[10px] text-emerald-700 dark:text-emerald-400 uppercase tracking-wide mb-1 font-bold">Rentabilidad</p>
                        <p className="text-xl font-black text-emerald-700 dark:text-emerald-300">{reportData.rentabilidad.toFixed(1)}%</p>
                    </div>
                </div>

                {/* Chart */}
                <div className="bg-white/40 dark:bg-slate-800/20 rounded-lg p-3 border border-white/20">
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Distribución del PVP</p>
                    <div className="w-full" style={{ height: '200px' }}>
                        <ChartContainer>
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={40}
                                    outerRadius={60}
                                    paddingAngle={3}
                                >
                                    {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                </Pie>
                                <Tooltip formatter={(value: number) => `€${value.toFixed(2)}`} />
                                <Legend wrapperStyle={{ fontSize: '11px' }} />
                            </PieChart>
                        </ChartContainer>
                    </div>
                </div>

                {/* Additional Details */}
                <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center py-1 border-b border-slate-200/50 dark:border-slate-700/50">
                        <span className="text-slate-500 dark:text-slate-400">Base Imponible</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">€{reportData.baseImponible.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                        <span className="text-slate-500 dark:text-slate-400">IVA Soportado</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">€{reportData.ivaSoportado.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="p-3 border-t border-white/10 dark:border-white/5 space-y-2 bg-white/30 dark:bg-slate-900/20">
                <Button onClick={() => onSaveHistory(reportData)} className="w-full text-xs h-9 bg-emerald-600 hover:bg-emerald-700 text-white">
                    Guardar en Historial
                </Button>
                <Button variant="outline" onClick={onExport} className="w-full text-xs h-9 border-slate-200 dark:border-slate-700">
                    Exportar/Imprimir
                </Button>
            </div>
        </div>
    );
};

export default EscandalloSummaryCard;

