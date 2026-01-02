import React from 'react';
import { Firestore, addDoc, collection, serverTimestamp, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { Recipe, Ingredient } from '../types';
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
import { StockItemDetailPanel } from '../components/escandallator/StockItemDetailPanel';
import { IngredientFormModal } from '../components/grimorium/IngredientFormModal';
import { usePurchaseIngredient } from '../hooks/usePurchaseIngredient';
import { buildStockFromPurchases, calculateInventoryMetrics, StockItem } from '../utils/stockUtils';
import { evaluateStockSignals } from '../core/signals/signal.engine';
import { generateAssistedInsights } from '../core/assisted/assisted.engine';
import { generateActiveSuggestions } from '../core/active/active.engine';
import { useCapabilities } from '../context/AppContext';
import { calculateEscandallo } from '../core/finance/cost.engine';


interface EscandallatorViewProps {
    db: Firestore;
    userId: string;
    appId: string;
    allRecipes: Recipe[];
    allIngredients: Ingredient[];
}

const EscandallatorView: React.FC<EscandallatorViewProps> = ({ db, userId, appId, allRecipes, allIngredients }) => {
    const [activeTab, setActiveTab] = React.useState<'escandallo' | 'batcher' | 'stock'>('escandallo');
    const { hasLayer } = useCapabilities();

    // Escandallo State
    const [selectedRecipe, setSelectedRecipe] = React.useState<Recipe | null>(null);
    const [precioVenta, setPrecioVenta] = React.useState<number>(0);
    const escandallosColPath = `users/${userId}/escandallo-history`;

    // Batcher State
    const [batchResult, setBatchResult] = React.useState<any>(null);
    const [batchRecipeId, setBatchRecipeId] = React.useState<string>('');
    const [targetQty, setTargetQty] = React.useState<string>('1000');
    const [targetUnit, setTargetUnit] = React.useState<'Litros' | 'Botellas'>('Litros');
    const [includeDilution, setIncludeDilution] = React.useState<boolean>(true);

    // Stock State (Lifted)
    const { purchaseHistory: purchases } = usePurchaseIngredient();
    const stockItems = React.useMemo(() => buildStockFromPurchases(purchases), [purchases]);
    const [selectedStockItem, setSelectedStockItem] = React.useState<StockItem | null>(null);

    // Stock Edit State
    const [showIngredientModal, setShowIngredientModal] = React.useState(false);
    const [editingIngredient, setEditingIngredient] = React.useState<Ingredient | null>(null);

    // Derived Shopping List (Calculated in Tab usually, but we keep it here if needed for export)
    const [shoppingList, setShoppingList] = React.useState<any[] | null>(null);

    // --- INTELLIGENCE LAYER (Stock) ---
    const stockSignals = React.useMemo(() => {
        if (!hasLayer('assisted_intelligence')) return [];
        let signals: any[] = [];
        stockItems.forEach(item => {
            signals = [...signals, ...evaluateStockSignals({ stockItem: item })];
        });
        return signals;
    }, [stockItems, hasLayer]);

    const assistedInsights = React.useMemo(() => {
        if (!hasLayer('assisted_intelligence')) return [];
        return generateAssistedInsights({
            signals: stockSignals,
            contextHints: [],
            domain: {
                market: { ingredients: allIngredients, selectedIngredient: null },
                recipes: [],
                stock: { items: stockItems }
            }
        });
    }, [stockSignals, allIngredients, stockItems, hasLayer]);

    const activeSuggestions = React.useMemo(() => {
        if (!hasLayer('active_intelligence')) return [];
        return generateActiveSuggestions(assistedInsights);
    }, [assistedInsights, hasLayer]);

    // --- REAL COST CALCULATION ---
    // --- Cost Engine (Shared) ---
    const escandalloData = React.useMemo(() => {
        return calculateEscandallo(selectedRecipe, precioVenta, allIngredients);
    }, [selectedRecipe, precioVenta, allIngredients]);

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




    // Stock Actions
    const handleEditStockItem = (item: StockItem) => {
        console.group("handleEditStockItem Triggered");
        console.log("Item:", item.ingredientName);
        console.trace("Call Stack");
        console.groupEnd();

        const ingredient = allIngredients.find(i => i.id === item.ingredientId);
        if (ingredient) {
            setEditingIngredient(ingredient);
            setShowIngredientModal(true);
            // alert("DEBUG: Edit Modal Triggered! This implies the Edit function was called.");
        } else {
            alert("Error: Ingrediente no encontrado en la base de datos de Grimorio.");
        }
    };

    const handleDeleteStockItem = async (item: StockItem) => {
        if (window.confirm(`¿Seguro que quieres eliminar ${item.ingredientName} del inventario? Esto eliminará el ingrediente de Grimorio y afectará a los cálculos de costes.`)) {
            try {
                await deleteDoc(doc(db, `artifacts/${appId}/users/${userId}/grimorio-ingredients`, item.ingredientId));
                setSelectedStockItem(null);
                alert("Ingrediente eliminado.");
            } catch (e) {
                console.error("Error deleting ingredient", e);
                alert("Error al eliminar.");
            }
        }
    };

    const onStockItemSelectedHandler = (item: StockItem) => {
        console.log("Selecting Stock Item (Handler):", item);
        setSelectedStockItem(item);
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
        <React.Fragment>
            <PremiumLayout
                gradientTheme="emerald"
                leftSidebar={
                    activeTab === 'escandallo' ? (
                        <EscandalloHistorySidebar
                            db={db}
                            escandallosColPath={escandallosColPath}
                            onLoadHistory={handleLoadHistory}
                            onNewEscandallo={() => {
                                setSelectedRecipe(null);
                                setPrecioVenta(0);
                            }}
                        />
                    ) : activeTab === 'batcher' ? (
                        <BatcherSidebar
                            onConfigureBatch={() => { }}
                        />
                    ) : (
                        // STOCK SIDEBAR: Always show Summary Sidebar in Left Sidebar
                        <StockSidebar activeSuggestions={activeSuggestions} />
                    )
                }
                mainContent={
                    <div className="premium-panel p-4 lg:p-6">
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
                                    selectedRecipeId={batchRecipeId}
                                    targetQuantity={targetQty}
                                    targetUnit={targetUnit}
                                    includeDilution={includeDilution}
                                    onRecipeChange={setBatchRecipeId}
                                    onQuantityChange={setTargetQty}
                                    onUnitChange={setTargetUnit}
                                    onDilutionChange={setIncludeDilution}
                                />
                            )}
                            {activeTab === 'stock' && (
                                <StockManagerTab
                                    allRecipes={allRecipes}
                                    allIngredients={allIngredients}
                                    setShoppingList={setShoppingList}
                                    stockItems={stockItems}
                                    purchases={purchases}
                                    assistedInsights={assistedInsights}
                                    onStockItemSelect={onStockItemSelectedHandler}
                                    selectedItemId={selectedStockItem?.ingredientId}
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

                        {/* STOCK DETAILS (Read-Only) */}
                        {activeTab === 'stock' && (
                            selectedStockItem ? (
                                <div className="h-full bg-white/30 dark:bg-slate-900/30 backdrop-blur-xl rounded-2xl border border-emerald-500/20 shadow-premium overflow-hidden">
                                    <StockItemDetailPanel
                                        stockItem={selectedStockItem}
                                        onEdit={handleEditStockItem}
                                        onDelete={handleDeleteStockItem}
                                        onClose={() => setSelectedStockItem(null)}
                                    />
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
                                    <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full mb-3">
                                        <Icon svg={ICONS.box} className="w-8 h-8 text-slate-300" />
                                    </div>
                                    <p className="text-lg font-medium text-slate-500 dark:text-slate-400">Detalle de Stock</p>
                                    <p className="text-sm mt-1 max-w-[200px]">Selecciona un ítem para ver su detalle (Modo Lectura).</p>
                                </div>
                            )
                        )}

                        {/* STOCK RESULTS */}
                        {activeTab === 'stock' && (
                            // Priority: Detail Panel > Shopping List > Placeholder
                            selectedStockItem ? (
                                <StockItemDetailPanel
                                    stockItem={selectedStockItem}
                                    onEdit={(item) => console.log("Edit disabled for testing", item)}
                                    // onEdit={handleEditStockItem}
                                    onDelete={handleDeleteStockItem}
                                    onClose={() => setSelectedStockItem(null)}
                                />
                            ) : shoppingList ? (
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

            {/* Ingredient Modal for Editing */}
            {showIngredientModal && (
                <IngredientFormModal
                    isOpen={showIngredientModal}
                    onClose={() => {
                        setShowIngredientModal(false);
                        setEditingIngredient(null);
                        // Optional: trigger reload of ingredients if not automatic
                    }}
                    db={db}
                    userId={userId}
                    appId={appId}
                    editingIngredient={editingIngredient}
                    theme="emerald"
                />
            )}
        </React.Fragment>
    );
};

export default EscandallatorView;
