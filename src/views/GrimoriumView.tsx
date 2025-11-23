import * as React from 'react';
import { collection, doc, addDoc, deleteDoc, writeBatch, Firestore, setDoc } from 'firebase/firestore';
import { Ingredient, Recipe } from '../../types';
import { parseEuroNumber } from "../utils/parseEuroNumber";
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Icon } from '../components/ui/Icon';
import { Modal } from '../components/ui/Modal';
import { ICONS } from '../components/ui/icons';
import { IngredientFormModal } from '../components/grimorium/IngredientFormModal';
import { RecipeCard } from '../components/grimorium/RecipeCard';
import { FiltersSidebar } from '../components/grimorium/FiltersSidebar';
import { RecipeList } from '../components/grimorium/RecipeList';
import { RecipeDetailPanel } from '../components/grimorium/RecipeDetailPanel';
import { IngredientListPanel } from '../components/grimorium/IngredientListPanel';
import { useUI } from '../context/UIContext';
import { ViewName } from '../../types';

// Helper para parsear bloques simples (ej: [Ingredientes] ... [Preparacion])
const parseSimpleBlock = (text: string, key: string): string => {
  const regex = new RegExp(`\\[${key}\\]([\\s\\S]*?)(?=\\[[^\\]]+\\]|---|$)`, 'i');
  const match = text.match(regex);
  return match ? match[1].trim() : '';
};

const GrimoriumView: React.FC<{
    db: Firestore;
    userId: string;
    appId: string;
    allIngredients: Ingredient[];
    allRecipes: Recipe[];
    onOpenRecipeModal: (recipe: Partial<Recipe> | null) => void;
    onDragRecipeStart: (recipe: Recipe) => void;
    setCurrentView: (view: ViewName) => void;
}> = ({ db, userId, appId, allIngredients, allRecipes, onOpenRecipeModal, onDragRecipeStart, setCurrentView }) => {
    const [loading, setLoading] = React.useState(false);
    const { compactMode } = useUI();
    const [recipeSearch, setRecipeSearch] = React.useState("");
    const [ingredientSearch, setIngredientSearch] = React.useState("");
    const [showIngredientModal, setShowIngredientModal] = React.useState(false);
    const [editingIngredient, setEditingIngredient] = React.useState<Ingredient | null>(null);
    const [selectedIngredients, setSelectedIngredients] = React.useState<string[]>([]);
    const [showCsvImportModal, setShowCsvImportModal] = React.useState(false);
    const [showTxtImportModal, setShowTxtImportModal] = React.useState(false);
    const [showIngredientsManager, setShowIngredientsManager] = React.useState(false); // Keeping for backward compatibility if needed, or remove?
    
    // Tabs
    const [activeTab, setActiveTab] = React.useState<'recipes' | 'ingredients'>('recipes');

    // New State for Layout
    const [selectedRecipeId, setSelectedRecipeId] = React.useState<string | null>(null);
    const [filters, setFilters] = React.useState({ category: 'all', status: 'all' });

    const ingredientsColPath = `artifacts/${appId}/users/${userId}/grimorio-ingredients`;

    const handleDeleteRecipe = async (recipeId: string) => {
        if (window.confirm("¿Seguro que quieres eliminar esta receta?")) {
            await deleteDoc(doc(db, `users/${userId}/grimorio`, recipeId));
            setSelectedRecipeId(null);
        }
    };

    const handleDeleteIngredient = async (id: string) => {
        if (window.confirm("¿Seguro que quieres eliminar este ingrediente?")) {
            await deleteDoc(doc(db, ingredientsColPath, id));
        }
    };

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
        }
    };

    const handleTxtImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !db || !userId) return;
        setLoading(true);
        const text = await file.text();
        const recipesText = text.split('---').filter(t => t.trim());
        
        const batch = writeBatch(db);
        recipesText.forEach(recipeText => {
            const newDocRef = doc(collection(db, `users/${userId}/grimorio`));
            const newRecipe = {
                nombre: parseSimpleBlock(recipeText, 'Nombre') || 'Sin Nombre',
                categorias: parseSimpleBlock(recipeText, 'Categorias')?.split(',').map(c => c.trim()) || [],
                ingredientesTexto: parseSimpleBlock(recipeText, 'Ingredientes'),
                preparacion: parseSimpleBlock(recipeText, 'Preparacion'),
                garnish: parseSimpleBlock(recipeText, 'Garnish'),
            };
            batch.set(newDocRef, newRecipe);
        });
        
        try {
            await batch.commit();
            alert(`${recipesText.length} recetas importadas.`);
        } catch (error) {
            console.error("Error importing TXT:", error);
            alert("Error al importar el archivo.");
        } finally {
            setLoading(false);
            setShowTxtImportModal(false);
            event.target.value = ''; 
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

                    batch.set(newDocRef, {
                        nombre,
                        categoria,
                        precioCompra,
                        unidadCompra
                    });
                    count++;

                } catch (e: any) {
                    errors.push(cols[0]);
                }
            }

            try {
                await batch.commit();
                alert(`Importación CSV completada. ${count} ingredientes añadidos. Errores: ${errors.length}`);
            } catch (err) {
                console.error("Error en batch de CSV: ", err);
            } finally {
                setLoading(false);
                setShowCsvImportModal(false);
            }
        };
        reader.readAsText(file);
    };


    const filteredIngredients = React.useMemo(() => {
        return allIngredients.filter(ing => ing.nombre.toLowerCase().includes(ingredientSearch.toLowerCase()));
    }, [allIngredients, ingredientSearch]);

    const filteredRecipes = React.useMemo(() => {
        return allRecipes.filter(rec => {
            const matchesSearch = rec.nombre.toLowerCase().includes(recipeSearch.toLowerCase());
            const matchesCategory = filters.category === 'all' || rec.categorias?.includes(filters.category);
            const matchesStatus = filters.status === 'all' || rec.categorias?.includes(filters.status); // Using categories as status for now
            return matchesSearch && matchesCategory && matchesStatus;
        });
    }, [allRecipes, recipeSearch, filters]);

    const selectedRecipe = React.useMemo(() => 
        allRecipes.find(r => r.id === selectedRecipeId) || null, 
    [allRecipes, selectedRecipeId]);

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

    const stats = React.useMemo(() => {
        return {
            total: allRecipes.length,
            ideas: allRecipes.filter(r => r.categorias?.includes('Idea')).length,
            inProgress: allRecipes.filter(r => r.categorias?.includes('Pruebas') || r.categorias?.includes('En pruebas')).length,
            done: allRecipes.filter(r => r.categorias?.includes('Carta') || r.categorias?.includes('Terminado')).length
        };
    }, [allRecipes]);

    return (
        <div className={`flex flex-col h-full ${compactMode ? 'gap-3 p-3' : 'gap-6 p-6 lg:p-8'}`}>
            {/* Header (Optional, usually Topbar handles this, but keeping context if needed) */}
            
            <div className={`flex-1 grid grid-cols-1 lg:grid-cols-[18rem_minmax(0,1fr)_22rem] ${compactMode ? 'gap-3' : 'gap-6'}`}>
                {/* Left: Filters */}
                <div className="h-full">
                    <FiltersSidebar 
                        searchTerm={recipeSearch}
                        onSearchChange={setRecipeSearch}
                        filters={filters}
                        onFilterChange={(k, v) => setFilters(prev => ({ ...prev, [k]: v }))}
                        stats={stats}
                        onOpenIngredients={() => setActiveTab('ingredients')}
                        onImportRecipes={() => setShowTxtImportModal(true)}
                        onImportIngredients={() => setShowCsvImportModal(true)}
                    />
                </div>

                {/* Center: List */}
                <div className="h-full min-h-0 flex flex-col">
                    {/* Tabs Header */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="inline-flex rounded-full border bg-white/60 dark:bg-slate-900/60 p-1 backdrop-blur-sm">
                            <button
                                className={`px-4 py-1.5 text-sm rounded-full transition ${activeTab === 'recipes' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'}`}
                                onClick={() => setActiveTab('recipes')}
                            >
                                Recetas
                            </button>
                            <button
                                className={`px-4 py-1.5 text-sm rounded-full transition ${activeTab === 'ingredients' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'}`}
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
                        />
                    ) : (
                        <IngredientListPanel
                            ingredients={filteredIngredients}
                            selectedIngredientIds={selectedIngredients}
                            onToggleSelection={handleSelectIngredient}
                            onSelectAll={(selected) => setSelectedIngredients(selected ? filteredIngredients.map(i => i.id) : [])}
                            onDeleteSelected={handleDeleteSelectedIngredients}
                            onImportCSV={() => setShowCsvImportModal(true)}
                            onEditIngredient={(ing) => { setEditingIngredient(ing); setShowIngredientModal(true); }}
                            onNewIngredient={() => { setEditingIngredient(null); setShowIngredientModal(true); }}
                        />
                    )}
                </div>

                {/* Right: Detail */}
                <div className={`h-full min-h-0 ${!selectedRecipe ? 'hidden lg:block' : 'fixed inset-0 z-50 lg:static lg:z-auto bg-background/80 backdrop-blur-sm lg:bg-transparent'}`}>
                    {/* Mobile Overlay Close */}
                    {selectedRecipe && (
                        <div className="lg:hidden absolute top-4 right-4 z-50">
                            <Button size="icon" variant="secondary" onClick={() => setSelectedRecipeId(null)}>
                                <Icon svg={ICONS.x} />
                            </Button>
                        </div>
                    )}
                    <div className={`h-full ${selectedRecipe ? 'p-4 lg:p-0 animate-in slide-in-from-bottom lg:animate-none' : ''}`}>
                        <RecipeDetailPanel 
                            recipe={selectedRecipe}
                            onEdit={(r) => onOpenRecipeModal(r)}
                            onDelete={(r) => handleDeleteRecipe(r.id)}
                            onDuplicate={handleDuplicateRecipe}
                            onNavigate={(view, data) => {
                                if (data) {
                                    // Since we can't easily pass props to other views without context or router state,
                                    // we'll use a temporary storage mechanism or just navigate.
                                    // For now, just navigate. Ideally, we'd use a global state store.
                                    console.log("Navigating to", view, "with data", data);
                                }
                                setCurrentView(view);
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Ingredients Manager Modal */}
            <Modal isOpen={showIngredientsManager} onClose={() => setShowIngredientsManager(false)} title="Gestión de Ingredientes" className="max-w-4xl h-[80vh]">
                <div className="flex flex-col h-full">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex gap-2">
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={handleDeleteSelectedIngredients}
                                disabled={selectedIngredients.length === 0}
                            >
                                Eliminar ({selectedIngredients.length})
                            </Button>
                            <Button size="sm" onClick={() => { setEditingIngredient(null); setShowIngredientModal(true); }}>Añadir</Button>
                            <Button onClick={() => setShowCsvImportModal(true)} variant="outline" size="sm">Importar CSV</Button>
                        </div>
                        <Input placeholder="Buscar ingrediente..." value={ingredientSearch} onChange={e => setIngredientSearch(e.target.value)} className="max-w-xs" />
                    </div>
                    <div className="flex-1 overflow-y-auto border rounded-lg">
                        <table className="w-full text-sm">
                            <thead className="sticky top-0 bg-card z-10">
                                <tr className="border-b">
                                    <th className="p-2 w-10"><Input type="checkbox" onChange={handleSelectAllIngredients} /></th>
                                    <th className="p-2 text-left font-semibold">Nombre</th>
                                    <th className="p-2 text-left font-semibold">Categoría</th>
                                    <th className="p-2 text-left font-semibold">Costo Estándar</th>
                                    <th className="p-2 text-left font-semibold">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredIngredients.map(ing => (
                                    <tr key={ing.id} className="border-b even:bg-secondary/50 hover:bg-primary/10 transition-colors duration-150">
                                        <td className="p-2">
                                            <Input
                                                type="checkbox"
                                                checked={selectedIngredients.includes(ing.id)}
                                                onChange={() => handleSelectIngredient(ing.id)}
                                            />
                                        </td>
                                        <td className="p-2">{ing.nombre}</td>
                                        <td className="p-2">{ing.categoria}</td>
                                        <td className="p-2">€{(ing.standardPrice || 0).toFixed(4)} / {ing.standardUnit}</td>
                                        <td className="p-2 flex gap-1">
                                            <Button variant="ghost" size="icon" onClick={() => { setEditingIngredient(ing); setShowIngredientModal(true); }}>
                                                <Icon svg={ICONS.edit} className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDeleteIngredient(ing.id)}>
                                                <Icon svg={ICONS.trash} className="h-4 w-4 text-red-500" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </Modal>

            <div className="fixed bottom-4 right-4 lg:hidden">
                 <Button size="lg" className="rounded-full shadow-lg" onClick={() => onOpenRecipeModal(null)}>
                    <Icon svg={ICONS.plus} className="mr-2 h-5 w-5" /> Nueva Receta
                 </Button>
            </div>

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
            <Modal isOpen={showCsvImportModal} onClose={() => setShowCsvImportModal(false)} title="Importar Ingredientes desde CSV">
                <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">El archivo CSV debe tener las siguientes columnas separadas por punto y coma (;):</p>
                    <code className="block text-xs bg-secondary p-2 rounded-md">Nombre;Categoria;Precio;UnidadCompra;UnidadMedida;Cantidad</code>
                    <p className="text-sm">Ejemplo de precio: <code className="text-xs">0,54 €</code>. Ejemplo de cantidad: <code className="text-xs">700</code>.</p>
                    <Input type="file" accept=".csv" onChange={handleCsvImport} className="hidden" id="csv-upload" />
                    <Button as="label" htmlFor="csv-upload" className="w-full">
                        <Icon svg={ICONS.upload} className="mr-2 h-4 w-4" />
                        Seleccionar archivo CSV
                    </Button>
                </div>
            </Modal>
            <Modal isOpen={showTxtImportModal} onClose={() => setShowTxtImportModal(false)} title="Importar Recetas desde TXT">
                <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">El archivo TXT debe separar cada receta con tres guiones (<code className="text-xs">---</code>).</p>
                    <p className="text-sm">Cada campo de la receta debe estar precedido por una etiqueta entre corchetes, por ejemplo:</p>
                    <pre className="block text-xs bg-secondary p-2 rounded-md overflow-auto">
                        <code>
                            [Nombre] Old Fashioned<br/>
                            [Categorias] Clásico, Whisky<br/>
                            [Ingredientes]<br/>
                            - 60ml Bourbon<br/>
                            - 1 terrón de azúcar<br/>
                            [Preparacion]<br/>
                            1. Macerar el azúcar...
                        </code>
                    </pre>
                    <Input type="file" accept=".txt" onChange={handleTxtImport} className="hidden" id="txt-upload" />
                    <Button as="label" htmlFor="txt-upload" className="w-full">
                        <Icon svg={ICONS.upload} className="mr-2 h-4 w-4" />
                        Seleccionar archivo TXT
                    </Button>
                </div>
            </Modal>
        </div>
    );
};

export default GrimoriumView;
