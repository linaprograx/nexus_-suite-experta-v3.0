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
import { calculateRecipeCost, recipeTotalVolume } from '../../core/costing/costCalculator';
import { usePurchaseIngredient } from '../../hooks/usePurchaseIngredient';
import { logActivity } from '../../core/actions/action.audit';

// Coctelería spec presets (values already supported by the Recipe type)
const TECHNIQUES = ['Shake', 'Stir', 'Build', 'Blend', 'Throw', 'Muddle'];
const GLASSWARE = ['Old Fashioned', 'Highball', 'Collins', 'Coupe', 'Martini', 'Nick & Nora', 'Copa balón', 'Flauta', 'Tiki', 'Shot'];
const ICE_TYPES = ['Sin hielo', 'Cubo', 'Cubo grande', 'Esfera', 'Picado', 'Frappé', 'Bloque'];

interface RecipeFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    db: Firestore;
    userId: string;
    initialData: Partial<Recipe> | null;
    allIngredients: Ingredient[];
    allRecipes?: Recipe[];
}

export const RecipeFormModal: React.FC<RecipeFormModalProps> = ({ isOpen, onClose, db, userId, initialData, allIngredients, allRecipes = [] }) => {
    const { storage } = useApp();
    const queryClient = useQueryClient();
    const { purchaseHistory } = usePurchaseIngredient();
    const [recipe, setRecipe] = React.useState<Partial<Recipe>>({});
    const [lineItems, setLineItems] = React.useState<IngredientLineItem[]>([]);

    // Escape cierra. En escritorio se rellena un formulario largo con el teclado
    // y no había forma de salir sin ir al ratón.
    React.useEffect(() => {
        if (!isOpen) return;
        const alPulsar = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', alPulsar);
        return () => window.removeEventListener('keydown', alPulsar);
    }, [isOpen, onClose]);
    const [isUploading, setIsUploading] = React.useState(false);

    // Dynamic Cost Calculation — enriches ingredients with real purchase prices in real time.
    // Passing allRecipes lets sub-recipe lines be costed proportionally to the volume used.
    const costResult = React.useMemo(
        () => calculateRecipeCost({ ...recipe, ingredientes: lineItems }, allIngredients, purchaseHistory, allRecipes),
        [recipe, lineItems, allIngredients, purchaseHistory, allRecipes]
    );
    const currentCost = isNaN(costResult.costoTotal) ? 0 : costResult.costoTotal;

    React.useEffect(() => {
        setRecipe(initialData || {});
        setLineItems((initialData?.ingredientes || []) as IngredientLineItem[]);
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

    // Add a SUB-RECIPE box — defaults to "linked to a saved sub-recipe" (reusable);
    // can be toggled to inline. subRecipeId: '' marks ref-mode awaiting selection.
    const addSubRecipeItem = () => setLineItems(prev => [...prev, { ingredientId: null, isSubRecipe: true, nombre: '', cantidad: 0, unidad: 'ml', subRecipeId: '' }]);

    // Add a GARNISH box — same machinery, solid-first (grams by default)
    const addGarnishItem = () => setLineItems(prev => [...prev, { ingredientId: null, isGarnish: true, nombre: '', cantidad: 0, unidad: 'g', subRecipeId: '' }]);

    const updateLineItem = (index: number, field: keyof IngredientLineItem, value: any) => {
        const items = [...lineItems];
        if (field === 'ingredientId') {
            const selected = allIngredients.find(i => i.id === value);
            items[index] = { ...items[index], ingredientId: value, nombre: selected?.nombre || '', unidad: selected?.standardUnit || 'ml' };
        } else if (field === 'subRecipeId') {
            const selected = allRecipes.find(r => r.id === value);
            items[index] = { ...items[index], subRecipeId: value, nombre: selected?.nombre || items[index].nombre };
        } else {
            items[index] = { ...items[index], [field]: value };
        }
        setLineItems(items);
    };

    const removeLineItem = (index: number) => setLineItems(prev => prev.filter((_, i) => i !== index));

    // --- Nested handlers for a sub-recipe box's own ingredients ---
    const addSubItem = (parentIndex: number) => setLineItems(prev => prev.map((it, i) =>
        // Garnish components default to grams (solids); sub-recipe components to ml
        i === parentIndex ? { ...it, subItems: [...(it.subItems || []), { ingredientId: null, nombre: '', cantidad: 0, unidad: it.isGarnish ? 'g' : 'ml' }] } : it
    ));

    const updateSubItem = (parentIndex: number, subIndex: number, field: keyof IngredientLineItem, value: any) => {
        setLineItems(prev => prev.map((it, i) => {
            if (i !== parentIndex) return it;
            const subItems = [...(it.subItems || [])];
            if (field === 'ingredientId') {
                const selected = allIngredients.find(ing => ing.id === value);
                subItems[subIndex] = { ...subItems[subIndex], ingredientId: value, nombre: selected?.nombre || '', unidad: selected?.standardUnit || 'ml' };
            } else {
                subItems[subIndex] = { ...subItems[subIndex], [field]: value };
            }
            return { ...it, subItems };
        }));
    };

    const removeSubItem = (parentIndex: number, subIndex: number) => setLineItems(prev => prev.map((it, i) =>
        i === parentIndex ? { ...it, subItems: (it.subItems || []).filter((_, k) => k !== subIndex) } : it
    ));

    // Reusable sub-recipes available to link: saved "Preparación" recipes (never itself)
    const reusableSubRecipes = React.useMemo(
        () => allRecipes.filter(r => r.id !== recipe.id && r.categorias?.includes('Preparacion')),
        [allRecipes, recipe.id]
    );

    // Saved garnish catalog: recipes tagged as "Garnish"
    const reusableGarnishes = React.useMemo(
        () => allRecipes.filter(r => r.id !== recipe.id && r.categorias?.includes('Garnish')),
        [allRecipes, recipe.id]
    );

    // Switch a sub-recipe box between "linked to a saved sub-recipe" and "defined inline"
    const setSubMode = (index: number, mode: 'ref' | 'inline') => setLineItems(prev => prev.map((it, i) => {
        if (i !== index) return it;
        if (mode === 'ref') return { ...it, subRecipeId: it.subRecipeId ?? '', subItems: undefined };
        return { ...it, subRecipeId: undefined, subItems: it.subItems ?? [] };
    }));

    // Persist an inline sub-recipe box to the catalog as a reusable "Preparación" recipe,
    // then re-link this line to it so its cost stays in sync everywhere.
    const saveSubAsReusable = async (index: number) => {
        const box = lineItems[index];
        const items = (box.subItems || []) as IngredientLineItem[];
        const isGarnish = !!box.isGarnish;
        const kindLabel = isGarnish ? 'garnish' : 'sub-receta';
        const nombre = (box.nombre || '').trim();
        if (!nombre) { alert(`Ponle un nombre al ${kindLabel} antes de guardarlo al catálogo.`); return; }
        if (items.length === 0) { alert(`Añade al menos un ingrediente al ${kindLabel}.`); return; }
        try {
            const subCost = calculateRecipeCost({ ingredientes: items }, allIngredients, purchaseHistory).costoTotal || 0;
            const docRef = await addDoc(collection(db, `users/${userId}/grimorio`), {
                nombre,
                categorias: isGarnish ? ['Garnish', 'Terminado'] : ['Preparacion', 'Terminado'],
                ingredientes: items,
                costoReceta: subCost,
                costoTotal: subCost,
                precioVenta: 0,
            });
            await queryClient.invalidateQueries({ queryKey: ['recipes'] });
            await queryClient.invalidateQueries({ queryKey: ['recipes', userId] });
            // Re-link this line to the freshly saved reusable sub-recipe
            setLineItems(prev => prev.map((it, i) => i === index ? { ...it, subRecipeId: docRef.id, subItems: undefined } : it));
        } catch (err: any) {
            console.error('❌ Error guardando sub-receta:', err);
            alert(`Error al guardar la sub-receta: ${err.message || err}`);
        }
    };

    // Strip `undefined` fields (Firestore rejects them) from line items before saving
    const cleanLineItems = (items: IngredientLineItem[]): any[] =>
        items.map(li => {
            const out: any = {};
            for (const [k, v] of Object.entries(li)) {
                if (v === undefined) continue;
                out[k] = Array.isArray(v) ? cleanLineItems(v as any) : v;
            }
            return out;
        });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const safeCost = currentCost || 0;
        const dataToSave = {
            ...recipe,
            ingredientes: cleanLineItems(lineItems),
            costoReceta: safeCost, // Legacy support
            costoTotal: safeCost,  // Standard field
            precioVenta: recipe.precioVenta || 0 // Ensure no NaN
        };

        try {
            if (dataToSave.id) {
                await updateDoc(doc(db, `users/${userId}/grimorio`, dataToSave.id), dataToSave);
                console.log("✅ Receta actualizada:", dataToSave.id);
                logActivity(db, userId, {
                    actionType: 'RECIPE_UPDATED',
                    title: `Receta editada: ${dataToSave.nombre || 'Sin nombre'}`,
                    details: `Coste €${safeCost.toFixed(2)} · ${lineItems.length} ingrediente(s)`,
                    entityId: dataToSave.id,
                });
            } else {
                const docRef = await addDoc(collection(db, `users/${userId}/grimorio`), dataToSave);
                console.log("✅ Nueva receta creada:", docRef.id);
                logActivity(db, userId, {
                    actionType: 'RECIPE_CREATED',
                    title: `Receta creada: ${dataToSave.nombre || 'Sin nombre'}`,
                    details: `Coste €${safeCost.toFixed(2)} · ${lineItems.length} ingrediente(s)`,
                    entityId: docRef.id,
                });
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

    // Suggested price for a 75% target margin
    const suggestedPrice = currentCost > 0 ? Math.ceil((currentCost / 0.25) * 2) / 2 : 0;
    const inputCls = "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100";

    return (
        <div
            // Hueco ARRIBA y ABAJO, ambos con área segura.
            // Abajo: el modal y la barra de navegación estaban
            // ambos en z-50 y ganaba la barra por montarse después: tapaba el pie,
            // que es donde se introduce el PRECIO DE VENTA. Un modal debe estar por
            // encima de la navegación, y además se reserva su alto para que el pie
            // quede a la vista en lugar de simplemente por delante.
            // Arriba: al reservar sitio abajo la tarjeta creció, y su cabecera
            // —Cerrar y Guardar— se metió bajo el reloj y el notch. Reservar solo
            // por un lado desplaza el problema al otro.
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 pt-[calc(1rem+env(safe-area-inset-top))] pb-[calc(1rem+60px+env(safe-area-inset-bottom))] lg:pt-4 lg:pb-4"
        >
            {/* Backdrop — fade only (no transform) to avoid Safari backdrop-filter flicker */}
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-md animate-in fade-in duration-200" onClick={onClose} style={{ WebkitBackdropFilter: 'blur(12px)' }} />

            {/* Modal */}
            <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/60 dark:border-white/10 overflow-hidden animate-in fade-in duration-200">
                {/* Header — Grimorio brand (emerald/teal) */}
                <div className="relative px-4 py-3.5 shrink-0 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 overflow-hidden">
                    <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                    <div className="relative flex items-center justify-between z-10">
                        <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors">
                            <Icon svg={ICONS.x} className="w-5 h-5" />
                        </button>
                        <h2 className="text-lg font-bold text-white flex-1 text-center truncate px-2">
                            {recipe.id ? "Editar Receta" : "Nueva Receta"}
                        </h2>
                        <button
                            onClick={handleSubmit}
                            disabled={isUploading}
                            className={`rounded-full font-bold text-xs px-5 h-9 transition-all ${isUploading ? 'bg-white/40 text-white/70' : 'bg-white text-emerald-700 hover:shadow-lg hover:-translate-y-0.5'}`}
                        >
                            {isUploading ? 'Subiendo…' : 'Guardar'}
                        </button>
                    </div>
                </div>

                {/* Scrollable content — 2 columns on desktop */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-5">
                    <form id="recipe-form" onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                        {/* LEFT: identity + prep */}
                        <div className="space-y-4">
                            <div className="flex gap-4">
                                {/* Image uploader */}
                                <div className="relative w-28 h-28 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm group shrink-0">
                                    {recipe.imageUrl ? (
                                        <img src={recipe.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-400 gap-1.5">
                                            <Icon svg={ICONS.camera} className="w-7 h-7" />
                                            <span className="text-[9px] uppercase font-bold tracking-wider">Foto</span>
                                        </div>
                                    )}
                                    <label className="absolute bottom-0 inset-x-0 bg-black/60 backdrop-blur-md py-1.5 flex items-center justify-center cursor-pointer hover:bg-black/75 transition-colors">
                                        <span className="text-white text-[9px] font-bold uppercase tracking-widest flex items-center gap-1">
                                            <Icon svg={ICONS.camera} className="w-3 h-3" /> Cambiar
                                        </span>
                                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isUploading} />
                                    </label>
                                </div>
                                {/* Name */}
                                <div className="flex-1 space-y-1 flex flex-col justify-center">
                                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Nombre</label>
                                    <Input name="nombre" value={recipe.nombre || ''} onChange={handleRecipeChange} placeholder="Nombre del cóctel" className={`text-lg font-medium ${inputCls}`} required />
                                </div>
                            </div>

                            {/* Estado + Tipo */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Estado</label>
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
                                        className={`text-sm py-2 ${inputCls}`}
                                    >
                                        <option value="Idea">Idea</option>
                                        <option value="En pruebas">En pruebas</option>
                                        <option value="Terminado">En carta</option>
                                        <option value="Archivada">Archivada</option>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tipo</label>
                                    <Select
                                        value={recipe.categorias?.find(c => ['Coctel', 'Mocktail', 'Preparacion', 'Garnish'].includes(c)) || ''}
                                        onChange={e => {
                                            const type = e.target.value;
                                            if (!type) return;
                                            setRecipe(r => {
                                                const cats = r.categorias?.filter(c => !['Coctel', 'Mocktail', 'Preparacion', 'Garnish'].includes(c)) || [];
                                                return { ...r, categorias: [...cats, type] };
                                            });
                                        }}
                                        className={`text-sm py-2 ${inputCls}`}
                                    >
                                        <option value="">Seleccionar…</option>
                                        <option value="Coctel">Cóctel</option>
                                        <option value="Mocktail">Mocktail</option>
                                        <option value="Preparacion">Preparación</option>
                                        <option value="Garnish">Garnish</option>
                                    </Select>
                                </div>
                            </div>

                            {/* Preparación */}
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Preparación</label>
                                <Textarea name="preparacion" value={recipe.preparacion || ''} onChange={handleRecipeChange} placeholder="Instrucciones paso a paso…" className={`h-[96px] text-sm ${inputCls}`} />
                            </div>

                            {/* Especificaciones de coctelería — técnica, cristalería, hielo, garnish, ABV */}
                            <div className="space-y-2.5 rounded-2xl border border-slate-200 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-800/30 p-3">
                                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Especificaciones</label>

                                {/* Técnica — chips */}
                                <div className="flex flex-wrap gap-1.5">
                                    {TECHNIQUES.map(t => {
                                        const active = recipe.technique === t;
                                        return (
                                            <button
                                                key={t}
                                                type="button"
                                                onClick={() => setRecipe(r => ({ ...r, technique: active ? '' : t }))}
                                                className={`px-2.5 h-7 rounded-full text-[11px] font-bold transition-all ${active
                                                    ? 'bg-emerald-500 text-white shadow-sm'
                                                    : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-emerald-400 hover:text-emerald-600'}`}
                                            >
                                                {t}
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Cristalería + Hielo */}
                                <div className="grid grid-cols-2 gap-2">
                                    <Select value={recipe.glassware || ''} onChange={e => setRecipe(r => ({ ...r, glassware: e.target.value }))} className={`text-xs py-2 ${inputCls}`}>
                                        <option value="">Cristalería…</option>
                                        {GLASSWARE.map(g => <option key={g} value={g}>{g}</option>)}
                                    </Select>
                                    <Select value={recipe.ice || ''} onChange={e => setRecipe(r => ({ ...r, ice: e.target.value }))} className={`text-xs py-2 ${inputCls}`}>
                                        <option value="">Hielo…</option>
                                        {ICE_TYPES.map(i => <option key={i} value={i}>{i}</option>)}
                                    </Select>
                                </div>

                                {/* Garnish + ABV */}
                                <div className="grid grid-cols-[1fr_auto] gap-2">
                                    <Input value={recipe.garnish || ''} onChange={e => setRecipe(r => ({ ...r, garnish: e.target.value }))} placeholder="Garnish (ej. twist de naranja)" className={`text-xs h-9 ${inputCls}`} />
                                    <div className="flex items-center gap-1 w-24">
                                        <Input type="number" value={recipe.abv ?? ''} onChange={e => setRecipe(r => ({ ...r, abv: e.target.value === '' ? undefined : parseFloat(e.target.value) }))} placeholder="ABV" className={`text-xs h-9 text-center ${inputCls}`} />
                                        <span className="text-xs text-slate-400">%</span>
                                    </div>
                                </div>

                                {/* Rinde (porciones) — para coste por porción */}
                                <div className="flex items-center gap-2">
                                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium shrink-0">Rinde</span>
                                    <Input type="number" min="1" value={recipe.porciones ?? ''} onChange={e => setRecipe(r => ({ ...r, porciones: e.target.value === '' ? undefined : parseFloat(e.target.value) }))} placeholder="1" className={`text-xs h-9 w-20 text-center ${inputCls}`} />
                                    <span className="text-[11px] text-slate-500 dark:text-slate-400">porción(es) / trago(s)</span>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT: ingredients */}
                        <div className="space-y-3 flex flex-col min-h-0">
                            <div className="flex items-center justify-between gap-2">
                                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    Ingredientes {lineItems.length > 0 && <span className="text-slate-400">· {lineItems.length}</span>}
                                </label>
                                <div className="flex items-center gap-1.5">
                                    <button type="button" onClick={addLineItem} className="flex items-center gap-1.5 h-8 px-3 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white text-[11px] font-bold uppercase tracking-wider transition-all">
                                        <Icon svg={ICONS.plus} className="h-3.5 w-3.5" /> Ingrediente
                                    </button>
                                    <button type="button" onClick={addSubRecipeItem} className="flex items-center gap-1.5 h-8 px-3 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 hover:bg-violet-500 hover:text-white text-[11px] font-bold uppercase tracking-wider transition-all" title="Añadir una sub-receta (otra receta usada como ingrediente)">
                                        <Icon svg={ICONS.flask} className="h-3.5 w-3.5" /> Sub-receta
                                    </button>
                                    <button type="button" onClick={addGarnishItem} className="flex items-center gap-1.5 h-8 px-3 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500 hover:text-white text-[11px] font-bold uppercase tracking-wider transition-all" title="Añadir un garnish (decoración, se pesa en gramos)">
                                        <Icon svg={ICONS.leaf || ICONS.sparkles} className="h-3.5 w-3.5" /> Garnish
                                    </button>
                                </div>
                            </div>
                            {/* Scrollable list — keeps long recipes (with sub-recipes) contained */}
                            <div className="space-y-2 overflow-y-auto custom-scrollbar pr-1 max-h-[46vh] lg:max-h-[calc(92vh-360px)] min-h-[120px]">
                                {lineItems.length === 0 && (
                                    <div className="text-center py-10 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                                        <Icon svg={ICONS.flask} className="w-7 h-7 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                                        <span className="text-xs text-slate-400 dark:text-slate-500">Añade ingredientes para calcular el coste</span>
                                    </div>
                                )}
                                {lineItems.map((item, index) => {
                                    const lineCost = costResult.costoPorIngrediente[index]?.costo ?? 0;

                                    // --- SUB-RECIPE / GARNISH box: linked to a saved one (ref) OR defined inline ---
                                    if (item.isSubRecipe || item.isGarnish) {
                                        const refMode = item.subItems === undefined;
                                        const isG = !!item.isGarnish;

                                        // Per-kind theming & catalog (garnish = amber + solid units)
                                        const C = isG
                                            ? { box: 'border-amber-200 dark:border-amber-500/30 bg-amber-50/50 dark:bg-amber-500/5', div: 'border-amber-100 dark:border-amber-500/20', chip: 'bg-amber-500/15 text-amber-600 dark:text-amber-400', text: 'text-amber-600 dark:text-amber-400', solid: 'bg-amber-500', border: 'border-amber-200 dark:border-amber-500/30', soft: 'text-amber-400 dark:text-amber-400/70', icon: ICONS.leaf || ICONS.sparkles }
                                            : { box: 'border-violet-200 dark:border-violet-500/30 bg-violet-50/50 dark:bg-violet-500/5', div: 'border-violet-100 dark:border-violet-500/20', chip: 'bg-violet-500/15 text-violet-600 dark:text-violet-400', text: 'text-violet-600 dark:text-violet-400', solid: 'bg-violet-500', border: 'border-violet-200 dark:border-violet-500/30', soft: 'text-violet-400 dark:text-violet-400/70', icon: ICONS.flask };
                                        const catalog = isG ? reusableGarnishes : reusableSubRecipes;
                                        const kindName = isG ? 'garnish' : 'sub-receta';
                                        const unitOptions = isG ? ['g', 'und', 'ml', 'cl'] : ['ml', 'cl', 'oz', 'und', 'g', 'dash'];

                                        // Unit selector shared by both modes
                                        const unitSelect = (
                                            <Select value={item.unidad} onChange={e => updateLineItem(index, 'unidad', e.target.value)} className={`px-1 py-1 h-9 text-xs ${inputCls}`}>
                                                {unitOptions.map(u => <option key={u} value={u}>{u === 'dash' ? 'dsh' : u}</option>)}
                                            </Select>
                                        );
                                        const modeToggle = (
                                            <div className={`flex rounded-lg overflow-hidden border ${C.border} text-[10px] font-bold shrink-0`}>
                                                <button type="button" onClick={() => setSubMode(index, 'ref')} className={`px-2 h-6 transition-colors ${refMode ? `${C.solid} text-white` : `bg-transparent ${C.text}`}`}>Guardada</button>
                                                <button type="button" onClick={() => setSubMode(index, 'inline')} className={`px-2 h-6 transition-colors ${!refMode ? `${C.solid} text-white` : `bg-transparent ${C.text}`}`}>Aquí</button>
                                            </div>
                                        );

                                        // ===== MODE A: linked to a reusable sub-recipe =====
                                        if (refMode) {
                                            const ref = allRecipes.find(r => r.id === item.subRecipeId);
                                            const refItems = (ref?.ingredientes || []) as IngredientLineItem[];
                                            const batch = ref ? calculateRecipeCost(ref, allIngredients, purchaseHistory, allRecipes) : { costoTotal: 0, costoPorIngrediente: [] };
                                            const batchVolume = ref ? recipeTotalVolume(ref) : 0;
                                            const perMl = batchVolume > 0 ? batch.costoTotal / batchVolume : 0;
                                            return (
                                                <div key={index} className={`rounded-xl border ${C.box} overflow-hidden`}>
                                                    <div className={`flex gap-2 items-center p-2 border-b ${C.div}`}>
                                                        <span className={`shrink-0 w-6 h-6 rounded-lg ${C.chip} flex items-center justify-center`} title={isG ? 'Garnish guardado' : 'Sub-receta reutilizable'}><Icon svg={C.icon} className="h-3.5 w-3.5" /></span>
                                                        <div className="flex-1 min-w-0">
                                                            <Select value={item.subRecipeId || ''} onChange={e => updateLineItem(index, 'subRecipeId', e.target.value)} className={`text-sm px-2 py-1 h-9 w-full ${inputCls}`}>
                                                                <option value="">{catalog.length ? `Elige un ${kindName}…` : `No hay ${isG ? 'garnishes' : 'preparaciones'} guardados`}</option>
                                                                {catalog.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                                                            </Select>
                                                        </div>
                                                        <div className="w-14"><Input type="number" value={item.cantidad || ''} onChange={e => updateLineItem(index, 'cantidad', parseFloat(e.target.value))} placeholder={isG ? 'g' : 'ml'} className={`text-center px-1 py-1 h-9 text-sm ${inputCls}`} /></div>
                                                        <div className="w-16">{unitSelect}</div>
                                                        <div className="w-14 text-right shrink-0"><span className={`text-xs font-bold font-mono ${C.text}`}>€{lineCost.toFixed(2)}</span></div>
                                                        <button type="button" onClick={() => removeLineItem(index)} className="w-8 h-8 flex items-center justify-center text-slate-300 dark:text-slate-500 hover:text-red-500 transition-colors"><Icon svg={ICONS.trash} className="h-4 w-4" /></button>
                                                    </div>
                                                    <div className="p-2 bg-white/40 dark:bg-slate-900/20">
                                                        <div className="flex items-center justify-between mb-1.5">
                                                            {modeToggle}
                                                            {ref && <span className={`text-[10px] ${C.text} font-semibold tabular-nums`}>Rinde ~{batchVolume ? Math.round(batchVolume) : 0} {isG ? 'g' : 'ml'} · €{batch.costoTotal.toFixed(2)} · €{perMl.toFixed(4)}/{isG ? 'g' : 'ml'}</span>}
                                                        </div>
                                                        {ref ? (
                                                            <ul className="space-y-0.5">
                                                                {refItems.map((si, k) => (
                                                                    <li key={k} className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                                                                        <span className="truncate">{si.subItems || si.subRecipeId ? '🧪 ' : '• '}{si.nombre || 'Ingrediente'}</span>
                                                                        <span className="tabular-nums shrink-0 ml-2">{si.cantidad || 0} {si.unidad}</span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        ) : (
                                                            <p className={`text-[11px] ${C.soft} py-1`}>
                                                                {catalog.length
                                                                    ? `Selecciona un ${kindName} guardado — su coste se hereda automáticamente.`
                                                                    : `Crea una receta de tipo “${isG ? 'Garnish' : 'Preparación'}”, o usa “Aquí” para definirlo en el momento.`}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        }

                                        // ===== MODE B: defined inline =====
                                        const subItems = (item.subItems || []) as IngredientLineItem[];
                                        const batch = calculateRecipeCost({ ingredientes: subItems }, allIngredients, purchaseHistory);
                                        const batchVolume = recipeTotalVolume({ ingredientes: subItems });
                                        const perMl = batchVolume > 0 ? batch.costoTotal / batchVolume : 0;
                                        return (
                                            <div key={index} className={`rounded-xl border ${C.box} overflow-hidden`}>
                                                {/* Box header: name + qty used + prorated cost */}
                                                <div className={`flex gap-2 items-center p-2 border-b ${C.div}`}>
                                                    <span className={`shrink-0 w-6 h-6 rounded-lg ${C.chip} flex items-center justify-center`} title={isG ? 'Garnish' : 'Sub-receta'}>
                                                        <Icon svg={C.icon} className="h-3.5 w-3.5" />
                                                    </span>
                                                    <div className="flex-1 min-w-0">
                                                        <Input
                                                            value={item.nombre || ''}
                                                            onChange={e => updateLineItem(index, 'nombre', e.target.value)}
                                                            placeholder={`Nombre del ${kindName}…`}
                                                            className={`text-sm font-semibold px-2 py-1 h-9 ${inputCls}`}
                                                        />
                                                    </div>
                                                    <div className="w-14">
                                                        <Input
                                                            type="number"
                                                            value={item.cantidad || ''}
                                                            onChange={e => updateLineItem(index, 'cantidad', parseFloat(e.target.value))}
                                                            placeholder={isG ? 'g' : 'ml'}
                                                            className={`text-center px-1 py-1 h-9 text-sm ${inputCls}`}
                                                        />
                                                    </div>
                                                    <div className="w-16">{unitSelect}</div>
                                                    <div className="w-14 text-right shrink-0">
                                                        <span className={`text-xs font-bold font-mono ${C.text}`}>€{lineCost.toFixed(2)}</span>
                                                    </div>
                                                    <button type="button" onClick={() => removeLineItem(index)} className="w-8 h-8 flex items-center justify-center text-slate-300 dark:text-slate-500 hover:text-red-500 transition-colors">
                                                        <Icon svg={ICONS.trash} className="h-4 w-4" />
                                                    </button>
                                                </div>

                                                {/* Nested ingredient list of the sub-recipe */}
                                                <div className="p-2 space-y-1.5 bg-white/40 dark:bg-slate-900/20">
                                                    <div className="flex items-center justify-between">
                                                        {modeToggle}
                                                        <button type="button" onClick={() => saveSubAsReusable(index)} className={`flex items-center gap-1 text-[10px] font-bold ${C.text} hover:underline`} title={`Guardar como ${kindName} reutilizable en el catálogo`}>
                                                            <Icon svg={ICONS.plus} className="h-3 w-3" /> Guardar al catálogo
                                                        </button>
                                                    </div>
                                                    {subItems.length === 0 && (
                                                        <p className={`text-[11px] ${C.soft} text-center py-2`}>Añade los componentes de este {kindName}</p>
                                                    )}
                                                    {subItems.map((si, k) => {
                                                        const siCost = batch.costoPorIngrediente[k]?.costo ?? 0;
                                                        const siLinked = !!si.ingredientId || allIngredients.some(g => g.nombre?.trim().toLowerCase() === (si.nombre || '').trim().toLowerCase());
                                                        return (
                                                            <div key={k} data-fila-ingrediente className="flex gap-1.5 items-center">
                                                                <div className="flex-1 min-w-0">
                                                                    <Autocomplete
                                                                        items={allIngredients}
                                                                        selectedId={si.ingredientId}
                                                                        onSelect={(id) => updateSubItem(index, k, 'ingredientId', id)}
                                                                        placeholder="Busca ingrediente…"
                                                                    />
                                                                </div>
                                                                <div className="w-12">
                                                                    <Input
                                                                        type="number"
                                                                        value={si.cantidad || ''}
                                                                        onChange={e => updateSubItem(index, k, 'cantidad', parseFloat(e.target.value))}
                                                                        placeholder="0"
                                                                        className={`text-center px-1 py-1 h-8 text-sm ${inputCls}`}
                                                                    />
                                                                </div>
                                                                <div className="w-14">
                                                                    <Select value={si.unidad} onChange={e => updateSubItem(index, k, 'unidad', e.target.value)} className={`px-1 py-1 h-8 text-xs ${inputCls}`}>
                                                                        <option value="ml">ml</option>
                                                                        <option value="cl">cl</option>
                                                                        <option value="oz">oz</option>
                                                                        <option value="und">und</option>
                                                                        <option value="g">g</option>
                                                                        <option value="dash">dsh</option>
                                                                    </Select>
                                                                </div>
                                                                <div className="w-12 text-right shrink-0">
                                                                    {!siLinked
                                                                        ? <span className="text-[10px] text-amber-500 font-bold" title="No vinculado">s/v</span>
                                                                        : siCost <= 0
                                                                            ? <span className="text-[10px] text-rose-400 font-bold">€0</span>
                                                                            : <span className="text-[11px] font-bold font-mono text-teal-600 dark:text-teal-400">€{siCost.toFixed(2)}</span>}
                                                                </div>
                                                                <button type="button" onClick={() => removeSubItem(index, k)} className="w-6 h-6 flex items-center justify-center text-slate-300 dark:text-slate-500 hover:text-red-500 transition-colors">
                                                                    <Icon svg={ICONS.trash} className="h-3.5 w-3.5" />
                                                                </button>
                                                            </div>
                                                        );
                                                    })}
                                                    <div className="flex items-center justify-between pt-0.5">
                                                        <button type="button" onClick={() => addSubItem(index)} className={`flex items-center gap-1 h-7 px-2.5 rounded-full ${isG ? 'bg-amber-500/10 hover:bg-amber-500' : 'bg-violet-500/10 hover:bg-violet-500'} ${C.text} hover:text-white text-[10px] font-bold uppercase tracking-wider transition-all`}>
                                                            <Icon svg={ICONS.plus} className="h-3 w-3" /> Ingrediente
                                                        </button>
                                                        <span className={`text-[10px] ${C.text} font-semibold tabular-nums`}>
                                                            Rinde ~{batchVolume ? Math.round(batchVolume) : 0} {isG ? 'g' : 'ml'} · €{batch.costoTotal.toFixed(2)} · €{perMl.toFixed(4)}/{isG ? 'g' : 'ml'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }

                                    return (
                                        <div key={index} data-fila-ingrediente className="flex gap-2 items-center bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl border border-slate-100 dark:border-slate-700/60">
                                            <div className="flex-1 min-w-0">
                                                <Autocomplete
                                                    items={allIngredients}
                                                    selectedId={item.ingredientId}
                                                    onSelect={(id) => updateLineItem(index, 'ingredientId', id)}
                                                    placeholder="Busca ingrediente…"
                                                />
                                            </div>
                                            <div className="w-14">
                                                <Input
                                                    type="number"
                                                    value={item.cantidad || ''}
                                                    onChange={e => updateLineItem(index, 'cantidad', parseFloat(e.target.value))}
                                                    placeholder="0"
                                                    className={`text-center px-1 py-1 h-9 text-sm ${inputCls}`}
                                                />
                                            </div>
                                            <div className="w-16">
                                                <Select value={item.unidad} onChange={e => updateLineItem(index, 'unidad', e.target.value)} className={`px-1 py-1 h-9 text-xs ${inputCls}`}>
                                                    <option value="ml">ml</option>
                                                    <option value="cl">cl</option>
                                                    <option value="oz">oz</option>
                                                    <option value="und">und</option>
                                                    <option value="g">g</option>
                                                    <option value="dash">dsh</option>
                                                </Select>
                                            </div>
                                            {/* Per-line cost (live) */}
                                            <div className="w-14 text-right shrink-0">
                                                {(() => {
                                                    const linked = !!item.ingredientId || allIngredients.some(g => g.nombre?.trim().toLowerCase() === (item.nombre || '').trim().toLowerCase());
                                                    if (!linked) return <span className="text-[10px] text-amber-500 font-bold" title="No vinculado al inventario">s/v</span>;
                                                    if (lineCost <= 0) return <span className="text-[10px] text-rose-400 font-bold" title="Sin precio en el inventario">€0</span>;
                                                    return <span className="text-xs font-bold font-mono text-teal-600 dark:text-teal-400">€{lineCost.toFixed(2)}</span>;
                                                })()}
                                            </div>
                                            <button type="button" onClick={() => removeLineItem(index)} className="w-8 h-8 flex items-center justify-center text-slate-300 dark:text-slate-500 hover:text-red-500 transition-colors">
                                                <Icon svg={ICONS.trash} className="h-4 w-4" />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </form>
                </div>

                {/* Footer — live cost / price / margin */}
                <div className="p-4 border-t border-slate-200/60 dark:border-white/10 bg-slate-50/80 dark:bg-slate-950/60 backdrop-blur-md shrink-0">
                    {(() => {
                        const costo = currentCost;
                        const venta = parseFloat(String(recipe.precioVenta || 0));
                        const margen = venta > 0 ? ((venta - costo) / venta) * 100 : 0;
                        const marginTone = margen >= 70 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
                            : margen >= 50 ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400'
                                : 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400';
                        return (
                            <div className="flex items-center gap-3">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Costo{(recipe.porciones || 1) > 1 ? ' Total' : ''}</span>
                                    <span className="text-lg font-bold text-slate-700 dark:text-slate-200 tabular-nums">€{costo.toFixed(2)}</span>
                                    {(recipe.porciones || 1) > 1 && (
                                        <span className="text-[10px] text-slate-400 tabular-nums">€{(costo / (recipe.porciones || 1)).toFixed(2)}/porción</span>
                                    )}
                                </div>
                                <div className="h-8 w-px bg-slate-200 dark:bg-slate-700" />
                                <div className="flex flex-col flex-1">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Precio Venta</span>
                                        {suggestedPrice > 0 && (
                                            <button
                                                type="button"
                                                onClick={() => setRecipe({ ...recipe, precioVenta: suggestedPrice })}
                                                className="text-[10px] font-bold text-teal-600 dark:text-teal-400 hover:underline"
                                                title="Aplicar precio para 75% de margen"
                                            >
                                                Sugerido €{suggestedPrice.toFixed(2)}
                                            </button>
                                        )}
                                    </div>
                                    <div className="flex items-center">
                                        <span className="text-sm text-slate-400 mr-1">€</span>
                                        <input
                                            type="number"
                                            value={recipe.precioVenta || ''}
                                            onChange={e => setRecipe({ ...recipe, precioVenta: parseFloat(e.target.value) })}
                                            className="w-full bg-transparent font-bold text-lg text-slate-800 dark:text-white outline-none p-0"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                                <div className={`px-4 py-2 rounded-xl flex flex-col items-center justify-center min-w-[78px] ${marginTone}`}>
                                    <span className="text-[9px] font-black uppercase opacity-70">Margen</span>
                                    <span className="text-sm font-black tabular-nums">{margen.toFixed(0)}%</span>
                                </div>
                            </div>
                        );
                    })()}
                </div>
            </div>
        </div>
    );
};
