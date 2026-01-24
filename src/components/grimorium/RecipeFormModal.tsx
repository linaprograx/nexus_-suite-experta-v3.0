import React, { useRef, useEffect } from 'react';
import { Firestore, updateDoc, addDoc, collection, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useQueryClient } from '@tanstack/react-query';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { Autocomplete } from '../ui/Autocomplete';
import { ICONS } from '../ui/icons';
import { Recipe, Ingredient, IngredientLineItem } from '../../types';
import { useApp } from '../../context/AppContext';
import { calculateRecipeCost } from '../../core/costing/costCalculator';

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
    const queryClient = useQueryClient();
    const [recipe, setRecipe] = React.useState<Partial<Recipe>>({});
    const [lineItems, setLineItems] = React.useState<IngredientLineItem[]>([]);
    const [isUploading, setIsUploading] = React.useState(false);

    // Dynamic Cost Calculation using shared logic
    const currentCost = React.useMemo(() => {
        const cost = calculateRecipeCost({ ...recipe, ingredientes: lineItems }, allIngredients).costoTotal;
        return isNaN(cost) ? 0 : cost;
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
        if (!file) return;

        if (!storage) {
            alert('Error: Firebase Storage no está inicializado.');
            console.error('Storage is null');
            return;
        }

        setIsUploading(true);
        try {
            const storageRef = ref(storage, `recipes/${recipe.id || Date.now()}.jpg`);
            await uploadBytes(storageRef, file);
            const imageUrl = await getDownloadURL(storageRef);
            setRecipe(prev => ({ ...prev, imageUrl }));
        } catch (error: any) {
            console.error("Error uploading image:", error);
            alert(`Error al subir la imagen: ${error.message || error}`);
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
        const safeCost = currentCost || 0;
        const dataToSave = {
            ...recipe,
            ingredientes: lineItems,
            costoReceta: safeCost, // Legacy support
            costoTotal: safeCost,  // Standard field
            precioVenta: recipe.precioVenta || 0 // Ensure no NaN
        };

        try {
            if (dataToSave.id) {
                await updateDoc(doc(db, `users/${userId}/grimorio`, dataToSave.id), dataToSave);
                console.log("✅ Receta actualizada:", dataToSave.id);
            } else {
                const docRef = await addDoc(collection(db, `users/${userId}/grimorio`), dataToSave);
                console.log("✅ Nueva receta creada:", docRef.id);
            }
            // Invalidate Cache
            console.log("🔄 Invalidando query 'recipes'...");
            await queryClient.invalidateQueries({ queryKey: ['recipes'] });
            await queryClient.invalidateQueries({ queryKey: ['recipes', userId] });

            // Force delay to ensure propagation if needed (optional hack, but useful for testing)
            // await new Promise(r => setTimeout(r, 500));

            onClose();
        } catch (error: any) {
            console.error("❌ Error saving recipe:", error);
            alert(`Error al guardar la receta: ${error.message || error}`);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose} />

            {/* Premium Gradient Modal Content */}
            <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-white/5 overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header with Gradient Background */}
                <div className="relative p-4 border-b border-white/10 overflow-hidden shrink-0">
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 opacity-100" />
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />

                    <div className="relative flex items-center justify-between z-10">
                        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/10 w-9 h-9">
                            <Icon svg={ICONS.x} className="w-5 h-5" />
                        </Button>
                        <h2 className="text-lg font-bold text-white shadow-sm flex-1 text-center truncate px-2">
                            {recipe.id ? "Editar Receta" : "Nueva Receta"}
                        </h2>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleSubmit}
                            disabled={isUploading}
                            className={`rounded-full ${isUploading ? 'bg-gray-400' : 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'} font-bold text-xs px-4 h-9 border border-white/10`}
                        >
                            {isUploading ? '...' : 'Guardar'}
                        </Button>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6">
                    <form id="recipe-form" onSubmit={handleSubmit} className="space-y-6">
                        {/* Image & Basic Info */}
                        <div className="flex flex-col gap-6">
                            {/* Mobile Optimized Image Uploader */}
                            <div className="w-full flex justify-center">
                                <div className="relative w-40 h-40 rounded-2xl overflow-hidden border-2 border-slate-200 dark:border-slate-700 shadow-md group">
                                    {recipe.imageUrl ? (
                                        <img src={recipe.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-400 gap-2">
                                            <Icon svg={ICONS.camera} className="w-8 h-8" />
                                            <span className="text-[10px] uppercase font-bold tracking-wider">Foto</span>
                                        </div>
                                    )}
                                    {/* Always visible edit button on Mobile */}
                                    <label className="absolute bottom-0 inset-x-0 bg-black/60 backdrop-blur-md py-2 flex items-center justify-center cursor-pointer active:bg-black/80 transition-colors">
                                        <span className="text-white text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                                            <Icon svg={ICONS.camera} className="w-3 h-3" /> Cambiar
                                        </span>
                                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isUploading} />
                                    </label>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Nombre</label>
                                    <Input name="nombre" value={recipe.nombre || ''} onChange={handleRecipeChange} placeholder="Nombre del Coctel" className="text-lg font-medium bg-slate-50 border-slate-200" required />
                                </div>

                                {/* Status & Category Row */}
                                <div className="grid grid-cols-2 gap-4">
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
                                            className="bg-slate-50 text-sm py-2"
                                        >
                                            <option value="Idea">Idea 💡</option>
                                            <option value="En pruebas">En Pruebas 🧪</option>
                                            <option value="Terminado">Carta ✅</option>
                                            <option value="Archivada">Archivada 📦</option>
                                        </Select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tipo</label>
                                        <Select
                                            value={recipe.categorias?.find(c => ['Coctel', 'Mocktail', 'Preparacion'].includes(c)) || ''}
                                            onChange={e => {
                                                const type = e.target.value;
                                                if (!type) return;
                                                setRecipe(r => {
                                                    const cats = r.categorias?.filter(c => !['Coctel', 'Mocktail', 'Preparacion'].includes(c)) || [];
                                                    return { ...r, categorias: [...cats, type] };
                                                });
                                            }}
                                            className="bg-slate-50 text-sm py-2"
                                        >
                                            <option value="">Seleccionar...</option>
                                            <option value="Coctel">Cóctel 🍸</option>
                                            <option value="Mocktail">Mocktail 🥤</option>
                                            <option value="Preparacion">Prep 🥣</option>
                                        </Select>
                                    </div>
                                </div>

                                {/* Previous Category Logic (Hidden or Simplified if needed, keeping simple for mobile now) */}
                            </div>
                        </div>

                        {/* Prep & Garnish (Tabs or Stacked? Stacked is fine) */}
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Preparación</label>
                                <Textarea name="preparacion" value={recipe.preparacion || ''} onChange={handleRecipeChange} placeholder="Instrucciones..." className="h-24 text-sm bg-slate-50 border-slate-200" />
                            </div>
                        </div>

                        {/* Ingredients Section */}
                        <div className="space-y-3 pb-4">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Ingredientes</label>
                                <Button type="button" size="sm" variant="outline" onClick={addLineItem} className="h-7 text-[10px] px-3 rounded-full bg-indigo-50 text-indigo-600 border-indigo-100">
                                    <Icon svg={ICONS.plus} className="mr-1 h-3 w-3" /> AÑADIR
                                </Button>
                            </div>
                            <div className="space-y-2">
                                {lineItems.length === 0 && (
                                    <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                        <span className="text-xs text-slate-400 italic">Sin ingredientes</span>
                                    </div>
                                )}
                                {lineItems.map((item, index) => (
                                    <div key={index} className="flex gap-2 items-center bg-white p-2 rounded-xl border border-slate-100 shadow-sm relative z-auto">
                                        <div className="flex-1 min-w-0 z-[1]"> {/* Check z-index */}
                                            <Autocomplete
                                                items={allIngredients}
                                                selectedId={item.ingredientId}
                                                onSelect={(id) => updateLineItem(index, 'ingredientId', id)}
                                                placeholder="Busca ingrediente..."
                                            />
                                        </div>
                                        <div className="w-16">
                                            <Input
                                                type="number"
                                                value={item.cantidad || ''}
                                                onChange={e => updateLineItem(index, 'cantidad', parseFloat(e.target.value))}
                                                placeholder="0"
                                                className="text-center bg-slate-50 px-1 py-1 h-9 text-sm"
                                            />
                                        </div>
                                        <div className="w-16">
                                            <Select value={item.unidad} onChange={e => updateLineItem(index, 'unidad', e.target.value)} className="bg-slate-50 px-1 py-1 h-9 text-xs">
                                                <option value="ml">ml</option>
                                                <option value="cl">cl</option>
                                                <option value="oz">oz</option>
                                                <option value="und">und</option>
                                                <option value="g">g</option>
                                                <option value="dash">dsh</option>
                                            </Select>
                                        </div>
                                        <button onClick={() => removeLineItem(index)} className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-red-500">
                                            <Icon svg={ICONS.trash} className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </form>
                </div>

                {/* Compact Footer */}
                <div className="p-4 border-t border-slate-200/50 bg-slate-50/80 backdrop-blur-md pb-8 md:pb-4 shrink-0 z-20">
                    <div className="flex items-center justify-between gap-2">
                        {(() => {
                            const costo = currentCost;
                            const venta = parseFloat(String(recipe.precioVenta || 0));
                            const margen = venta > 0 ? ((venta - costo) / venta) * 100 : 0;

                            return (
                                <>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Costo</span>
                                        <span className="text-lg font-bold text-slate-700">€{costo.toFixed(2)}</span>
                                    </div>
                                    <div className="h-8 w-px bg-slate-200"></div>
                                    <div className="flex flex-col flex-1 px-4">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Precio Venta</span>
                                        <div className="flex items-center">
                                            <span className="text-sm text-slate-400 mr-1">€</span>
                                            <input
                                                type="number"
                                                value={recipe.precioVenta || ''}
                                                onChange={e => setRecipe({ ...recipe, precioVenta: parseFloat(e.target.value) })}
                                                className="w-full bg-transparent font-bold text-lg text-slate-800 outline-none p-0"
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>
                                    <div className={`px-4 py-2 rounded-xl flex flex-col items-center justify-center min-w-[80px] ${margen < 20 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                        <span className="text-[9px] font-black uppercase opacity-60">Margen</span>
                                        <span className="text-sm font-black">{margen.toFixed(0)}%</span>
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                </div>
            </div>
        </div>
    );
};
