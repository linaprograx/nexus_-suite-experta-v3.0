import React from 'react';
import { Ingredient } from '../../../types';
import { Card } from '../ui/Card';
import { Icon } from '../ui/Icon';
import { ICONS } from '../ui/icons';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';

interface IngredientFinancialDashboardProps {
    selectedIngredient: Ingredient | null;
    allIngredients: Ingredient[];
}

export const IngredientFinancialDashboard: React.FC<IngredientFinancialDashboardProps> = ({ selectedIngredient, allIngredients }) => {

    // --- Mock Data Generators ---
    const generateTrendData = (baseValue: number, volatility: number) => {
        return Array.from({ length: 6 }, (_, i) => ({
            name: `Mes ${i + 1}`,
            value: Math.max(0, baseValue + (Math.random() - 0.5) * volatility)
        }));
    };

    // --- Render: SELECTED INGREDIENT MODE ---
    if (selectedIngredient) {
        const priceHistory = generateTrendData(selectedIngredient.precioCompra, selectedIngredient.precioCompra * 0.1);
        const lastPrice = priceHistory[priceHistory.length - 1].value;
        const trend = ((lastPrice - priceHistory[0].value) / priceHistory[0].value) * 100;

        return (
            <div className="h-full flex flex-col gap-4 animate-in fade-in slide-in-from-left-4 duration-300">
                {/* Header */}
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                        <Icon svg={ICONS.trendingUp} className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm truncate">{selectedIngredient.nombre}</h3>
                        <p className="text-xs text-slate-500">Análisis de Costos</p>
                    </div>
                </div>

                {/* KPI Grid */}
                <div className="grid grid-cols-2 gap-2">
                    <Card className="p-3 border bg-white/50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800">
                        <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Precio Actual</div>
                        <div className="text-lg font-bold text-slate-800 dark:text-slate-100">€{selectedIngredient.precioCompra.toFixed(2)}</div>
                        <div className={`text-[10px] font-bold ${trend >= 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                            {trend >= 0 ? '+' : ''}{trend.toFixed(1)}% vs 6m
                        </div>
                    </Card>
                    <Card className="p-3 border bg-white/50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800">
                        <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Stock (Est.)</div>
                        <div className="text-lg font-bold text-slate-800 dark:text-slate-100">{(selectedIngredient as any).stockActual || 0} u.</div>
                        <div className="text-[10px] text-slate-400 font-medium">
                            Valor: €{(((selectedIngredient as any).stockActual || 0) * selectedIngredient.precioCompra).toFixed(0)}
                        </div>
                    </Card>
                </div>

                {/* Price Evolution Chart */}
                <Card className="p-4 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-slate-100 dark:border-slate-800 shadow-sm flex-1 min-h-[160px] flex flex-col">
                    <div className="flex justify-between items-end mb-4">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Evolución Precio</span>
                    </div>
                    <div className="flex-1 w-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={priceHistory}>
                                <defs>
                                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="name" hide />
                                <YAxis hide domain={['dataMin - 1', 'dataMax + 1']} />
                                <Tooltip
                                    contentStyle={{ background: 'rgba(255, 255, 255, 0.8)', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                    itemStyle={{ color: '#10b981', fontWeight: 'bold' }}
                                    formatter={(val: number) => [`€${val.toFixed(2)}`, 'Precio']}
                                />
                                <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorPrice)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>
        );
    }

    // --- Render: GLOBAL INVENTORY MODE ---
    const totalValue = allIngredients.reduce((acc, ing) => acc + (ing.precioCompra * ((ing as any).stockActual || 0)), 0);
    const lowStockCount = allIngredients.filter(ing => ((ing as any).stockActual || 0) < 2).length;

    // Mock Historical Valuation
    const inventoryHistory = generateTrendData(totalValue, totalValue * 0.05);

    // Top Cost Items (Mock currently, but logic ready for real stock)
    const topCostItems = [...allIngredients]
        .sort((a, b) => b.precioCompra - a.precioCompra)
        .slice(0, 5)
        .map(ing => ({
            name: ing.nombre,
            value: ing.precioCompra
        }));

    return (
        <div className="h-full flex flex-col gap-4 animate-in fade-in slide-in-from-left-4 duration-300">
            {/* Header */}
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                    <Icon svg={ICONS.box} className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Inventario Global</h3>
                    <p className="text-xs text-slate-500">Inteligencia</p>
                </div>
            </div>

            {/* Global KPIs */}
            <div className="grid grid-cols-2 gap-2">
                <Card className="p-3 border bg-white/50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800">
                    <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Items Totales</div>
                    <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">{allIngredients.length}</div>
                </Card>
                <Card className="p-3 border bg-white/50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800">
                    <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Valor Total</div>
                    <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">€{totalValue.toFixed(0)}</div>
                </Card>
            </div>

            {/* Historical Inventory Value Chart */}
            <Card className="p-4 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-slate-100 dark:border-slate-800 shadow-sm min-h-[140px]">
                <div className="text-[10px] text-emerald-600 uppercase font-bold mb-2">Valor Histórico Inventario</div>
                <div className="h-[100px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={inventoryHistory}>
                            <defs>
                                <linearGradient id="colorInv" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <Tooltip
                                contentStyle={{ background: 'rgba(255, 255, 255, 0.9)', borderRadius: '8px', border: 'none', fontSize: '12px' }}
                                formatter={(val: number) => [`€${val.toFixed(0)}`, 'Valor']}
                            />
                            <Area type="monotone" dataKey="value" stroke="#059669" strokeWidth={2} fill="url(#colorInv)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </Card>

            {/* Top Cost Products */}
            <Card className="p-4 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-slate-100 dark:border-slate-800 shadow-sm">
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Top Costo Unitario</h4>
                <div className="space-y-3">
                    {topCostItems.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2 max-w-[70%]">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                                <span className="truncate text-slate-600 dark:text-slate-300 font-medium">{item.name}</span>
                            </div>
                            <span className="font-bold text-slate-800 dark:text-slate-100">€{item.value.toFixed(2)}</span>
                        </div>
                    ))}
                </div>
            </Card>

            {/* Stock Status Logic */}
            <Card className="p-4 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-slate-100 dark:border-slate-800 shadow-sm flex-1">
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Estado del Stock</h4>
                <div className="space-y-4">
                    <div>
                        <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-600 dark:text-slate-400">Stock Saludable</span>
                            <span className="font-bold text-emerald-600">{allIngredients.length - lowStockCount}</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500" style={{ width: `${((allIngredients.length - lowStockCount) / allIngredients.length) * 100}%` }} />
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-600 dark:text-slate-400">Stock Bajo / Crítico</span>
                            <span className="font-bold text-amber-500">{lowStockCount}</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-500" style={{ width: `${(lowStockCount / allIngredients.length) * 100}%` }} />
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
};
