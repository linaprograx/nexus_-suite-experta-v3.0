import React, { useRef, useEffect } from 'react';
import { Firestore, updateDoc, addDoc, collection, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { Autocomplete } from '../ui/Autocomplete';
import { ICONS } from '../ui/icons';
import { Recipe, Ingredient, IngredientLineItem } from '../../../types';
import { useApp } from '../../context/AppContext';
import { calculateRecipeCost } from '../../modules/costing/costCalculator';

interface RecipeFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    db: Firestore;
    userId: string;
    initialData: Partial<Recipe> | null;
    allIngredients: Ingredient[];
}

export const RecipeFormModal: React.FC<RecipeFormModalProps> = ({ isOpen, onClose, db, userId, initialData, allIngredients }) => {
    const { storage } = useApp();
    const [recipe, setRecipe] = React.useState<Partial<Recipe>>({});
    const [lineItems, setLineItems] = React.useState<IngredientLineItem[]>([]);
    const [isUploading, setIsUploading] = React.useState(false);

    // Dynamic Cost Calculation using shared logic
    const currentCost = React.useMemo(() => {
        return calculateRecipeCost({ ...recipe, ingredientes: lineItems }, allIngredients).costoTotal;
    }, [recipe, lineItems, allIngredients]);

    React.useEffect(() => {
        setRecipe(initialData || {});
        setLineItems(initialData?.ingredientes || []);
    }, [initialData]);

    const handleRecipeChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setRecipe(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !recipe || !storage) return;

        setIsUploading(true);
        try {
            const storageRef = ref(storage, `recipes/${recipe.id || Date.now()}.jpg`);
            await uploadBytes(storageRef, file);
            const imageUrl = await getDownloadURL(storageRef);
            setRecipe(prev => ({ ...prev, imageUrl }));
        } catch (error) {
            console.error("Error uploading image:", error);
            alert("Error al subir la imagen.");
        } finally {
            setIsUploading(false);
        }
    };

    const addLineItem = () => setLineItems(prev => [...prev, { ingredientId: null, nombre: '', cantidad: 0, unidad: 'ml' }]);

    const updateLineItem = (index: number, field: keyof IngredientLineItem, value: any) => {
        const items = [...lineItems];
        if (field === 'ingredientId') {
            const selected = allIngredients.find(i => i.id === value);
            items[index] = { ...items[index], ingredientId: value, nombre: selected?.nombre || '', unidad: selected?.standardUnit || 'ml' };
        } else {
            items[index] = { ...items[index], [field]: value };
        }
        setLineItems(items);
    };

    const removeLineItem = (index: number) => setLineItems(prev => prev.filter((_, i) => i !== index));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const dataToSave = { ...recipe, ingredientes: lineItems, costoReceta: currentCost }; // Use calculated cost
        if (dataToSave.id) {
            await updateDoc(doc(db, `users/${userId}/grimorio`, dataToSave.id), dataToSave);
        } else {
            await addDoc(collection(db, `users/${userId}/grimorio`), dataToSave);
        }
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose} />

            {/* Premium Gradient Modal Content */}
            <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-white/5 overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header with Gradient Background */}
                <div className="relative p-6 border-b border-white/10 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 opacity-100" />
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" /> {/* Texture if possible, or just gradient */}

                    <div className="relative flex items-center justify-between z-10">
                        <h2 className="text-2xl font-bold text-white shadow-sm">
                            {recipe.id ? "Editar Receta" : "Nueva Receta"}
                        </h2>
                        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/10">
                            <Icon svg={ICONS.x} />
                        </Button>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                    <form id="recipe-form" onSubmit={handleSubmit} className="space-y-6">
                        {/* Image & Basic Info */}
                        <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6">
                            <div className="space-y-2">
                                <div className={`w-full aspect-square rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 relative group`}>
                                    {recipe.imageUrl ? (
                                        <img src={recipe.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                                            <Icon svg={ICONS.camera} className="w-8 h-8" />
                                        </div>
                                    )}
                                    <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                        <span className="text-white text-xs font-medium">Cambiar</span>
                                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isUploading} />
                                    </label>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Nombre</label>
                                    <Input name="nombre" value={recipe.nombre || ''} onChange={handleRecipeChange} placeholder="Ej. Margarita" className="text-lg font-medium" required />
                                </div>
                                {/* Status Field */}
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</label>
                                    <Select
                                        name="estado"
                                        value={recipe.categorias?.find(c => ['Idea', 'En pruebas', 'Terminado', 'Archivada'].includes(c)) || 'Idea'}
                                        onChange={e => {
                                            const newStatus = e.target.value;
                                            setRecipe(r => {
                                                const cats = r.categorias?.filter(c => !['Idea', 'En pruebas', 'Terminado', 'Archivada'].includes(c)) || [];
                                                return { ...r, categorias: [...cats, newStatus] };
                                            });
                                        }}
                                        className="bg-white/50 dark:bg-slate-800/50"
                                    >
                                        <option value="Idea">Idea</option>
                                        <option value="En pruebas">En pruebas</option>
                                        <option value="Terminado">Terminado (Carta)</option>
                                        <option value="Archivada">Archivada</option>
                                    </Select>
                                </div>

                                {/* Multi-Category Field with "Create New" */}
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Categorías</label>

                                    {/* Selected Tags */}
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {recipe.categorias?.filter(c => !['Idea', 'En pruebas', 'Terminado', 'Archivada'].includes(c)).map(cat => (
                                            <span key={cat} className="px-2 py-1 rounded-md bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-bold flex items-center gap-1">
                                                {cat}
                                                <button type="button" onClick={() => setRecipe(r => ({ ...r, categorias: r.categorias?.filter(c => c !== cat) }))} className="hover:text-indigo-900 dark:hover:text-indigo-100">×</button>
                                            </span>
                                        ))}
                                    </div>

                                    {/* Selection Row with Inline Button */}
                                    <div className="flex gap-2">
                                        <Select
                                            value=""
                                            onChange={e => {
                                                if (e.target.value && !recipe.categorias?.includes(e.target.value)) {
                                                    setRecipe(r => ({ ...r, categorias: [...(r.categorias || []), e.target.value] }));
                                                }
                                            }}
                                            className="bg-white/50 dark:bg-slate-800/50 text-sm flex-1"
                                        >
                                            <option value="">Añadir existente...</option>
                                            <option value="Coctel">Cóctel</option>
                                            <option value="Mocktail">Mocktail</option>
                                            <option value="Preparacion">Preparación</option>
                                            <option value="Otro">Otro</option>
                                            <option value="Citrico">Cítrico</option>
                                            <option value="Dulce">Dulce</option>
                                            <option value="Amargo">Amargo</option>
                                        </Select>
                                        <button
                                            type="button"
                                            className="px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold text-xs uppercase tracking-wider border border-indigo-100 transition-colors"
                                            onClick={() => {
                                                const newCat = prompt("Nombre de la nueva categoría:");
                                                if (newCat && newCat.trim()) {
                                                    setRecipe(r => ({ ...r, categorias: [...(r.categorias || []), newCat.trim()] }));
                                                }
                                            }}
                                        >
                                            + Nueva
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Prep & Garnish */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Preparación</label>
                                <Textarea name="preparacion" value={recipe.preparacion || ''} onChange={handleRecipeChange} placeholder="Pasos de la receta..." className="h-32" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Garnish / Decoración</label>
                                <Textarea name="garnish" value={recipe.garnish || ''} onChange={handleRecipeChange} placeholder="Detalles de presentación..." className="h-32" />
                            </div>
                        </div>

                        {/* Ingredients Section - NOW WITHOUT OVERFLOW CLIPPING */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Ingredientes</label>
                                <Button type="button" size="sm" variant="outline" onClick={addLineItem} className="h-8 text-xs">
                                    <Icon svg={ICONS.plus} className="mr-1 h-3 w-3" /> Añadir
                                </Button>
                            </div>
                            <div className="space-y-2 bg-slate-50/50 dark:bg-slate-800/30 p-4 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                                {lineItems.length === 0 && (
                                    <p className="text-sm text-slate-400 text-center py-4 italic">No hay ingredientes añadidos.</p>
                                )}
                                {lineItems.map((item, index) => (
                                    <div key={index} className="grid grid-cols-12 gap-2 items-start relative z-auto"> {/* Removed z-index manipulation unless needed */}
                                        <div className="col-span-6 relative">
                                            {/* Z-Index for Autocomplete container to ensure it floats over subsequent rows if needed */}
                                            <div style={{ zIndex: 50 - index, position: 'relative' }}>
                                                <Autocomplete
                                                    items={allIngredients}
                                                    selectedId={item.ingredientId}
                                                    onSelect={(id) => updateLineItem(index, 'ingredientId', id)}
                                                    placeholder="Ingrediente"
                                                />
                                            </div>
                                        </div>
                                        <div className="col-span-2">
                                            <Input type="number" step="0.01" value={item.cantidad || ''} onChange={e => updateLineItem(index, 'cantidad', parseFloat(e.target.value))} placeholder="0" className="bg-white dark:bg-slate-800" />
                                        </div>
                                        <div className="col-span-3">
                                            <Select value={item.unidad} onChange={e => updateLineItem(index, 'unidad', e.target.value)} className="bg-white dark:bg-slate-800">
                                                <option value="ml">ml</option>
                                                <option value="cl">cl</option>
                                                <option value="l">L</option>
                                                <option value="g">g</option>
                                                <option value="kg">kg</option>
                                                <option value="und">und</option>
                                                <option value="dash">dash</option>
                                                <option value="tsp">tsp</option>
                                            </Select>
                                        </div>
                                        <div className="col-span-1 flex justify-center">
                                            <Button type="button" variant="ghost" size="icon" onClick={() => removeLineItem(index)} className="hover:bg-red-100 hover:text-red-500 dark:hover:bg-red-900/30">
                                                <Icon svg={ICONS.trash} className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </form>
                </div>

                {/* Footer */}
                {/* Footer with Cost & Margin Logic */}
                <div className="p-6 border-t border-slate-200/50 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        {/* Helper for Margin */}
                        {(() => {
                            const costo = currentCost;
                            const venta = parseFloat(String(recipe.precioVenta || 0));
                            const iva = 0; // Assuming basic calc for now or user inputted Net Price? Let's assume Net for Grimorium fast calc.
                            const margen = venta > 0 ? ((venta - costo) / venta) * 100 : 0;

                            return (
                                <>
                                    <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
                                        <span className="text-xs text-slate-500 uppercase tracking-wider block mb-1">Costo Total</span>
                                        <span className="text-2xl font-bold text-slate-800 dark:text-slate-100">€{costo.toFixed(2)}</span>
                                    </div>
                                    <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
                                        <span className="text-xs text-slate-500 uppercase tracking-wider block mb-1">Precio Venta (Neto)</span>
                                        <div className="flex items-center">
                                            <span className="text-lg font-medium text-slate-400 mr-1">€</span>
                                            <input
                                                type="number"
                                                step="0.10"
                                                className="w-full bg-transparent text-2xl font-bold text-slate-800 dark:text-slate-100 outline-none placeholder-slate-300"
                                                placeholder="0.00"
                                                value={recipe.precioVenta || ''}
                                                onChange={e => setRecipe(prev => ({ ...prev, precioVenta: parseFloat(e.target.value) }))}
                                            />
                                        </div>
                                    </div>
                                    <div className={`p-3 rounded-xl border shadow-sm flex flex-col justify-center ${margen < 20 ? 'bg-red-50 border-red-200 text-red-700' : margen < 70 ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
                                        <span className="text-xs uppercase tracking-wider block mb-1 opacity-80">Margen Bruto</span>
                                        <span className="text-2xl font-bold">{margen.toFixed(1)}%</span>
                                    </div>
                                </>
                            );
                        })()}
                    </div>

                    <div className="flex justify-end gap-3">
                        <Button variant="outline" onClick={onClose}>Cancelar</Button>
                        <Button type="submit" form="recipe-form" className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 px-8">
                            Guardar Receta
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
