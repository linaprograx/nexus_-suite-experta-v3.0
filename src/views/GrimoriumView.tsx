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
}> = ({ db, userId, appId, allIngredients, allRecipes, onOpenRecipeModal, onDragRecipeStart }) => {
    const [loading, setLoading] = React.useState(false);
    const [recipeSearch, setRecipeSearch] = React.useState("");
    const [ingredientSearch, setIngredientSearch] = React.useState("");
    const [showIngredientModal, setShowIngredientModal] = React.useState(false);
    const [editingIngredient, setEditingIngredient] = React.useState<Ingredient | null>(null);
    const [selectedIngredients, setSelectedIngredients] = React.useState<string[]>([]);
    const [showCsvImportModal, setShowCsvImportModal] = React.useState(false);
    const [showTxtImportModal, setShowTxtImportModal] = React.useState(false);

    const ingredientsColPath = `artifacts/${appId}/users/${userId}/grimorio-ingredients`;

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
            const rows = text.split('\n').slice(1); // Asumir cabecera
            const batch = writeBatch(db);
            let count = 0;
            let errors: string[] = [];

            for (const row of rows) {
                if (!row) continue;
                const rowClean = row.replace(/\r/g, '');
                const cols = rowClean.split(';');

                if (!cols[0]) continue;

                try {
                    const nombre = cols[0].replace(/\uFEFF/g, '').trim();
                    const categoria = cols[1]?.trim() || 'General';
                    
                    const precioCompra = parseEuroNumber(cols[2]);
                    const unidadCompra = cols[3]?.trim() || 'und';
                    const standardUnit = cols[4]?.trim() || 'und';
                    const standardQuantity = parseEuroNumber(cols[5]);

                    // TODO: eliminar logs de debug tras validar importación.
                    console.log('DEBUG CSV PRICE:', cols[2], '->', precioCompra);

                    let standardPrice = 0;
                    if (standardQuantity > 0 && precioCompra > 0) {
                        standardPrice = precioCompra / standardQuantity;
                    }

                    const newDocRef = doc(collection(db, ingredientsColPath));

                    batch.set(newDocRef, {
                        nombre: nombre,
                        categoria: categoria,
                        precioCompra,
                        unidadCompra: unidadCompra,
                        standardUnit: standardUnit,
                        standardQuantity,
                        standardPrice
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
        return allRecipes.filter(rec => rec.nombre.toLowerCase().includes(recipeSearch.toLowerCase()));
    }, [allRecipes, recipeSearch]);

    return (
        <div className="flex flex-col gap-6 p-4 lg:p-8">
            <Card className="h-[40vh] flex flex-col min-h-[300px]">
                <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle>Ingredientes ({allIngredients.length})</CardTitle>
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
                    </div>
                    <Input placeholder="Buscar ingrediente..." value={ingredientSearch} onChange={e => setIngredientSearch(e.target.value)} />
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto">
                    <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-card">
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
                </CardContent>
            </Card>

            <Card className="h-[60vh] flex flex-col min-h-[500px]">
                <CardHeader>
                     <div className="flex justify-between items-center">
                        <CardTitle>Recetas ({allRecipes.length})</CardTitle>
                        <div className="flex gap-2">
                           <Button size="sm" onClick={() => onOpenRecipeModal(null)}>Añadir</Button>
                           <Button onClick={() => setShowTxtImportModal(true)} variant="outline" size="sm">Importar TXT</Button>
                        </div>
                    </div>
                    <Input placeholder="Buscar receta..." value={recipeSearch} onChange={e => setRecipeSearch(e.target.value)} />
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredRecipes.map(recipe => (
                            <RecipeCard key={recipe.id} recipe={recipe} onEdit={() => onOpenRecipeModal(recipe)} onDragStart={(e, rec) => onDragRecipeStart(rec)} />
                        ))}
                    </div>
                </CardContent>
            </Card>
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
