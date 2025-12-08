import React from 'react';
import { Recipe } from '../../types';

interface EconosViewProps {
    allRecipes: Recipe[];
}

const UnleashColumn = ({ title, children }: { title: string, children?: React.ReactNode }) => (
    <div className="h-full min-h-0 flex flex-col rounded-2xl border border-emerald-200/50 overflow-hidden bg-white/40 backdrop-blur-md shadow-sm">
        <div className="p-4 border-b border-emerald-100 bg-white/50">
            <h3 className="font-bold text-emerald-900 tracking-wide text-sm uppercase">{title}</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-4">
            {children}
        </div>
    </div>
);

const SectionBlock = ({ title, children }: { title: string, children?: React.ReactNode }) => (
    <div className="bg-white/60 p-4 rounded-xl border border-emerald-100 shadow-sm">
        <h4 className="text-emerald-700 font-bold mb-3 text-xs uppercase tracking-wider">{title}</h4>
        {children}
    </div>
);

// Mock Provider Data
const MOCK_PROVIDERS = [
    { id: 'prov1', name: 'Makro Mayorista', lastUpdate: '08/12/2025' },
    { id: 'prov2', name: 'Frutería Local "El Huerto"', lastUpdate: '05/12/2025' },
    { id: 'prov3', name: 'Licores Premium S.L.', lastUpdate: '01/12/2025' }
];

const EconosView: React.FC<EconosViewProps> = ({ allRecipes }) => {
    const [selectedRecipeId, setSelectedRecipeId] = React.useState('');
    const [selectedProvider, setSelectedProvider] = React.useState('');
    const [costResult, setCostResult] = React.useState<{
        cost: number;
        margin: number;
        costPct: number;
        suggestedPrice: number;
        profit: number;
        breakEven: number;
        breakdown: { name: string, cost: number, pct: number }[];
        savings: string[];
    } | null>(null);

    const handleCalculate = () => {
        if (!selectedRecipeId) return;
        // Mock Super Analysis
        const baseCost = 2.85;
        const targetMargin = 0.78; // 78%
        const suggPrice = baseCost / (1 - targetMargin);

        setCostResult({
            cost: baseCost,
            margin: 78,
            costPct: 22,
            suggestedPrice: 12.50,
            profit: 9.65,
            breakEven: 345, // Copas para amortizar
            breakdown: [
                { name: 'Base Spirit', cost: 1.50, pct: 52 },
                { name: 'Modifiers', cost: 0.80, pct: 28 },
                { name: 'Citrus/Produce', cost: 0.40, pct: 14 },
                { name: 'Garnish/Ice', cost: 0.15, pct: 6 }
            ],
            savings: [
                "Cambiar 'Premium Gin' por 'House Gin' reduciría el coste un 15%.",
                "El limón está un 20% más caro en 'Frutería Local' que en 'Makro'.",
                "Ajustar el 'wash line' podría ahorrar 0.10€ por copa."
            ]
        });
    };

    const handleFileUpload = () => {
        alert("Simulación: Catálogo subido y precios actualizados correctamente.");
    };

    return (
        <div className="h-full grid grid-cols-1 lg:grid-cols-[320px,minmax(0,1fr),320px] gap-6">
            {/* Column 1: Selector Económico */}
            <UnleashColumn title="Selector Económico">
                <SectionBlock title="Receta a Analizar">
                    <select
                        className="w-full bg-white border border-emerald-200 rounded-lg p-2 text-slate-800 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                        value={selectedRecipeId}
                        onChange={(e) => setSelectedRecipeId(e.target.value)}
                    >
                        <option value="">Seleccionar Receta...</option>
                        {allRecipes.map(recipe => (
                            <option key={recipe.id} value={recipe.id}>{recipe.nombre}</option>
                        ))}
                    </select>
                </SectionBlock>

                <SectionBlock title="Proveedor Base">
                    <div className="flex gap-2 mb-2">
                        <select
                            className="flex-1 bg-white border border-emerald-200 rounded-lg p-2 text-slate-800 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                            value={selectedProvider}
                            onChange={(e) => setSelectedProvider(e.target.value)}
                        >
                            <option value="">Proveedor Principal</option>
                            {MOCK_PROVIDERS.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                        <button
                            onClick={handleFileUpload}
                            className="p-2 bg-slate-200 hover:bg-emerald-600 hover:text-white text-slate-600 rounded-lg transition-colors border border-emerald-200"
                            title="Subir Catálogo Actualizado"
                        >
                            <span className="text-lg">📂</span>
                        </button>
                    </div>
                    {selectedProvider && (
                        <p className="text-[10px] text-emerald-600 italic text-right font-medium">
                            Actualizado: {MOCK_PROVIDERS.find(p => p.id === selectedProvider)?.lastUpdate}
                        </p>
                    )}
                </SectionBlock>

                <button
                    onClick={handleCalculate}
                    disabled={!selectedRecipeId}
                    className={`w-full py-3 font-bold rounded-xl shadow-lg transition-all mt-4 ${selectedRecipeId ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                >
                    CALCULAR COSTE
                </button>
            </UnleashColumn>

            {/* Column 2: Análisis de Coste */}
            <UnleashColumn title="Análisis de Coste">
                {!costResult ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
                        <div className="text-4xl mb-4 text-emerald-300">💰</div>
                        <p className="text-sm italic font-medium">Selecciona receta y calcula rentabilidad.</p>
                    </div>
                ) : (
                    <div className="space-y-6 animate-fadeIn">
                        {/* Key Metrics Grid */}
                        <div className="grid grid-cols-2 lg:grid-cols-2 gap-4">
                            <div className="bg-white/80 p-4 rounded-xl border border-emerald-100 relative overflow-hidden shadow-sm group">
                                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Coste Materia Prima</span>
                                <div className="text-2xl font-bold text-slate-800 mt-1">{costResult.cost.toFixed(2)} €</div>
                                <div className="text-xs text-emerald-600 font-medium">{costResult.costPct}% del precio</div>
                            </div>
                            <div className="bg-emerald-600 p-4 rounded-xl border border-emerald-500 relative overflow-hidden shadow-lg shadow-emerald-900/20 text-white">
                                <span className="text-[10px] text-emerald-100 uppercase tracking-wider font-bold">Margen Contribución</span>
                                <div className="text-2xl font-bold mt-1">{costResult.profit.toFixed(2)} €</div>
                                <div className="text-xs text-emerald-100 font-medium">Beneficio Limpio</div>
                            </div>
                            <div className="bg-white/80 p-4 rounded-xl border border-emerald-100 relative overflow-hidden shadow-sm">
                                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">P.V.P Sugerido</span>
                                <div className="text-2xl font-bold text-slate-800 mt-1">{costResult.suggestedPrice.toFixed(2)} €</div>
                                <div className="text-xs text-slate-400 font-medium">Para margen ideal</div>
                            </div>
                            <div className="bg-white/80 p-4 rounded-xl border border-emerald-100 relative overflow-hidden shadow-sm">
                                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Punto Equilibrio</span>
                                <div className="text-2xl font-bold text-slate-800 mt-1">{costResult.breakEven} u.</div>
                                <div className="text-xs text-slate-400 font-medium">Ventas para amortizar</div>
                            </div>
                        </div>

                        {/* Cost Breakdown Visual Bar */}
                        <div className="bg-white/60 p-4 rounded-xl border border-emerald-100">
                            <h4 className="text-xs text-slate-500 uppercase mb-3 font-bold">Desglose de Costes</h4>
                            <div className="flex h-4 rounded-full overflow-hidden mb-4">
                                {costResult.breakdown.map((item, i) => (
                                    <div
                                        key={i}
                                        className="h-full transition-all hover:opacity-80 relative group/tooltip"
                                        style={{ width: `${item.pct}%`, backgroundColor: ['#059669', '#10b981', '#34d399', '#6ee7b7'][i] }}
                                        title={`${item.name}: ${item.pct}%`}
                                    >
                                    </div>
                                ))}
                            </div>
                            <div className="space-y-2">
                                {costResult.breakdown.map((item, i) => (
                                    <div key={i} className="flex justify-between text-xs text-slate-600 border-b border-white/50 pb-1 last:border-0">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ['#059669', '#10b981', '#34d399', '#6ee7b7'][i] }}></div>
                                            <span className="font-medium">{item.name}</span>
                                        </div>
                                        <div className="font-mono font-bold text-slate-800">{item.cost.toFixed(2)}€ ({item.pct}%)</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </UnleashColumn>

            {/* Column 3: Optimización */}
            <UnleashColumn title="Optimización">
                <SectionBlock title="Sugerencias de Ahorro">
                    <div className="space-y-3">
                        {!costResult ? (
                            <div className="p-3 bg-slate-100 rounded-lg text-center text-slate-500 text-xs italic">
                                Esperando cálculo...
                            </div>
                        ) : (
                            costResult.savings.map((sugo, i) => (
                                <div key={i} className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-3 hover:bg-emerald-100 transition-colors cursor-pointer shadow-sm">
                                    <div className="text-emerald-500 mt-0.5">💡</div>
                                    <p className="text-xs text-slate-700 leading-snug font-medium">{sugo}</p>
                                </div>
                            ))
                        )}
                    </div>
                </SectionBlock>
            </UnleashColumn>
        </div>
    );
};

export default EconosView;
