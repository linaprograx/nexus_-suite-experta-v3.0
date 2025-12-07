import * as React from 'react';
import { collection, doc, addDoc, deleteDoc, writeBatch, Firestore } from 'firebase/firestore';
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
import { IngredientDetailPanel } from '../components/grimorium/IngredientDetailPanel'; // NEW
import { PremiumLayout } from '../components/layout/PremiumLayout'; // NEW
import { useDebounce } from '../hooks/useDebounce'; // NEW

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
    const [activeTab, setActiveTab] = React.useState<'recipes' | 'ingredients'>('recipes');
    const [recipeSearch, setRecipeSearch] = React.useState("");
    const [ingredientSearch, setIngredientSearch] = React.useState("");
    const [selectedRecipeId, setSelectedRecipeId] = React.useState<string | null>(null);
    const [filters, setFilters] = React.useState({ category: 'all', status: 'all' });
    const [selectedIngredients, setSelectedIngredients] = React.useState<string[]>([]);

    // Modals
    const [showIngredientModal, setShowIngredientModal] = React.useState(false);
    const [editingIngredient, setEditingIngredient] = React.useState<Ingredient | null>(null);
    const [showCsvImportModal, setShowCsvImportModal] = React.useState(false);
    const [showTxtImportModal, setShowTxtImportModal] = React.useState(false);
    const [showPdfImportModal, setShowPdfImportModal] = React.useState(false);
    const [useOcr, setUseOcr] = React.useState(false);
    const [showIngredientsManager, setShowIngredientsManager] = React.useState(false);

    const [isToolOpen, setIsToolOpen] = React.useState(false);

    // --- Debounce for Search ---
    const debouncedRecipeSearch = useDebounce(recipeSearch, 300);
    const debouncedIngredientSearch = useDebounce(ingredientSearch, 300);

    const ingredientsColPath = `artifacts/${appId}/users/${userId}/grimorio-ingredients`;

    // --- Handlers ---
    const handleDeleteRecipe = async (recipeId: string) => {
        if (window.confirm("¿Seguro que quieres eliminar esta receta?")) {
            await deleteDoc(doc(db, `users/${userId}/grimorio`, recipeId));
            setSelectedRecipeId(null);
        }
    };

    const handleDeleteIngredient = async (ing: Ingredient) => {
        if (window.confirm(`¿Seguro que quieres eliminar ${ing.nombre}?`)) {
            await deleteDoc(doc(db, ingredientsColPath, ing.id));
            // Also remove from selected ingredients list if present
            if (selectedIngredients.includes(ing.id)) {
                handleSelectIngredient(ing.id); // Toggle off
            }
            // Also clear viewing selection if it was the one
            if (selectedRecipeId === ing.id) { // Reusing selectedRecipeId state variable for ingredient ID when in ingredient mode might be confusing. Better separate them.
                // Actually, let's look at the `selectedRecipe` memo. It derives from `selectedRecipeId`.
                // We should add `selectedIngredientId` state.
            }
        }
    };

    const [selectedIngredientId, setSelectedIngredientId] = React.useState<string | null>(null);

    // Effect to clear selections when switching tabs
    React.useEffect(() => {
        if (activeTab === 'recipes') setSelectedIngredientId(null);
        else setSelectedRecipeId(null);
    }, [activeTab]);

    const handleSelectIngredient = (id: string) => {
        setSelectedIngredients(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleSelectAllIngredients = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedIngredients(allIngredients.map(i => i.id));
        } else {
            setSelectedIngredients([]);
        }
    };

    const handleDeleteSelectedIngredients = async () => {
        if (window.confirm(`¿Seguro que quieres eliminar ${selectedIngredients.length} ingredientes?`)) {
            const batch = writeBatch(db);
            selectedIngredients.forEach(id => {
                batch.delete(doc(db, ingredientsColPath, id));
            });
            await batch.commit();
            setSelectedIngredients([]);
            setSelectedIngredientId(null);
        }
    };

    // --- Imports Handlers (Unified Logic later?) ---
    const handleTxtImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !db || !userId) return;
        setLoading(true);
        try {
            const text = await file.text();
            const newRecipes = parseMultipleRecipes(text, allIngredients);
            if (newRecipes.length === 0) {
                alert("No se encontraron recetas válidas en el archivo.");
                return;
            }
            const batch = writeBatch(db);
            const recipesCollection = collection(db, `users/${userId}/grimorio`);
            newRecipes.forEach(recipe => {
                const newDocRef = doc(recipesCollection);
                batch.set(newDocRef, recipe);
            });
            await batch.commit();
            alert(`${newRecipes.length} recetas importadas exitosamente.`);
        } catch (error) {
            console.error("Error al importar recetas desde TXT:", error);
            alert("Ocurrió un error importando.");
        } finally {
            setLoading(false);
            setShowTxtImportModal(false);
            if (event.target) event.target.value = '';
        }
    };

    const handlePdfImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !db || !userId || !storage) return;
        setLoading(true);
        try {
            const newRecipes = await importPdfRecipes(file, db, storage, userId, allIngredients, useOcr);
            if (newRecipes.length === 0) {
                alert("No se pudieron extraer recetas del PDF.");
                return;
            }
            const batch = writeBatch(db);
            const recipesCollection = collection(db, `users/${userId}/grimorio`);
            newRecipes.forEach(recipe => {
                const newDocRef = doc(recipesCollection);
                batch.set(newDocRef, recipe);
            });
            await batch.commit();
            alert(`${newRecipes.length} recetas importadas exitosamente.`);
        } catch (error) {
            console.error("Error al importar recetas desde PDF:", error);
            alert("Ocurrió un error importando PDF.");
        } finally {
            setLoading(false);
            setShowPdfImportModal(false);
            if (event.target) event.target.value = '';
        }
    };

    const handleCsvImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !db || !userId) return;
        setLoading(true);
        const reader = new FileReader();
        reader.onload = async (e) => {
            const text = e.target?.result as string;
            if (!text) return;
            const delimiter = text.includes(';') ? ';' : ',';
            const rows = text.split('\n').slice(1); // Assume header
            const batch = writeBatch(db);
            let count = 0;
            let errors: string[] = [];

            for (const row of rows) {
                if (!row || !row.trim()) continue;
                const cols = row.split(delimiter);
                if (!cols[0]) continue;
                try {
                    const nombre = cols[0].replace(/\uFEFF/g, '').trim();
                    const categoria = cols[1]?.trim() || 'General';
                    const precioCompra = parseEuroNumber(cols[2]);
                    const unidadCompra = cols[3]?.trim() || 'und';
                    const newDocRef = doc(collection(db, ingredientsColPath));
                    batch.set(newDocRef, { nombre, categoria, precioCompra, unidadCompra });
                    count++;
                } catch (e: any) {
                    errors.push(cols[0]);
                }
            }
            try {
                await batch.commit();
                alert(`Importación CSV completada. ${count} ingredientes añadidos.`);
            } catch (err) {
                console.error("Error en batch de CSV: ", err);
            } finally {
                setLoading(false);
                setShowCsvImportModal(false);
            }
        };
        reader.readAsText(file);
    };

    // --- Memos ---
    const filteredIngredients = React.useMemo(() => {
        return allIngredients.filter(ing => ing.nombre.toLowerCase().includes(debouncedIngredientSearch.toLowerCase()));
    }, [allIngredients, debouncedIngredientSearch]);

    const filteredRecipes = React.useMemo(() => {
        return allRecipes.filter(rec => {
            const matchesSearch = rec.nombre.toLowerCase().includes(debouncedRecipeSearch.toLowerCase());
            const matchesCategory = filters.category === 'all' || rec.categorias?.includes(filters.category);
            const matchesStatus = filters.status === 'all' || rec.categorias?.includes(filters.status);
            return matchesSearch && matchesCategory && matchesStatus;
        });
    }, [allRecipes, debouncedRecipeSearch, filters]);

    const selectedRecipe = React.useMemo(() =>
        allRecipes.find(r => r.id === selectedRecipeId) || null,
        [allRecipes, selectedRecipeId]);

    const selectedIngredient = React.useMemo(() =>
        allIngredients.find(i => i.id === selectedIngredientId) || null,
        [allIngredients, selectedIngredientId]);

    const stats = React.useMemo(() => {
        return {
            total: allRecipes.length,
            ideas: allRecipes.filter(r => r.categorias?.includes('Idea')).length,
            inProgress: allRecipes.filter(r => r.categorias?.includes('Pruebas') || r.categorias?.includes('En pruebas')).length,
            done: allRecipes.filter(r => r.categorias?.includes('Carta') || r.categorias?.includes('Terminado')).length
        };
    }, [allRecipes]);

    const handleDuplicateRecipe = async (recipe: Recipe) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, ...rest } = recipe;
        const newRecipe = { ...rest, nombre: `${recipe.nombre} (Copia)` };
        try {
            await addDoc(collection(db, `users/${userId}/grimorio`), newRecipe);
        } catch (e) {
            console.error("Error duplicating recipe", e);
        }
    };


    return (
        <PremiumLayout
            gradientTheme={activeTab === 'ingredients' ? 'emerald' : 'indigo'}
            className="lg:!grid-cols-[180px,minmax(0,1fr),320px]" // Shrink left sidebar to 180px
            leftSidebar={
                <FiltersSidebar
                    searchTerm={activeTab === 'recipes' ? recipeSearch : ingredientSearch}
                    onSearchChange={activeTab === 'recipes' ? setRecipeSearch : setIngredientSearch}
                    filters={filters}
                    onFilterChange={(k, v) => setFilters(prev => ({ ...prev, [k]: v }))}
                    stats={stats}
                    onOpenIngredients={() => setActiveTab('ingredients')}
                    onImportRecipes={() => setShowTxtImportModal(true)}
                    onImportIngredients={() => setShowCsvImportModal(true)}
                    onImportPdf={() => setShowPdfImportModal(true)}
                />
            }
            mainContent={
                <div className="h-full flex flex-col bg-transparent p-0"> {/* Transparent container */}
                    {/* Tab Switcher (Visual only inside Main Area) */}
                    <div className="flex items-center justify-between mb-4 flex-shrink-0">
                        <div className="flex items-center gap-2 bg-slate-200/50 dark:bg-slate-800/50 p-1 rounded-full">
                            <button
                                className={`px-4 py-1.5 text-sm rounded-full transition-all duration-300 font-medium ${activeTab === 'recipes' ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-700 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                                onClick={() => setActiveTab('recipes')}
                            >
                                Recetas
                            </button>
                            <button
                                className={`px-4 py-1.5 text-sm rounded-full transition-all duration-300 font-medium ${activeTab === 'ingredients' ? 'bg-white text-emerald-600 shadow-sm dark:bg-slate-700 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                                onClick={() => setActiveTab('ingredients')}
                            >
                                Ingredientes
                            </button>
                        </div>
                    </div>

                    {activeTab === 'recipes' ? (
                        <RecipeList
                            recipes={filteredRecipes}
                            selectedRecipeId={selectedRecipeId}
                            onSelectRecipe={(r) => setSelectedRecipeId(r.id)}
                            onAddRecipe={() => onOpenRecipeModal(null)}
                            onDragStart={onDragRecipeStart ? (e, r) => onDragRecipeStart(r) : undefined}
                        />
                    ) : (
                        <IngredientListPanel
                            ingredients={filteredIngredients}
                            selectedIngredientIds={selectedIngredients}
                            viewingIngredientId={selectedIngredientId} // Pass active ID
                            onToggleSelection={handleSelectIngredient}
                            onSelectAll={(selected) => setSelectedIngredients(selected ? filteredIngredients.map(i => i.id) : [])}
                            onDeleteSelected={handleDeleteSelectedIngredients}
                            onImportCSV={() => setShowCsvImportModal(true)}
                            onEditIngredient={(ing) => setSelectedIngredientId(ing.id)} // Now maps to selection
                            onNewIngredient={() => { setEditingIngredient(null); setShowIngredientModal(true); }}
                        />
                    )}
                </div>
            }
            rightSidebar={
                <div className={`h-full ${selectedRecipe || selectedIngredient ? '' : 'hidden lg:block opacity-50 pointer-events-none'}`}>
                    {activeTab === 'recipes' && selectedRecipe ? (
                        <RecipeDetailPanel
                            recipe={selectedRecipe}
                            allIngredients={allIngredients}
                            onEdit={(r) => onOpenRecipeModal(r)}
                            onDelete={(r) => handleDeleteRecipe(r.id)}
                            onDuplicate={handleDuplicateRecipe}
                            onToolToggle={setIsToolOpen}
                            onNavigate={(view, data) => setCurrentView(view)}
                        />
                    ) : activeTab === 'ingredients' && selectedIngredient ? (
                        <IngredientDetailPanel
                            ingredient={selectedIngredient}
                            onEdit={(ing) => { setEditingIngredient(ing); setShowIngredientModal(true); }}
                            onDelete={(ing) => handleDeleteIngredient(ing)}
                            onClose={() => setSelectedIngredientId(null)}
                        />
                    ) : (
                        <div className="h-full flex items-center justify-center text-slate-400 text-center p-8">
                            <div>
                                <Icon svg={activeTab === 'recipes' ? ICONS.book : ICONS.beaker} className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                <p>Selecciona {activeTab === 'recipes' ? 'una receta' : 'un ingrediente'} para ver los detalles.</p>
                            </div>
                        </div>
                    )}
                </div>
            }
        >
            {/* Mobile Overlay for Recipe Detail */}
            {selectedRecipe && activeTab === 'recipes' && (
                <div className="lg:hidden fixed inset-0 z-50 bg-white dark:bg-slate-950 p-4 overflow-y-auto">
                    <Button size="icon" variant="ghost" onClick={() => setSelectedRecipeId(null)} className="absolute top-4 right-4">
                        <Icon svg={ICONS.x} />
                    </Button>
                    <RecipeDetailPanel
                        recipe={selectedRecipe}
                        allIngredients={allIngredients}
                        onEdit={(r) => onOpenRecipeModal(r)}
                        onDelete={(r) => handleDeleteRecipe(r.id)}
                        onDuplicate={handleDuplicateRecipe}
                        onToolToggle={setIsToolOpen}
                        onNavigate={(view, data) => setCurrentView(view)}
                    />
                </div>
            )}
            {/* Mobile Overlay for Ingredient Detail */}
            {selectedIngredient && activeTab === 'ingredients' && (
                <div className="lg:hidden fixed inset-0 z-50 bg-white dark:bg-slate-950 p-4 overflow-y-auto">
                    <IngredientDetailPanel
                        ingredient={selectedIngredient}
                        onEdit={(ing) => { setEditingIngredient(ing); setShowIngredientModal(true); }}
                        onDelete={(ing) => handleDeleteIngredient(ing)}
                        onClose={() => setSelectedIngredientId(null)}
                    />
                </div>
            )}

            {/* Modals */}
            {showIngredientModal && (
                <IngredientFormModal
                    isOpen={showIngredientModal}
                    onClose={() => setShowIngredientModal(false)}
                    db={db}
                    userId={userId}
                    appId={appId}
                    editingIngredient={editingIngredient}
                />
            )}

            <Modal isOpen={showIngredientsManager} onClose={() => setShowIngredientsManager(false)} title="Gestión de Ingredientes">
                {/* ... Previous manager content implied or removed if not needed ... */}
                <div>Gestor en construcción (Usar panel principal)</div>
            </Modal>

            <Modal isOpen={showCsvImportModal} onClose={() => setShowCsvImportModal(false)} title="Importar Ingredientes CSV">
                <div className="space-y-4 p-4">
                    <p className="text-sm text-slate-500">Sube un archivo CSV con formato: Nombre;Categoria;Precio;Unidad.</p>
                    <Input type="file" accept=".csv" onChange={handleCsvImport} />
                </div>
            </Modal>
            <Modal isOpen={showTxtImportModal} onClose={() => setShowTxtImportModal(false)} title="Importar Recetas TXT">
                <div className="space-y-4 p-4">
                    <p className="text-sm text-slate-500">Sube un archivo TXT con formato Nexus.</p>
                    <Input type="file" accept=".txt" onChange={handleTxtImport} />
                </div>
            </Modal>
            <Modal isOpen={showPdfImportModal} onClose={() => setShowPdfImportModal(false)} title="Importar Recetas PDF PRO">
                <div className="space-y-4 p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <input type="checkbox" checked={useOcr} onChange={() => setUseOcr(!useOcr)} id="ocr" />
                        <label htmlFor="ocr">Usar OCR</label>
                    </div>
                    <Input type="file" accept=".pdf" onChange={handlePdfImport} />
                </div>
            </Modal>
        </PremiumLayout>
    );
};

export default GrimoriumView;

