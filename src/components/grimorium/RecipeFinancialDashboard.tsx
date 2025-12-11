import React from 'react';
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { ChartContainer } from '../ui/ChartContainer';
import { Recipe } from '../../../types';
import { Card } from '../ui/Card';
import { Icon } from '../ui/Icon';
import { ICONS } from '../ui/icons';

interface RecipeFinancialDashboardProps {
    selectedRecipe: Recipe | null;
    allRecipes: Recipe[];
}

export const RecipeFinancialDashboard: React.FC<RecipeFinancialDashboardProps> = ({ selectedRecipe, allRecipes }) => {

    // --- Mock Data Generators ---
    const generateTrendData = (base: number, volatility: number) => {
        return Array.from({ length: 7 }, (_, i) => ({
            day: ['L', 'M', 'X', 'J', 'V', 'S', 'D'][i],
            value: Math.max(0, base + (Math.random() - 0.5) * volatility)
        }));
    };

    const globalStats = React.useMemo(() => {
        const totalRecipes = allRecipes.length;
        const totalMenu = allRecipes.filter(r => r.categorias?.includes('Carta') || r.categorias?.includes('Terminado')).length;
        // Mock average margin
        const avgMargin = 78;
        return { totalRecipes, totalMenu, avgMargin };
    }, [allRecipes]);


    // --- Render: SELECTED RECIPE MODE ---
    if (selectedRecipe) {
        // Calculate real margin if price exists
        const costo = selectedRecipe.costoReceta || 0;
        const venta = selectedRecipe.precioVenta || 0;
        const margen = venta > 0 ? ((venta - costo) / venta) * 100 : 0;

        // Mock sales data
        const salesData = generateTrendData(15, 10);
        const totalSales = salesData.reduce((acc, curr) => acc + curr.value, 0);
        const revenue = totalSales * venta;
        const profit = totalSales * (venta - costo);

        return (
            <div className="h-full flex flex-col gap-4 animate-in fade-in slide-in-from-left-4 duration-300">
                {/* Header */}
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                        <Icon svg={ICONS.trendingUp} className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-xs truncate" title={selectedRecipe.nombre}>{selectedRecipe.nombre}</h3>
                        <p className="text-[10px] text-slate-500 truncate">Rendimiento Financiero</p>
                    </div>
                </div>

                {/* Margin KPI */}
                <Card className={`p-3 border ${margen < 25 ? 'bg-red-50 border-red-100' : 'bg-indigo-50/50 border-indigo-100'} dark:bg-slate-800/50 dark:border-slate-700`}>
                    <div className="flex justify-between items-center mb-1 flex-wrap gap-1">
                        <span className="text-[10px] font-semibold uppercase tracking-wider opacity-70">Margen Bruto</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${margen < 25 ? 'bg-red-200 text-red-800' : 'bg-emerald-100 text-emerald-700'}`}>
                            {margen > 70 ? 'EXCELENTE' : margen < 25 ? 'CRÍTICO' : 'BUENO'}
                        </span>
                    </div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold">{margen.toFixed(1)}%</span>
                        <span className="text-xs text-slate-500">Objetivo: 80%</span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full h-2 bg-black/5 rounded-full mt-3 overflow-hidden">
                        <div className={`h-full rounded-full ${margen < 25 ? 'bg-red-500' : 'bg-indigo-500'}`} style={{ width: `${Math.min(margen, 100)}%` }} />
                    </div>
                </Card>

                {/* New: Cost/Profit Detail Grid */}
                <div className="grid grid-cols-2 gap-2">
                    <Card className="p-2 border bg-emerald-50/50 border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-800">
                        <div className="text-[10px] text-emerald-600 uppercase font-bold">Costo Real</div>
                        <div className="text-xl font-bold text-slate-800 dark:text-slate-100">€{costo.toFixed(2)}</div>
                    </Card>
                    <Card className="p-2 border bg-indigo-50/50 border-indigo-100 dark:bg-indigo-900/10 dark:border-indigo-800">
                        <div className="text-[10px] text-indigo-600 uppercase font-bold">Beneficio</div>
                        <div className="text-xl font-bold text-slate-800 dark:text-slate-100">€{(venta - costo).toFixed(2)}</div>
                    </Card>
                </div>

                {/* Sales Chart (Mock) */}
                <Card className="p-4 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-slate-100 dark:border-slate-800 shadow-sm flex-1 min-h-[160px]">
                    <div className="flex justify-between items-end mb-4">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Ventas (7 días)</span>
                        <span className="font-bold text-indigo-600 dark:text-indigo-400 text-lg">€{revenue.toFixed(0)}</span>
                    </div>
                    <div className="flex-1 w-full min-h-0">
                        <ChartContainer>
                            <BarChart data={salesData}>
                                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value: any) => [`${value.toFixed(0)}`, 'Ventas']}
                                />
                                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                    {salesData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.value > 20 ? '#6366f1' : '#a5b4fc'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ChartContainer>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-between text-sm">
                        <span className="text-slate-500">Beneficio Neto Est.</span>
                        <span className="font-bold text-emerald-600">+€{profit.toFixed(0)}</span>
                    </div>
                </Card>
            </div>
        );
    }

    // --- Render: GLOBAL MODE ---
    return (
        <div className="h-full flex flex-col gap-4 animate-in fade-in slide-in-from-left-4 duration-300">
            {/* Header */}
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-xl bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400">
                    <Icon svg={ICONS.chart} className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Resumen Global</h3>
                    <p className="text-xs text-slate-500">Grimorio Analytics</p>
                </div>
            </div>

            {/* Global Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
                <Card className="p-3 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-slate-100 dark:border-slate-800">
                    <div className="text-xs text-slate-500 mb-1">Recetas Carta</div>
                    <div className="font-bold text-slate-800 dark:text-slate-200 text-2xl">
                        {globalStats.totalMenu}
                    </div>
                    <div className="text-[10px] text-slate-400">De {globalStats.totalRecipes} total</div>
                </Card>
                <Card className="p-3 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-slate-100 dark:border-slate-800">
                    <div className="text-xs text-slate-500 mb-1">Margen Medio</div>
                    <div className="font-bold text-emerald-600 text-2xl">
                        {globalStats.avgMargin}%
                    </div>
                    <div className="text-[10px] text-emerald-500">Saludable</div>
                </Card>
            </div>

            {/* Top Categories Area Chart (Mock) */}
            <Card className="p-4 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-slate-100 dark:border-slate-800 shadow-sm flex-1">
                <div className="flex justify-between items-end mb-4">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Consumo Mensual</span>
                </div>
                <div className="h-48 w-full">
                    <ChartContainer>
                        <AreaChart data={generateTrendData(100, 30)}>
                            <defs>
                                <linearGradient id="colorGlobal" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <Tooltip />
                            <Area type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={2} fill="url(#colorGlobal)" />
                        </AreaChart>
                    </ChartContainer>
                </div>
                <p className="text-xs text-center text-slate-400 mt-2">Tendencia de creación y ventas de recetas.</p>
            </Card>
        </div>
    );
};
