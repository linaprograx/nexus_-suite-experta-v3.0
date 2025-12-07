import * as React from 'react';
import { collection, doc, addDoc, deleteDoc, writeBatch, Firestore, serverTimestamp } from 'firebase/firestore';
import { Ingredient, Recipe, ViewName } from '../../types';
import { parseMultipleRecipes } from '../utils/recipeImporter';
import { importPdfRecipes } from '../modules/pdf/importPdfRecipes';
import { useApp } from '../context/AppContext';
import { parseEuroNumber } from "../utils/parseEuroNumber";
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Icon } from '../components/ui/Icon';
import { Modal } from '../components/ui/Modal';
import { ICONS } from '../components/ui/icons';
import { IngredientFormModal } from '../components/grimorium/IngredientFormModal';
import { FiltersSidebar } from '../components/grimorium/FiltersSidebar';
import { RecipeList } from '../components/grimorium/RecipeList';
import { RecipeDetailPanel } from '../components/grimorium/RecipeDetailPanel';
import { IngredientListPanel } from '../components/grimorium/IngredientListPanel';
import { IngredientDetailPanel } from '../components/grimorium/IngredientDetailPanel';
import { PremiumLayout } from '../components/layout/PremiumLayout';
import { useDebounce } from '../hooks/useDebounce';
import { RecipeToolbar } from '../components/grimorium/RecipeToolbar';
import { IngredientToolbar } from '../components/grimorium/IngredientToolbar';
import { exportToCSV } from '../utils/exportToCSV';
import { Card, CardContent } from '../components/ui/Card';

// Escandallator Imports
import EscandalloTab from '../components/escandallator/EscandalloTab';
import BatcherTab from '../components/escandallator/BatcherTab';
import StockManagerTab from '../components/escandallator/StockManagerTab';
import EscandalloHistorySidebar from '../components/escandallator/EscandalloHistorySidebar';
import EscandalloSummaryCard from '../components/escandallator/EscandalloSummaryCard';
import BatcherSidebar from '../components/escandallator/BatcherSidebar';
import StockSidebar from '../components/escandallator/StockSidebar';

interface GrimoriumViewProps {
    db: Firestore;
    userId: string;
    appId: string;
    allIngredients: Ingredient[];
    allRecipes: Recipe[];
    onOpenRecipeModal: (recipe: Partial<Recipe> | null) => void;
    onDragRecipeStart: (recipe: Recipe) => void;
    setCurrentView: (view: ViewName) => void;
}

const GrimoriumView: React.FC<GrimoriumViewProps> = ({ db, userId, appId, allIngredients, allRecipes, onOpenRecipeModal, onDragRecipeStart, setCurrentView }) => {
    const { storage } = useApp();
    const [loading, setLoading] = React.useState(false);

    // --- State ---
    const [activeTab, setActiveTab] = React.useState<'recipes' | 'ingredients' | 'escandallo' | 'batcher' | 'stock'>('recipes');

    // Grimorium State
    const [recipeSearch, setRecipeSearch] = React.useState("");
    const [ingredientSearch, setIngredientSearch] = React.useState("");
    const [selectedRecipeId, setSelectedRecipeId] = React.useState<string | null>(null);
    const [filters, setFilters] = React.useState({ category: 'all', status: 'all' });
    const [ingredientFilters, setIngredientFilters] = React.useState({ category: 'all', status: 'all' });
    const [selectedIngredients, setSelectedIngredients] = React.useState<string[]>([]);
    const [selectedIngredientId, setSelectedIngredientId] = React.useState<string | null>(null);

    // Modals
    const [showIngredientModal, setShowIngredientModal] = React.useState(false);
    const [editingIngredient, setEditingIngredient] = React.useState<Ingredient | null>(null);
    const [showCsvImportModal, setShowCsvImportModal] = React.useState(false);
    const [showTxtImportModal, setShowTxtImportModal] = React.useState(false);
    const [showPdfImportModal, setShowPdfImportModal] = React.useState(false);
    const [useOcr, setUseOcr] = React.useState(false);
    const [showIngredientsManager, setShowIngredientsManager] = React.useState(false);
    const [isToolOpen, setIsToolOpen] = React.useState(false);

    // --- Escandallator State ---
    const [selectedEscandalloRecipe, setSelectedEscandalloRecipe] = React.useState<Recipe | null>(null);
    const [precioVenta, setPrecioVenta] = React.useState<number>(0);
    const escandallosColPath = `users/${userId}/escandallo-history`;
    const [batchResult, setBatchResult] = React.useState<any>(null);
    const [shoppingList, setShoppingList] = React.useState<any[] | null>(null);

    // --- Debounce ---
    const debouncedRecipeSearch = useDebounce(recipeSearch, 300);
    const debouncedIngredientSearch = useDebounce(ingredientSearch, 300);

    const ingredientsColPath = `artifacts/${appId}/users/${userId}/grimorio-ingredients`;

    // --- Grimorium Helpers ---
    const handleDeleteRecipe = async (recipeId: string) => {
        if (window.confirm("¿Seguro que quieres eliminar esta receta?")) {
            await deleteDoc(doc(db, `users/${userId}/grimorio`, recipeId));
            setSelectedRecipeId(null);
        }
    };

    const handleDeleteIngredient = async (ing: Ingredient) => {
        if (window.confirm(`¿Seguro que quieres eliminar ${ing.nombre}?`)) {
            await deleteDoc(doc(db, ingredientsColPath, ing.id));
            if (selectedIngredients.includes(ing.id)) handleSelectIngredient(ing.id);
            if (selectedIngredientId === ing.id) setSelectedIngredientId(null);
        }
    };

    React.useEffect(() => {
        // Reset selections when switching tabs? Maybe only for Grimorium tabs.
        if (activeTab === 'recipes') setSelectedIngredientId(null);
        if (activeTab === 'ingredients') setSelectedRecipeId(null);
    }, [activeTab]);

    const handleSelectIngredient = (id: string) => {
        setSelectedIngredients(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const handleDeleteSelectedIngredients = async () => {
        if (window.confirm(`¿Seguro que quieres eliminar ${selectedIngredients.length} ingredientes?`)) {
            const batch = writeBatch(db);
            selectedIngredients.forEach(id => batch.delete(doc(db, ingredientsColPath, id)));
            await batch.commit();
            setSelectedIngredients([]);
            setSelectedIngredientId(null);
        }
    };

    // --- Imports ---
    const handleTxtImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !db || !userId) return;
        setLoading(true);
        try {
            const text = await file.text();
            const newRecipes = parseMultipleRecipes(text, allIngredients);
            if (newRecipes.length === 0) return alert("No se encontraron recetas válidas.");
            const batch = writeBatch(db);
            const recipesCollection = collection(db, `users/${userId}/grimorio`);
            newRecipes.forEach(recipe => batch.set(doc(recipesCollection), recipe));
            await batch.commit();
            alert(`${newRecipes.length} recetas importadas.`);
        } catch (error) { console.error(error); alert("Error importando TXT."); } finally { setLoading(false); setShowTxtImportModal(false); }
    };

    const handlePdfImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !db || !userId || !storage) return;
        setLoading(true);
        try {
            const newRecipes = await importPdfRecipes(file, db, storage, userId, allIngredients, useOcr);
            if (newRecipes.length === 0) return alert("No se encontraron recetas.");
            const batch = writeBatch(db);
            const recipesCollection = collection(db, `users/${userId}/grimorio`);
            newRecipes.forEach(recipe => batch.set(doc(recipesCollection), recipe));
            await batch.commit();
            alert(`${newRecipes.length} recetas importadas.`);
        } catch (error) { console.error(error); alert("Error importando PDF."); } finally { setLoading(false); setShowPdfImportModal(false); }
    };

    const handleCsvImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !db || !userId) return;
        setLoading(true);
        const reader = new FileReader();
        reader.onload = async (e) => {
            const text = e.target?.result as string;
            if (!text) return;
            const rows = text.split('\n').slice(1);
            const batch = writeBatch(db);
            let count = 0;
            for (const row of rows) {
                if (!row.trim()) continue;
                const cols = row.split(text.includes(';') ? ';' : ',');
                if (!cols[0]) continue;
                batch.set(doc(collection(db, ingredientsColPath)), {
                    nombre: cols[0].trim(), categoria: cols[1]?.trim() || 'General',
                    precioCompra: parseEuroNumber(cols[2]), unidadCompra: cols[3]?.trim() || 'und'
                });
                count++;
            }
            await batch.commit();
            alert(`${count} ingredientes importados.`);
            setLoading(false);
            setShowCsvImportModal(false);
        };
        reader.readAsText(file);
    };

    // --- Memos (Grimorium) ---
    const filteredIngredients = React.useMemo(() => {
        return allIngredients.filter(ing => {
            const matchesSearch = ing.nombre.toLowerCase().includes(debouncedIngredientSearch.toLowerCase());
            const matchesCategory = ingredientFilters.category === 'all' || ing.categoria === ingredientFilters.category;
            const stock = (ing as any).stockActual || 0;
            let matchesStatus = true;
            if (ingredientFilters.status === 'low') matchesStatus = stock > 0 && stock < 3;
            else if (ingredientFilters.status === 'out') matchesStatus = stock <= 0;
            return matchesSearch && matchesCategory && matchesStatus;
        });
    }, [allIngredients, debouncedIngredientSearch, ingredientFilters]);

    const filteredRecipes = React.useMemo(() => {
        return allRecipes.filter(rec => {
            const matchesSearch = rec.nombre.toLowerCase().includes(debouncedRecipeSearch.toLowerCase());
            const matchesCategory = filters.category === 'all' || rec.categorias?.includes(filters.category);
            const matchesStatus = filters.status === 'all' || rec.categorias?.includes(filters.status);
            return matchesSearch && matchesCategory && matchesStatus;
        });
    }, [allRecipes, debouncedRecipeSearch, filters]);

    const selectedRecipe = React.useMemo(() => allRecipes.find(r => r.id === selectedRecipeId) || null, [allRecipes, selectedRecipeId]);
    const selectedIngredient = React.useMemo(() => allIngredients.find(i => i.id === selectedIngredientId) || null, [allIngredients, selectedIngredientId]);
    const stats = React.useMemo(() => ({
        total: allRecipes.length,
        ideas: allRecipes.filter(r => r.categorias?.includes('Idea')).length,
        inProgress: allRecipes.filter(r => r.categorias?.includes('Pruebas')).length,
        done: allRecipes.filter(r => r.categorias?.includes('Carta')).length
    }), [allRecipes]);

    const handleDuplicateRecipe = async (recipe: Recipe) => {
        const { id, ...rest } = recipe;
        await addDoc(collection(db, `users/${userId}/grimorio`), { ...rest, nombre: `${recipe.nombre} (Copia)` });
    };

    // --- Escandallator Logic ---
    const escandalloData = React.useMemo(() => {
        if (!selectedEscandalloRecipe || precioVenta <= 0) return null;
        const IVA_RATE = 0.21;
        const costo = selectedEscandalloRecipe.costoReceta || 0;
        const baseImponible = precioVenta / (1 + IVA_RATE);
        const ivaSoportado = precioVenta - baseImponible;
        const margenBruto = baseImponible - costo;
        const rentabilidad = baseImponible > 0 ? (margenBruto / baseImponible) * 100 : 0;
        return {
            report: { costo, precioVenta, baseImponible, ivaSoportado, margenBruto, rentabilidad },
            pie: [{ name: 'Costo', value: costo }, { name: 'Margen', value: margenBruto }, { name: 'IVA', value: ivaSoportado }]
        };
    }, [selectedEscandalloRecipe, precioVenta]);

    const handleSaveToHistory = async (reportData: any) => {
        if (!selectedEscandalloRecipe) return;
        const { baseImponible, ...dataToSave } = reportData;
        await addDoc(collection(db, escandallosColPath), {
            recipeId: selectedEscandalloRecipe.id, recipeName: selectedEscandalloRecipe.nombre, ...dataToSave, createdAt: serverTimestamp()
        });
        alert('Escandallo guardado en el historial.');
    };

    const handleLoadHistory = (item: any) => {
        const recipe = allRecipes.find(r => r.id === item.recipeId) || null;
        if (recipe) { setSelectedEscandalloRecipe(recipe); setPrecioVenta(item.precioVenta); }
    };

    const handleSaveBatchToPizarron = async () => {
        if (!batchResult) return;
        const { meta } = batchResult;
        await addDoc(collection(db, `artifacts/${appId}/public/data/pizarron-tasks`), {
            content: `[Batch] Producir ${meta.targetQuantity} ${meta.targetUnit} de ${meta.recipeName}. Dilución: ${meta.includeDilution ? 'Sí' : 'No'}`,
            status: 'Ideas', category: 'Desarrollo', createdAt: serverTimestamp(), boardId: 'general'
        });
        alert("Tarea de batch guardada en el Pizarrón.");
    };

    // --- Dynamic Props Calculation ---
    // Calculate colors and gradient based on activeTab
    const currentGradient = activeTab === 'recipes' ? 'indigo' :
        activeTab === 'ingredients' ? 'emerald' :
            activeTab === 'escandallo' ? 'red' :
                activeTab === 'batcher' ? 'yellow' :
                    activeTab === 'stock' ? 'ice' : 'slate';

    return (
        <PremiumLayout
            gradientTheme={currentGradient}
            className="lg:!grid-cols-[200px,minmax(0,1fr),320px]"
            header={
                <div className="flex items-center gap-2 bg-slate-100/80 dark:bg-slate-900/80 p-1 rounded-full w-fit max-w-full overflow-x-auto no-scrollbar shadow-sm border border-slate-200 dark:border-slate-800">
                    <button onClick={() => setActiveTab('recipes')} className={`flex-shrink-0 py-2 px-5 text-sm font-semibold rounded-full transition-all duration-300 ${activeTab === 'recipes' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800'}`}>Recetas</button>
                    <button onClick={() => setActiveTab('ingredients')} className={`flex-shrink-0 py-2 px-5 text-sm font-semibold rounded-full transition-all duration-300 ${activeTab === 'ingredients' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800'}`}>Ingredientes</button>
                    <button onClick={() => setActiveTab('escandallo')} className={`flex-shrink-0 py-2 px-5 text-sm font-semibold rounded-full transition-all duration-300 ${activeTab === 'escandallo' ? 'bg-red-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800'}`}>Escandallo</button>
                    <button onClick={() => setActiveTab('batcher')} className={`flex-shrink-0 py-2 px-5 text-sm font-semibold rounded-full transition-all duration-300 ${activeTab === 'batcher' ? 'bg-amber-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800'}`}>Batcher</button>
                    <button onClick={() => setActiveTab('stock')} className={`flex-shrink-0 py-2 px-5 text-sm font-semibold rounded-full transition-all duration-300 ${activeTab === 'stock' ? 'bg-sky-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800'}`}>Stock</button>
                </div>
            }
            leftSidebar={
                <>
                    {(activeTab === 'recipes' || activeTab === 'ingredients') && (
                        <FiltersSidebar
                            activeTab={activeTab === 'recipes' ? 'recipes' : 'ingredients'}
                            allRecipes={allRecipes}
                            selectedRecipe={selectedRecipe}
                            allIngredients={allIngredients}
                            selectedIngredient={selectedIngredient}
                            onImportRecipes={() => setShowTxtImportModal(true)}
                            onImportPdf={() => setShowPdfImportModal(true)}
                            onOpenIngredients={() => setActiveTab('ingredients')}
                            onImportIngredients={() => setShowCsvImportModal(true)}
                            stats={stats}
                            ingredientSearchTerm=""
                            onIngredientSearchChange={() => { }}
                            ingredientFilters={{}}
                            onIngredientFilterChange={() => { }}
                        />
                    )}
                    {activeTab === 'escandallo' && (
                        <EscandalloHistorySidebar db={db} escandallosColPath={escandallosColPath} onLoadHistory={handleLoadHistory} />
                    )}
                    {activeTab === 'batcher' && <BatcherSidebar />}
                    {activeTab === 'stock' && <StockSidebar />}
                </>
            }
            mainContent={
                <div className="h-full flex flex-col bg-transparent p-0">
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {activeTab === 'recipes' && (
                            <RecipeList
                                recipes={filteredRecipes}
                                selectedRecipeId={selectedRecipeId}
                                onSelectRecipe={(r) => setSelectedRecipeId(r.id)}
                                onAddRecipe={() => onOpenRecipeModal(null)}
                                onDragStart={onDragRecipeStart ? (e, r) => onDragRecipeStart(r) : undefined}
                                searchTerm={recipeSearch}
                                onSearchChange={setRecipeSearch}
                                selectedCategory={filters.category}
                                onCategoryChange={(cat) => setFilters(prev => ({ ...prev, category: cat }))}
                                availableCategories={['Coctel', 'Mocktail', 'Preparacion', 'Otro', ...new Set(allRecipes.flatMap(r => r.categorias || []))]}
                                selectedStatus={filters.status}
                                onStatusChange={(stat) => setFilters(prev => ({ ...prev, status: stat }))}
                                onDelete={() => selectedRecipeId && handleDeleteRecipe(selectedRecipeId)}
                            />
                        )}
                        {activeTab === 'ingredients' && (
                            <IngredientListPanel
                                ingredients={filteredIngredients}
                                selectedIngredientIds={selectedIngredients}
                                viewingIngredientId={selectedIngredientId}
                                onToggleSelection={handleSelectIngredient}
                                onSelectAll={(selected) => setSelectedIngredients(selected ? filteredIngredients.map(i => i.id) : [])}
                                onDeleteSelected={handleDeleteSelectedIngredients}
                                onImportCSV={() => setShowCsvImportModal(true)}
                                onEditIngredient={(ing) => setSelectedIngredientId(ing.id)}
                                onNewIngredient={() => { setEditingIngredient(null); setShowIngredientModal(true); }}
                                ingredientSearchTerm={ingredientSearch}
                                onIngredientSearchChange={setIngredientSearch}
                                ingredientFilters={ingredientFilters}
                                onIngredientFilterChange={(k, v) => setIngredientFilters(prev => ({ ...prev, [k]: v }))}
                            />
                        )}
                        {activeTab === 'escandallo' && (
                            <EscandalloTab
                                allRecipes={allRecipes}
                                selectedRecipe={selectedEscandalloRecipe}
                                precioVenta={precioVenta}
                                onSelectRecipe={setSelectedEscandalloRecipe}
                                onPriceChange={setPrecioVenta}
                            />
                        )}
                        {activeTab === 'batcher' && (
                            <BatcherTab db={db} appId={appId} allRecipes={allRecipes} setBatchResult={setBatchResult} />
                        )}
                        {activeTab === 'stock' && (
                            <StockManagerTab allRecipes={allRecipes} allIngredients={allIngredients} setShoppingList={setShoppingList} />
                        )}
                    </div>
                </div>
            }
            rightSidebar={
                <div className={`h-full ${((activeTab === 'recipes' && selectedRecipe) || (activeTab === 'ingredients' && selectedIngredient) || activeTab === 'escandallo' || activeTab === 'batcher' || activeTab === 'stock') ? '' : 'hidden lg:block opacity-50 pointer-events-none'}`}>
                    {/* RECIPES DETAIL */}
                    {activeTab === 'recipes' && selectedRecipe && (
                        <RecipeDetailPanel
                            recipe={selectedRecipe}
                            allIngredients={allIngredients}
                            onEdit={(r) => onOpenRecipeModal(r)}
                            onDelete={(r) => handleDeleteRecipe(r.id)}
                            onDuplicate={handleDuplicateRecipe}
                            onToolToggle={setIsToolOpen}
                            onNavigate={(view, data) => setCurrentView(view)}
                        />
                    )}

                    {/* INGREDIENTS DETAIL */}
                    {activeTab === 'ingredients' && selectedIngredient && (
                        <IngredientDetailPanel
                            ingredient={selectedIngredient}
                            onEdit={(ing) => { setEditingIngredient(ing); setShowIngredientModal(true); }}
                            onDelete={(ing) => handleDeleteIngredient(ing)}
                            onClose={() => setSelectedIngredientId(null)}
                        />
                    )}

                    {/* ESCANDALLO RESULTS */}
                    {activeTab === 'escandallo' && (
                        escandalloData ? (
                            <EscandalloSummaryCard
                                recipeName={selectedEscandalloRecipe?.nombre || 'Receta'}
                                reportData={escandalloData.report}
                                pieData={escandalloData.pie}
                                onSaveHistory={handleSaveToHistory}
                                onExport={() => window.print()}
                            />
                        ) : (
                            <EmptyState icon={ICONS.chart} text="Resultados" subtext="Selecciona una receta para ver el análisis." />
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
                                    <Button size="sm" onClick={handleSaveBatchToPizarron} className="bg-emerald-600 hover:bg-emerald-700 text-white"><Icon svg={ICONS.check} className="w-4 h-4" /></Button>
                                </div>
                                <div className="flex flex-col gap-3">
                                    {batchResult.data.map((row: any, i: number) => (
                                        <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/80 dark:bg-slate-900/70 backdrop-blur-md border border-white/20 dark:border-white/5 shadow-sm">
                                            <span className="font-medium text-sm text-slate-800 dark:text-slate-200">{row.ingredient}</span>
                                            <span className="block text-lg font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{row.batchQty}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <Card className="h-full flex items-center justify-center p-6 bg-white/40 dark:bg-slate-900/20 border-white/20 dark:border-white/5">
                                <CardContent className="text-center text-muted-foreground flex flex-col items-center">
                                    <Icon svg={ICONS.layers} className="w-12 h-12 mb-4 opacity-20" />
                                    <p>Configura el batch para ver resultados.</p>
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
                                    <Button variant="outline" size="sm" onClick={() => exportToCSV(shoppingList, 'lista_compra')} className="text-xs bg-white/50 backdrop-blur-sm border-white/20 hover:bg-white/80"><Icon svg={ICONS.fileText} className="mr-2 h-4 w-4" /> CSV</Button>
                                </div>
                                <div className="flex flex-col gap-3">
                                    {shoppingList.map((item, index) => (
                                        <div key={index} className="p-4 rounded-xl bg-white/70 dark:bg-slate-900/60 backdrop-blur-md border border-white/20 dark:border-white/5 shadow-sm">
                                            <div className="flex justify-between items-start mb-2">
                                                <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">{item['Ingrediente']}</p>
                                                <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{item['Botellas a Pedir']}</span>
                                            </div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 text-right">{item['Unidades (Compra)']}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <Card className="h-full flex items-center justify-center p-6 bg-white/40 dark:bg-slate-900/20 border-white/20 dark:border-white/5">
                                <CardContent className="text-center text-muted-foreground flex flex-col items-center">
                                    <Icon svg={ICONS.box} className="w-12 h-12 mb-4 opacity-20" />
                                    <p>Genera una proyección.</p>
                                </CardContent>
                            </Card>
                        )
                    )}

                    {/* Empty State Fallback for Recipes/Ingredients when nothing selected */}
                    {(!selectedRecipe && activeTab === 'recipes') && (
                        <div className="h-full flex items-center justify-center text-slate-400 text-center p-8">
                            <div>
                                <Icon svg={ICONS.book} className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                <p>Selecciona una receta.</p>
                            </div>
                        </div>
                    )}
                    {(!selectedIngredient && activeTab === 'ingredients') && (
                        <div className="h-full flex items-center justify-center text-slate-400 text-center p-8">
                            <div>
                                <Icon svg={ICONS.beaker} className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                <p>Selecciona un ingrediente.</p>
                            </div>
                        </div>
                    )}
                </div>
            }
        >
            {/* Mobile Overlays */}
            {selectedRecipe && activeTab === 'recipes' && (
                <div className="lg:hidden fixed inset-0 z-50 bg-white dark:bg-slate-950 p-4 overflow-y-auto">
                    <Button size="icon" variant="ghost" onClick={() => setSelectedRecipeId(null)} className="absolute top-4 right-4"><Icon svg={ICONS.x} /></Button>
                    <RecipeDetailPanel recipe={selectedRecipe} allIngredients={allIngredients} onEdit={(r) => onOpenRecipeModal(r)} onDelete={(r) => handleDeleteRecipe(r.id)} onDuplicate={handleDuplicateRecipe} onToolToggle={setIsToolOpen} onNavigate={(view, data) => setCurrentView(view)} />
                </div>
            )}
            {selectedIngredient && activeTab === 'ingredients' && (
                <div className="lg:hidden fixed inset-0 z-50 bg-white dark:bg-slate-950 p-4 overflow-y-auto">
                    <Button size="icon" variant="ghost" onClick={() => setSelectedIngredientId(null)} className="absolute top-4 right-4"><Icon svg={ICONS.x} /></Button>
                    <IngredientDetailPanel ingredient={selectedIngredient} onEdit={(ing) => { setEditingIngredient(ing); setShowIngredientModal(true); }} onDelete={(ing) => handleDeleteIngredient(ing)} onClose={() => setSelectedIngredientId(null)} />
                </div>
            )}

            {/* Modals */}
            {showIngredientModal && <IngredientFormModal isOpen={showIngredientModal} onClose={() => setShowIngredientModal(false)} db={db} userId={userId} appId={appId} editingIngredient={editingIngredient} />}
            <Modal isOpen={showCsvImportModal} onClose={() => setShowCsvImportModal(false)} title="Importar Ingredientes CSV"><div className="space-y-4 p-4"><p className="text-sm text-slate-500">Formato: Nombre;Categoria;Precio;Unidad.</p><Input type="file" accept=".csv" onChange={handleCsvImport} /></div></Modal>
            <Modal isOpen={showTxtImportModal} onClose={() => setShowTxtImportModal(false)} title="Importar Recetas TXT"><div className="space-y-4 p-4"><p className="text-sm text-slate-500">Formato Nexus TXT.</p><Input type="file" accept=".txt" onChange={handleTxtImport} /></div></Modal>
            <Modal isOpen={showPdfImportModal} onClose={() => setShowPdfImportModal(false)} title="Importar Recetas PDF PRO"><div className="space-y-4 p-4"><div className="flex items-center gap-2 mb-2"><input type="checkbox" checked={useOcr} onChange={() => setUseOcr(!useOcr)} id="ocr" /><label htmlFor="ocr">Usar OCR</label></div><Input type="file" accept=".pdf" onChange={handlePdfImport} /></div></Modal>
        </PremiumLayout>
    );
};

const EmptyState = ({ icon, text, subtext }: { icon: string, text: string, subtext: string }) => (
    <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
        <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full mb-3">
            <Icon svg={icon} className="w-8 h-8 text-slate-300" />
        </div>
        <p className="text-lg font-medium text-slate-500 dark:text-slate-400">{text}</p>
        <p className="text-sm mt-1 max-w-[200px]">{subtext}</p>
    </div>
);

export default GrimoriumView;
