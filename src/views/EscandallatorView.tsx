import React from 'react';
import { Firestore, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { Recipe, Ingredient } from '../../types';
import { PremiumLayout } from '../components/layout/PremiumLayout';
import EscandalloTab from '../components/escandallator/EscandalloTab';
import BatcherTab from '../components/escandallator/BatcherTab';
import StockManagerTab from '../components/escandallator/StockManagerTab';
import EscandalloHistorySidebar from '../components/escandallator/EscandalloHistorySidebar';
import EscandalloSummaryCard from '../components/escandallator/EscandalloSummaryCard';
import BatcherSidebar from '../components/escandallator/BatcherSidebar';
import StockSidebar from '../components/escandallator/StockSidebar';
import { Card, CardContent } from '../components/ui/Card';
import { Icon } from '../components/ui/Icon';
import { ICONS } from '../components/ui/icons';
import { exportToCSV } from '../utils/exportToCSV';
import { Button } from '../components/ui/Button';

interface EscandallatorViewProps {
    db: Firestore;
    userId: string;
    appId: string;
    allRecipes: Recipe[];
    allIngredients: Ingredient[];
}

const EscandallatorView: React.FC<EscandallatorViewProps> = ({ db, userId, appId, allRecipes, allIngredients }) => {
    const [activeTab, setActiveTab] = React.useState<'escandallo' | 'batcher' | 'stock'>('escandallo');

    // Escandallo State
    const [selectedRecipe, setSelectedRecipe] = React.useState<Recipe | null>(null);
    const [precioVenta, setPrecioVenta] = React.useState<number>(0);
    const escandallosColPath = `users/${userId}/escandallo-history`;

    // Batcher State
    const [batchResult, setBatchResult] = React.useState<any>(null);

    // Stock State
    const [shoppingList, setShoppingList] = React.useState<any[] | null>(null);

    // --- PHASE 5.2: REAL COST CALCULATION ---
    const realCost = React.useMemo(() => {
        if (!selectedRecipe || !selectedRecipe.ingredientes) return 0;
        // Logic aligned with Grimorio Real Cost (using Stock)
        // Note: Ideally this should be a shared hook `useRecipeRealCost(recipe, stockItems)`
        // For now, inlining to ensure stability before extraction.

        // We need Stock Items. 
        // We don't have stockItems in this View yet? 
        // We have `StockManagerTab` calculating it. 
        // We need to lift the stock state or re-calculate it.
        // `StockManagerTab` uses `usePurchaseIngredient` to get `purchases` and then `buildStockFromPurchases`.
        // We should do the same here.
        return 0; // Placeholder until we lift state
    }, [selectedRecipe]); // Missing deps

    // Escandallo Calculations
    const escandalloData = React.useMemo(() => {
        if (!selectedRecipe || precioVenta <= 0) return null;
        const IVA_RATE = 0.21;

        // MIXED MODE: Use Real Cost if available and > 0, else Theoretical
        // const effectiveCost = realCost > 0 ? realCost : (selectedRecipe.costoReceta || 0);
        // For now, let's stick to simple logic until we wire up Stock
        const costo = selectedRecipe.costoReceta || 0;

        const baseImponible = precioVenta / (1 + IVA_RATE);
        const ivaSoportado = precioVenta - baseImponible;
        const margenBruto = baseImponible - costo;
        const rentabilidad = baseImponible > 0 ? (margenBruto / baseImponible) * 100 : 0;
        return {
            report: { costo, precioVenta, baseImponible, ivaSoportado, margenBruto, rentabilidad },
            pie: [
                { name: 'Costo', value: costo },
                { name: 'Margen', value: margenBruto },
                { name: 'IVA', value: ivaSoportado }
            ]
        };
    }, [selectedRecipe, precioVenta /*, realCost */]);

    const handleSaveToHistory = async (reportData: any) => {
        if (!selectedRecipe) return;
        const { baseImponible, ...dataToSave } = reportData;
        const newEscandallo = {
            recipeId: selectedRecipe.id,
            recipeName: selectedRecipe.nombre,
            ...dataToSave,
            createdAt: serverTimestamp()
        };
        try {
            await addDoc(collection(db, escandallosColPath), newEscandallo);
            alert('Escandallo guardado en el historial.');
        } catch (e) {
            console.error("Error saving history:", e);
        }
    };

    const handleLoadHistory = (item: any) => {
        const recipe = allRecipes.find(r => r.id === item.recipeId) || null;
        if (recipe) {
            setSelectedRecipe(recipe);
            setPrecioVenta(item.precioVenta);
        }
    };

    // Actions for Sidebar
    const handleSaveBatchToPizarron = async () => {
        if (!batchResult) return;
        const { meta } = batchResult;
        const taskContent = `[Batch] Producir ${meta.targetQuantity} ${meta.targetUnit} de ${meta.recipeName}. Dilución: ${meta.includeDilution ? 'Sí' : 'No'}`;
        await addDoc(collection(db, `artifacts/${appId}/public/data/pizarron-tasks`), {
            content: taskContent, status: 'Ideas', category: 'Desarrollo', createdAt: serverTimestamp(), boardId: 'general'
        });
        alert("Tarea de batch guardada en el Pizarrón.");
    };

    return (
        <PremiumLayout
            gradientTheme="emerald"
            leftSidebar={
                activeTab === 'escandallo' ? (
                    <EscandalloHistorySidebar
                        db={db}
                        escandallosColPath={escandallosColPath}
                        onLoadHistory={handleLoadHistory}
                    />
                ) : activeTab === 'batcher' ? (
                    <BatcherSidebar />
                ) : (
                    <StockSidebar />
                )
            }
            mainContent={
                <div className="h-full flex flex-col bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-white/5 p-4 lg:p-6 overflow-hidden">
                    <div className="flex bg-slate-200/50 dark:bg-slate-800/50 p-1 rounded-full w-max mx-auto mb-6 flex-shrink-0">
                        <button onClick={() => setActiveTab('escandallo')} className={`px-6 py-2 text-sm font-medium rounded-full transition-all ${activeTab === 'escandallo' ? 'bg-white text-emerald-600 shadow-sm dark:bg-slate-700 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400 hover:text-emerald-500'}`}>Escandallo</button>
                        <button onClick={() => setActiveTab('batcher')} className={`px-6 py-2 text-sm font-medium rounded-full transition-all ${activeTab === 'batcher' ? 'bg-white text-emerald-600 shadow-sm dark:bg-slate-700 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400 hover:text-emerald-500'}`}>Batcher</button>
                        <button onClick={() => setActiveTab('stock')} className={`px-6 py-2 text-sm font-medium rounded-full transition-all ${activeTab === 'stock' ? 'bg-white text-emerald-600 shadow-sm dark:bg-slate-700 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400 hover:text-emerald-500'}`}>Stock</button>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {activeTab === 'escandallo' && (
                            <EscandalloTab
                                allRecipes={allRecipes}
                                selectedRecipe={selectedRecipe}
                                precioVenta={precioVenta}
                                onSelectRecipe={setSelectedRecipe}
                                onPriceChange={setPrecioVenta}
                            />
                        )}
                        {activeTab === 'batcher' && (
                            <BatcherTab
                                db={db}
                                appId={appId}
                                allRecipes={allRecipes}
                                setBatchResult={setBatchResult}
                            />
                        )}
                        {activeTab === 'stock' && (
                            <StockManagerTab
                                allRecipes={allRecipes}
                                allIngredients={allIngredients}
                                setShoppingList={setShoppingList}
                            />
                        )}
                    </div>
                </div>
            }
            rightSidebar={
                <div className="h-full overflow-y-auto custom-scrollbar">
                    {/* ESCANDALLO RESULTS */}
                    {activeTab === 'escandallo' && (
                        escandalloData ? (
                            <EscandalloSummaryCard
                                recipeName={selectedRecipe?.nombre || 'Receta'}
                                reportData={escandalloData.report}
                                pieData={escandalloData.pie}
                                onSaveHistory={handleSaveToHistory}
                                onExport={() => window.print()}
                            />
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
                                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-full mb-3">
                                    <Icon svg={ICONS.chart} className="w-8 h-8 text-emerald-300" />
                                </div>
                                <p className="text-lg font-medium text-slate-500 dark:text-slate-400">Resultados</p>
                                <p className="text-sm mt-1 max-w-[200px]">Selecciona una receta y establece un precio para ver el análisis de rentabilidad.</p>
                            </div>
                        )
                    )}

                    {/* BATCHER RESULTS */}
                    {activeTab === 'batcher' && (
                        batchResult ? (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-md rounded-2xl border border-white/20 dark:border-white/5 p-4 flex justify-between items-center shadow-sm">
                                    <div>
                                        <h3 className="font-semibold text-slate-800 dark:text-slate-200">Total Batch</h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">{batchResult.meta.targetQuantity} {batchResult.meta.targetUnit}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button size="sm" onClick={handleSaveBatchToPizarron} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                                            <Icon svg={ICONS.check} className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3">
                                    {batchResult.data.map((row: any, index: number) => (
                                        <div key={index} className="flex items-center justify-between p-4 rounded-xl bg-white/80 dark:bg-slate-900/70 backdrop-blur-md border border-white/20 dark:border-white/5 shadow-sm">
                                            <span className="font-medium text-sm text-slate-800 dark:text-slate-200">{row.ingredient}</span>
                                            <div className="text-right">
                                                <span className="block text-lg font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{row.batchQty}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <Card className="h-full flex items-center justify-center p-6 bg-white/40 dark:bg-slate-900/20 border-white/20 dark:border-white/5">
                                <CardContent className="text-center text-muted-foreground flex flex-col items-center">
                                    <Icon svg={ICONS.layers} className="w-12 h-12 mb-4 opacity-20" />
                                    <p>Configura el batch para ver los resultados aquí.</p>
                                </CardContent>
                            </Card>
                        )
                    )}

                    {/* STOCK RESULTS */}
                    {activeTab === 'stock' && (
                        shoppingList ? (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="flex justify-between items-center px-2">
                                    <h3 className="font-semibold text-slate-800 dark:text-slate-200">Lista de Compra</h3>
                                    <Button variant="outline" size="sm" onClick={() => exportToCSV(shoppingList, 'lista_compra')} className="text-xs bg-white/50 backdrop-blur-sm border-white/20 hover:bg-white/80">
                                        <Icon svg={ICONS.fileText} className="mr-2 h-4 w-4" /> CSV
                                    </Button>
                                </div>

                                <div className="flex flex-col gap-3">
                                    {shoppingList.map((item, index) => (
                                        <div key={index} className="p-4 rounded-xl bg-white/70 dark:bg-slate-900/60 backdrop-blur-md border border-white/20 dark:border-white/5 shadow-sm">
                                            <div className="flex justify-between items-start mb-2">
                                                <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">{item['Ingrediente']}</p>
                                                <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                                                    {item['Botellas a Pedir']}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 text-right">
                                                {item['Unidades (Compra)']}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <Card className="h-full flex items-center justify-center p-6 bg-white/40 dark:bg-slate-900/20 border-white/20 dark:border-white/5">
                                <CardContent className="text-center text-muted-foreground flex flex-col items-center">
                                    <Icon svg={ICONS.box} className="w-12 h-12 mb-4 opacity-20" />
                                    <p>Genera una proyección para ver la lista de compra.</p>
                                </CardContent>
                            </Card>
                        )
                    )}
                </div>
            }
        />
    );
};

export default EscandallatorView;
