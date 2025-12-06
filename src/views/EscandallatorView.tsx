import React from 'react';
import { Firestore, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { Recipe, Ingredient } from '../../types';
import { PremiumLayout } from '../components/layout/PremiumLayout';
import EscandalloTab from '../components/escandallator/EscandalloTab';
import BatcherTab from '../components/escandallator/BatcherTab';
import StockManagerTab from '../components/escandallator/StockManagerTab';
import EscandalloHistorySidebar from '../components/escandallator/EscandalloHistorySidebar';
import EscandalloSummaryCard from '../components/escandallator/EscandalloSummaryCard';
import { Card, CardContent } from '../components/ui/Card';
import { Icon } from '../components/ui/Icon';
import { ICONS } from '../components/ui/icons';

interface EscandallatorViewProps {
    db: Firestore;
    userId: string;
    appId: string;
    allRecipes: Recipe[];
    allIngredients: Ingredient[];
}

const EscandallatorView: React.FC<EscandallatorViewProps> = ({ db, userId, appId, allRecipes, allIngredients }) => {
    const [activeTab, setActiveTab] = React.useState<'escandallo' | 'batcher' | 'stock'>('escandallo');

    // Escandallo State (LBifted)
    const [selectedRecipe, setSelectedRecipe] = React.useState<Recipe | null>(null);
    const [precioVenta, setPrecioVenta] = React.useState<number>(0);
    const escandallosColPath = `users/${userId}/escandallo-history`;

    // Escandallo Calculations
    const escandalloData = React.useMemo(() => {
        if (!selectedRecipe || precioVenta <= 0) return null;

        const IVA_RATE = 0.21;
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
    }, [selectedRecipe, precioVenta]);

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
                ) : (
                    <div className="h-full bg-white/30 dark:bg-slate-900/10 backdrop-blur-sm rounded-2xl border border-white/10 dark:border-white/5 p-4 flex items-center justify-center text-slate-400 text-sm text-center">
                        <p>Funciones adicionales disponibles próximamente para {activeTab}.</p>
                    </div>
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
                                // allIngredients={allIngredients} // Not used in refined component
                                selectedRecipe={selectedRecipe}
                                precioVenta={precioVenta}
                                onSelectRecipe={setSelectedRecipe}
                                onPriceChange={setPrecioVenta}
                            />
                        )}
                        {activeTab === 'batcher' && <BatcherTab db={db} appId={appId} allRecipes={allRecipes} />}
                        {activeTab === 'stock' && <StockManagerTab allRecipes={allRecipes} allIngredients={allIngredients} />}
                    </div>
                </div>
            }
            rightSidebar={
                activeTab === 'escandallo' ? (
                    <div className="h-full overflow-y-auto custom-scrollbar">
                        {escandalloData ? (
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
                        )}
                    </div>
                ) : (
                    <Card className="h-full flex items-center justify-center p-6 bg-white/40 dark:bg-slate-900/20 border-white/20 dark:border-white/5">
                        <CardContent className="text-center text-muted-foreground">
                            <p>Panel informativo para {activeTab}</p>
                        </CardContent>
                    </Card>
                )
            }
        />
    );
};

export default EscandallatorView;

