import * as React from 'react';
import { collection, doc, addDoc, deleteDoc, writeBatch, Firestore, serverTimestamp } from 'firebase/firestore';
import { useQueryClient } from '@tanstack/react-query';
import { useSuppliers } from '../features/suppliers/hooks/useSuppliers'; // Added import
import { Ingredient, Recipe, ViewName, ZeroWasteResult } from '../types';
import { parseMultipleRecipes } from '../utils/recipeImporter';
import { importPdfRecipes } from '../modules/pdf/importPdfRecipes';
import { useApp } from '../context/AppContext';
import { parseEuroNumber } from "../utils/parseEuroNumber";
import { useGrimorium } from '../features/grimorium/useGrimorium';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Icon } from '../components/ui/Icon';
import { Modal } from '../components/ui/Modal';
import { ICONS } from '../components/ui/icons';
import { IngredientFormModal } from '../components/grimorium/IngredientFormModal';
import { PurchaseModal } from '../components/grimorium/PurchaseModal';
import { BulkPurchaseModal } from '../components/grimorium/BulkPurchaseModal'; // Added import
import { SuppliersManagerModal } from '../components/grimorium/SuppliersManagerModal'; // Corrected import path
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
import { callGeminiApi } from '../utils/gemini';
import { Type } from "@google/genai";
import { Alert } from '../components/ui/Alert';
import { Spinner } from '../components/ui/Spinner';
import { usePurchaseIngredient } from '../hooks/usePurchaseIngredient';


// Escandallator Imports
import EscandalloTab from '../components/escandallator/EscandalloTab';
import BatcherTab from '../components/escandallator/BatcherTab';
import StockManagerTab from '../components/escandallator/StockManagerTab';
import EscandalloHistorySidebar from '../components/escandallator/EscandalloHistorySidebar';
import EscandalloSummaryCard from '../components/escandallator/EscandalloSummaryCard';
import BatcherSidebar from '../components/escandallator/BatcherSidebar';
import StockSidebar from '../components/escandallator/StockSidebar';

// Zero Waste Imports
import ZeroWasteResultCard from '../components/zero-waste/ZeroWasteResultCard';
import ZeroWasteControls from '../components/zero-waste/ZeroWasteControls';
import ZeroWasteHistorySidebar from '../components/zero-waste/ZeroWasteHistorySidebar';

import { useRecipes } from '../hooks/useRecipes';
import { useIngredients } from '../hooks/useIngredients';

interface GrimoriumViewProps {
    onOpenRecipeModal: (recipe: Partial<Recipe> | null) => void;
    onDragRecipeStart: (recipe: Recipe) => void;
    setCurrentView: (view: ViewName) => void;
}

const GrimoriumView: React.FC<GrimoriumViewProps> = ({ onOpenRecipeModal, onDragRecipeStart, setCurrentView }) => {
    const { db, userId, appId } = useApp();
    const { recipes: allRecipes } = useRecipes();
    const { ingredients: allIngredients } = useIngredients();

    // Legacy prop support for sub-components (cleaned up locally)
    // ...

    const { storage } = useApp();
    const [loading, setLoading] = React.useState(false);

    // --- State ---
    const [activeTab, setActiveTab] = React.useState<'recipes' | 'ingredients' | 'escandallo' | 'batcher' | 'stock' | 'zerowaste'>('recipes');

    const {
        searchQuery, setSearchQuery,
        selectedCategory, setSelectedCategory,
        selectedStatus, setSelectedStatus,
        filteredRecipes: hookFilteredRecipes,
        stats,
        handleDeleteRecipe: hookDeleteRecipe,
        handleDuplicateRecipe: hookDuplicateRecipe
    } = useGrimorium({ db, userId, allRecipes, allIngredients });

    // Grimorium State
    // const [recipeSearch, setRecipeSearch] = React.useState(""); // Replaced by hook
    const [ingredientSearch, setIngredientSearch] = React.useState("");
    const [selectedRecipeId, setSelectedRecipeId] = React.useState<string | null>(null);
    // const [filters, setFilters] = React.useState({ category: 'all', status: 'all' }); // Replaced by hook
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
    const [showSuppliersModal, setShowSuppliersModal] = React.useState(false); // New state
    const [isToolOpen, setIsToolOpen] = React.useState(false);

    // --- Escandallator & Batcher State ---
    const [selectedEscandalloRecipe, setSelectedEscandalloRecipe] = React.useState<Recipe | null>(null);
    const [precioVenta, setPrecioVenta] = React.useState<number>(0);

    // Batcher Lifted State
    const [batchSelectedRecipeId, setBatchSelectedRecipeId] = React.useState('');
    const [batchTargetQty, setBatchTargetQty] = React.useState('1');
    const [batchTargetUnit, setBatchTargetUnit] = React.useState<'Litros' | 'Botellas'>('Litros');
    const [batchIncludeDilution, setBatchIncludeDilution] = React.useState(false);

    const escandallosColPath = `users/${userId}/escandallo-history`;
    const [batchResult, setBatchResult] = React.useState<any>(null);
    const [shoppingList, setShoppingList] = React.useState<any[] | null>(null);

    // --- Debounce ---
    const debouncedRecipeSearch = useDebounce(searchQuery, 300);
    const debouncedIngredientSearch = useDebounce(ingredientSearch, 300);

    const ingredientsColPath = `artifacts/${appId}/users/${userId}/grimorio-ingredients`;

    // Purchase Logic
    const {
        startPurchase,
        isPurchaseModalOpen,
        closePurchaseModal,
        confirmPurchase,
        purchaseTarget
    } = usePurchaseIngredient();

    // --- Bulk Purchase Logic ---
    const [isBulkPurchaseModalOpen, setIsBulkPurchaseModalOpen] = React.useState(false);
    const [bulkPurchaseTargets, setBulkPurchaseTargets] = React.useState<Ingredient[]>([]);

    const startBulkPurchase = () => {
        const targets = allIngredients.filter(i => selectedIngredients.includes(i.id));
        if (targets.length === 0) return;
        setBulkPurchaseTargets(targets);
        setIsBulkPurchaseModalOpen(true);
    };

    const confirmBulkPurchase = (orders: { ingredientId: string; quantity: number; totalCost: number; unit: string }[]) => {
        console.log('Bulk Purchase Orders:', orders);
        // Here you would integrate with the actual backend service
        // For now, just log and close
        setIsBulkPurchaseModalOpen(false);
        setBulkPurchaseTargets([]);
        setSelectedIngredients([]); // Clear selection
    };

    // --- Grimorium Helpers ---
    // --- Grimorium Helpers ---
    const handleDeleteRecipe = async (recipeId: string) => {
        await hookDeleteRecipe(recipeId);
        setSelectedRecipeId(null);
    };

    const queryClient = useQueryClient();

    const handleSelectIngredient = (id: string) => {
        setSelectedIngredients(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const handleDeleteIngredient = async (ing: Ingredient) => {
        if (window.confirm(`¿Seguro que quieres eliminar ${ing.nombre}?`)) {
            try {
                await deleteDoc(doc(db, ingredientsColPath, ing.id));
                // Invalidate cache with exact matching keys to force UI update
                await queryClient.invalidateQueries({ queryKey: ['ingredients'] }); // Keep fuzzy for broader safety
                await queryClient.invalidateQueries({ queryKey: ['ingredients', appId, userId] }); // Exact match

                if (selectedIngredients.includes(ing.id)) handleSelectIngredient(ing.id);
                if (selectedIngredientId === ing.id) setSelectedIngredientId(null);
            } catch (error) {
                console.error("Error eliminando ingrediente:", error);
                alert("Error al eliminar el ingrediente.");
            }
        }
    };

    const handleDeleteSelectedIngredients = async () => {
        if (window.confirm(`¿Seguro que quieres eliminar ${selectedIngredients.length} ingredientes?`)) {
            try {
                const batch = writeBatch(db);
                selectedIngredients.forEach(id => batch.delete(doc(db, ingredientsColPath, id)));
                await batch.commit();

                // Invalidate cache
                await queryClient.invalidateQueries({ queryKey: ['ingredients'] });
                await queryClient.invalidateQueries({ queryKey: ['ingredients', appId, userId] });

                setSelectedIngredients([]);
                setSelectedIngredientId(null);
            } catch (error) {
                console.error("Error eliminando ingredientes:", error);
                alert("Error al eliminar los ingredientes seleccionados.");
            }
        }
    };

    // --- Recipe Bulk Delete ---
    const [selectedRecipes, setSelectedRecipes] = React.useState<string[]>([]);

    const handleDeleteSelectedRecipes = async () => {
        if (window.confirm(`¿Seguro que quieres eliminar ${selectedRecipes.length} recetas?`)) {
            try {
                const batch = writeBatch(db);
                selectedRecipes.forEach(id => batch.delete(doc(db, `users/${userId}/grimorio`, id)));
                await batch.commit();

                // Force cache invalidation to update UI immediately
                await queryClient.invalidateQueries({ queryKey: ['recipes'] });
                await queryClient.invalidateQueries({ queryKey: ['recipes', appId, userId] });

                setSelectedRecipes([]);
                setSelectedRecipeId(null);
            } catch (error) {
                console.error("Error deleting recipes:", error);
                alert("Error al eliminar las recetas seleccionadas.");
            }
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

            await queryClient.invalidateQueries({ queryKey: ['recipes'] });
            await queryClient.invalidateQueries({ queryKey: ['recipes', appId, userId] });

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

            await queryClient.invalidateQueries({ queryKey: ['recipes'] });
            await queryClient.invalidateQueries({ queryKey: ['recipes', appId, userId] });

            alert(`${newRecipes.length} recetas importadas.`);
        } catch (error) { console.error(error); alert("Error importando PDF."); } finally { setLoading(false); setShowPdfImportModal(false); }
    };

    const [csvSupplierId, setCsvSupplierId] = React.useState<string>("");
    const { suppliers } = useSuppliers({ db, userId }); // Added hook for CSV import

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
            let updatedCount = 0;

            // Map existing ingredients for fast lookup
            const existingMap = new Map(allIngredients.map(i => [i.nombre.toLowerCase().trim(), i]));

            for (const row of rows) {
                if (!row.trim()) continue;
                const cols = row.split(text.includes(';') ? ';' : ',');
                if (!cols[0]) continue;

                const name = cols[0].trim();
                const normalizedName = name.toLowerCase();
                const price = parseEuroNumber(cols[2]);
                const unit = cols[3]?.trim() || 'und';
                const category = cols[1]?.trim() || 'General';

                const existingIngredient = existingMap.get(normalizedName);

                if (existingIngredient) {
                    // Update existing
                    const ingredientRef = doc(db, ingredientsColPath, existingIngredient.id);
                    const updates: any = {};
                    let needsUpdate = false;

                    // 1. Link New Supplier if provided
                    if (csvSupplierId && !existingIngredient.proveedores?.includes(csvSupplierId)) {
                        const currentSuppliers = existingIngredient.proveedores || [];
                        updates.proveedores = [...currentSuppliers, csvSupplierId];
                        needsUpdate = true;
                    }

                    // 2. Update Supplier Data (Price Limit)
                    if (csvSupplierId) {
                        const currentSupplierData = existingIngredient.supplierData || {};
                        updates.supplierData = {
                            ...currentSupplierData,
                            [csvSupplierId]: {
                                price: price,
                                unit: unit,
                                lastUpdated: serverTimestamp()
                            }
                        };
                        // Also update main price if it's 0 or we want to overwrite (keeping it simple: update if new supplier is primary context)
                        // For now, let's only update standard price if it was 0
                        if (!existingIngredient.precioCompra || existingIngredient.precioCompra === 0) {
                            updates.precioCompra = price;
                        }
                        needsUpdate = true;
                    }

                    if (needsUpdate) {
                        batch.update(ingredientRef, updates);
                        updatedCount++;
                    }

                } else {
                    // Create New
                    const newDocRef = doc(collection(db, ingredientsColPath));
                    const dataToSave: any = {
                        nombre: name,
                        categoria: category,
                        precioCompra: price,
                        unidadCompra: unit,
                        proveedores: csvSupplierId ? [csvSupplierId] : [],
                        supplierData: csvSupplierId ? {
                            [csvSupplierId]: {
                                price: price,
                                unit: unit,
                                lastUpdated: serverTimestamp()
                            }
                        } : {}
                    };
                    batch.set(newDocRef, dataToSave);
                    count++;
                }
            }
            await batch.commit();
            // Invalidate cache to update UI immediately
            await queryClient.invalidateQueries({ queryKey: ['ingredients'] });
            await queryClient.invalidateQueries({ queryKey: ['ingredients', appId, userId] });

            alert(`Importación completada: ${count} nuevos, ${updatedCount} actualizados.`);
            setLoading(false);
            setShowCsvImportModal(false);
            setCsvSupplierId(""); // Reset
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

    // const filteredRecipes = React.useMemo(...); // Replaced by hook
    const filteredRecipes = hookFilteredRecipes;

    const selectedRecipe = React.useMemo(() => allRecipes.find(r => r.id === selectedRecipeId) || null, [allRecipes, selectedRecipeId]);
    const selectedIngredient = React.useMemo(() => allIngredients.find(i => i.id === selectedIngredientId) || null, [allIngredients, selectedIngredientId]);
    // const stats = ... // Replaced by hook

    const handleDuplicateRecipe = hookDuplicateRecipe;

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

    // --- Zero Waste State ---
    const [zwSelectedIngredients, setZwSelectedIngredients] = React.useState<string[]>([]);
    const [zwRawIngredients, setZwRawIngredients] = React.useState("");
    const [zwLoading, setZwLoading] = React.useState(false);
    const [zwError, setZwError] = React.useState<string | null>(null);
    const [zwRecipeResults, setZwRecipeResults] = React.useState<ZeroWasteResult[]>([]);
    const [zwHistory, setZwHistory] = React.useState<ZeroWasteResult[]>([]);

    // --- Zero Waste Logic ---
    const handleZwIngredientToggle = (ingredientName: string) => {
        setZwSelectedIngredients(prev => prev.includes(ingredientName) ? prev.filter(name => name !== ingredientName) : [...prev, ingredientName]);
    };

    const handleSendToZeroWaste = (ing: Ingredient) => {
        setZwSelectedIngredients(prev => prev.includes(ing.nombre) ? prev : [...prev, ing.nombre]);
        setActiveTab('zerowaste');
        setSelectedIngredientId(null); // Close panel
    };

    const handleGenerateZeroWasteRecipes = async () => {
        setZwLoading(true);
        setZwError(null);
        setZwRecipeResults([]);

        const promptIngredients = [...zwSelectedIngredients, zwRawIngredients].filter(Boolean).join(', ');
        if (!promptIngredients) {
            setZwError("Por favor, seleccione o introduzca al menos un ingrediente.");
            setZwLoading(false);
            return;
        }

        const systemPrompt = "Eres un chef de I+D 'zero waste' de élite. NO eres un bartender. Tu foco es crear *elaboraciones complejas* (cordiales, siropes, polvos, aceites, shrubs) a partir de desperdicios, para que *luego* un bartender las use. NO generes un cóctel completo. Tu respuesta debe ser estrictamente un array JSON.";
        const userQuery = `Usando estos ingredientes: ${promptIngredients}. Genera de 3 a 5 elaboraciones 'zero waste'. Devuelve un array JSON. Cada objeto debe tener: 'nombre' (string), 'ingredientes' (string con markdown para una lista de viñetas), 'preparacion' (string con markdown para una lista numerada).`;

        const generationConfig = {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        nombre: { type: Type.STRING },
                        ingredientes: { type: Type.STRING },
                        preparacion: { type: Type.STRING },
                    },
                },
            },
        };

        try {
            const response = await callGeminiApi(userQuery, systemPrompt, generationConfig);
            const results = JSON.parse(response.text) as ZeroWasteResult[];
            setZwRecipeResults(results);
            setZwHistory(prev => [...results, ...prev]);
        } catch (e: any) {
            setZwError(e.message || 'An unknown error occurred');
            console.error(e);
        } finally {
            setZwLoading(false);
        }
    };

    const handleZwHistorySelect = (result: ZeroWasteResult) => {
        setZwRecipeResults([result]);
        setActiveTab('zerowaste'); // Ensure tab is active
    };

    // --- Dynamic Props Calculation ---
    // Calculate colors and gradient based on activeTab
    const currentGradient = activeTab === 'recipes' ? 'indigo' :
        activeTab === 'ingredients' ? 'emerald' :
            activeTab === 'escandallo' ? 'red' :
                activeTab === 'batcher' ? 'yellow' :
                    activeTab === 'stock' ? 'ice' :
                        activeTab === 'zerowaste' ? 'lime' : 'slate';

    const handleConfigureBatch = (amount: number, unit: 'Litros' | 'Botellas') => {
        setBatchTargetQty(amount.toString());
        setBatchTargetUnit(unit);
        // If we want to auto-select a recipe, we can't unless we know which one, 
        // but this is mostly for "New Batch" setup of quantity.
        // If a recipe was already selected, it stays. 
        // If not, user picks it.
    };

    const handleStockAction = (action: string) => {
        if (action === 'new_product') {
            setEditingIngredient(null);
            setShowIngredientModal(true);
        } else if (action === 'providers') {
            setShowSuppliersModal(true); // Open modal
        }
    };

    return (
        <PremiumLayout
            id="grimorium-section"
            gradientTheme={currentGradient}
            transparentColumns={true}
            className="lg:!grid-cols-[minmax(150px,300px),minmax(600px,1fr),400px] gap-px" // 3-Column Layout: Exact Resizing (Left Shrinks to 150px, Center Min 600, Right Fixed)
            header={
                <div className="flex items-center gap-2 w-fit max-w-full overflow-x-auto no-scrollbar">
                    <button onClick={() => setActiveTab('recipes')} className={`flex-shrink-0 py-2 px-5 text-sm font-semibold rounded-full transition-all duration-300 ${activeTab === 'recipes' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800'}`}>Recetas</button>
                    <button onClick={() => setActiveTab('ingredients')} className={`flex-shrink-0 py-2 px-5 text-sm font-semibold rounded-full transition-all duration-300 ${activeTab === 'ingredients' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800'}`}>Ingredientes</button>
                    <button onClick={() => setActiveTab('escandallo')} className={`flex-shrink-0 py-2 px-5 text-sm font-semibold rounded-full transition-all duration-300 ${activeTab === 'escandallo' ? 'bg-red-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800'}`}>Escandallo</button>
                    <button onClick={() => setActiveTab('batcher')} className={`flex-shrink-0 py-2 px-5 text-sm font-semibold rounded-full transition-all duration-300 ${activeTab === 'batcher' ? 'bg-amber-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800'}`}>Batcher</button>
                    <button onClick={() => setActiveTab('stock')} className={`flex-shrink-0 py-2 px-5 text-sm font-semibold rounded-full transition-all duration-300 ${activeTab === 'stock' ? 'bg-sky-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800'}`}>Stock</button>
                    <button onClick={() => setActiveTab('zerowaste')} className={`flex-shrink-0 py-2 px-5 text-sm font-semibold rounded-full transition-all duration-300 ${activeTab === 'zerowaste' ? 'bg-lime-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800'}`}>Zero Waste</button>
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
                        <EscandalloHistorySidebar
                            db={db}
                            escandallosColPath={escandallosColPath}
                            onLoadHistory={handleLoadHistory}
                            onNewEscandallo={() => { setSelectedEscandalloRecipe(null); setPrecioVenta(0); }}
                        />
                    )}
                    {activeTab === 'batcher' && (
                        <BatcherSidebar
                            onConfigureBatch={handleConfigureBatch}
                        />
                    )}
                    {activeTab === 'stock' && (
                        <StockSidebar
                            onAction={handleStockAction}
                        />
                    )}
                    {activeTab === 'zerowaste' && <ZeroWasteHistorySidebar history={zwHistory} onSelect={handleZwHistorySelect} />}
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
                                searchTerm={searchQuery}
                                onSearchChange={setSearchQuery}
                                selectedCategory={selectedCategory}
                                onCategoryChange={(cat) => setSelectedCategory(cat)}
                                availableCategories={['Coctel', 'Mocktail', 'Preparacion', 'Otro', ...new Set(allRecipes.flatMap(r => r.categorias || []))]}
                                selectedStatus={selectedStatus}
                                onStatusChange={(stat) => setSelectedStatus(stat)}
                                onDelete={() => selectedRecipeId && handleDeleteRecipe(selectedRecipeId)}

                                // Bulk Actions props
                                selectedRecipeIds={selectedRecipes}
                                onToggleSelection={(id) => setSelectedRecipes(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id])}
                                onSelectAll={(select) => setSelectedRecipes(select ? filteredRecipes.map(r => r.id) : [])}
                                onSelectAll={(select) => setSelectedRecipes(select ? filteredRecipes.map(r => r.id) : [])}
                                onDeleteSelected={handleDeleteSelectedRecipes}
                                onImport={() => setShowPdfImportModal(true)}
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
                                availableCategories={['General', ...new Set(allIngredients.map(i => i.categoria))]}
                                onBuy={startPurchase}
                                onBulkBuy={startBulkPurchase}
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
                            <BatcherTab
                                db={db}
                                appId={appId}
                                allRecipes={allRecipes}
                                setBatchResult={setBatchResult}
                                selectedRecipeId={batchSelectedRecipeId}
                                targetQuantity={batchTargetQty}
                                targetUnit={batchTargetUnit}
                                includeDilution={batchIncludeDilution}
                                onRecipeChange={setBatchSelectedRecipeId}
                                onQuantityChange={setBatchTargetQty}
                                onUnitChange={setBatchTargetUnit}
                                onDilutionChange={setBatchIncludeDilution}
                            />
                        )}
                        {activeTab === 'stock' && (
                            <StockManagerTab allRecipes={allRecipes} allIngredients={allIngredients} setShoppingList={setShoppingList} />
                        )}
                        {activeTab === 'zerowaste' && (
                            <div className="h-full overflow-y-auto custom-scrollbar p-0 w-full max-w-full">
                                {zwLoading && (
                                    <div className="flex flex-col items-center justify-center h-64 animate-pulse">
                                        <Spinner className="w-12 h-12 text-lime-500 mb-4" />
                                        <p className="text-lime-700 font-medium">Analizando desperdicios...</p>
                                    </div>
                                )}

                                {zwError && <Alert variant="destructive" title="Error de Generación" description={zwError} className="mb-4" />}

                                {!zwLoading && zwRecipeResults.length === 0 && (
                                    <div className="flex flex-col items-center justify-center h-64 text-slate-400 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl bg-white/20 dark:bg-slate-900/10 w-full">
                                        <Icon svg={ICONS.flask} className="w-12 h-12 mb-3 opacity-40" />
                                        <p className="text-lg font-light">Selecciona ingredientes y genera ideas Zero Waste</p>
                                    </div>
                                )}

                                {zwRecipeResults.length > 0 && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-6 pb-20">
                                        {zwRecipeResults.map((recipe, index) => (
                                            <div key={index} className="w-full">
                                                <ZeroWasteResultCard
                                                    recipe={recipe}
                                                    db={db}
                                                    userId={userId}
                                                    appId={appId}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            }
            rightSidebar={
                <div className={`h-full ${((activeTab === 'recipes' && selectedRecipe) || (activeTab === 'ingredients' && selectedIngredient) || activeTab === 'escandallo' || activeTab === 'batcher' || activeTab === 'stock' || activeTab === 'zerowaste') ? '' : 'hidden lg:block opacity-50 pointer-events-none'}`}>
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
                            onClose={() => setSelectedRecipeId(null)}
                            onEscandallo={() => { setSelectedEscandalloRecipe(selectedRecipe); setActiveTab('escandallo'); }}
                            onBatcher={() => {
                                setBatchSelectedRecipeId(selectedRecipe.id);
                                setActiveTab('batcher');
                            }}
                        />
                    )}

                    {/* INGREDIENTS DETAIL */}
                    {activeTab === 'ingredients' && selectedIngredient && (
                        <IngredientDetailPanel
                            ingredient={selectedIngredient}
                            onEdit={(ing) => { setEditingIngredient(ing); setShowIngredientModal(true); }}
                            onDelete={(ing) => handleDeleteIngredient(ing)}
                            onClose={() => setSelectedIngredientId(null)}
                            onSendToZeroWaste={handleSendToZeroWaste}
                            onBuy={() => startPurchase(selectedIngredient)}
                        />
                    )}

                    {/* ESCANDALLO RESULTS */}
                    {activeTab === 'escandallo' && (
                        <div className="h-full overflow-y-auto custom-scrollbar p-4 w-[98%] mx-auto">
                            {escandalloData ? (
                                <EscandalloSummaryCard

                                    recipeName={selectedEscandalloRecipe?.nombre || 'Receta'}
                                    reportData={escandalloData.report}
                                    pieData={escandalloData.pie}
                                    onSaveHistory={handleSaveToHistory}
                                    onExport={() => window.print()}
                                    recipe={selectedEscandalloRecipe}
                                />
                            ) : (
                                <EmptyState icon={ICONS.chart} text="Resultados" subtext="Selecciona una receta para ver el análisis." />
                            )}
                        </div>
                    )}

                    {/* BATCHER RESULTS */}
                    {activeTab === 'batcher' && (
                        <div className="h-full overflow-y-auto custom-scrollbar p-4 w-[98%] mx-auto">
                            {batchResult ? (
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
                            )}
                        </div>
                    )}

                    {/* STOCK RESULTS */}
                    {activeTab === 'stock' && (
                        <div className="h-full overflow-y-auto custom-scrollbar p-4 w-[98%] mx-auto">
                            {shoppingList ? (
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
                            )}
                        </div>
                    )}

                    {/* ZERO WASTE CONTROLS */}
                    {activeTab === 'zerowaste' && (
                        <ZeroWasteControls
                            allIngredients={allIngredients}
                            selectedIngredients={zwSelectedIngredients}
                            rawIngredients={zwRawIngredients}
                            loading={zwLoading}
                            onToggleIngredient={handleZwIngredientToggle}
                            onRawIngredientsChange={setZwRawIngredients}
                            onGenerate={handleGenerateZeroWasteRecipes}
                        />
                    )}

                    {/* Empty State Fallback for Recipes/Ingredients when nothing selected */}
                    {/* Empty State Fallback for Recipes/Ingredients when nothing selected */}
                    {(!selectedRecipe && activeTab === 'recipes') && (
                        <div className="h-full flex items-center justify-center text-white/40 text-center p-8">
                            <div className="animate-pulse">
                                <p className="font-medium text-lg tracking-wide">Selecciona una receta</p>
                            </div>
                        </div>
                    )}
                    {(!selectedIngredient && activeTab === 'ingredients') && (
                        <div className="h-full flex items-center justify-center text-white/40 text-center p-8">
                            <div className="animate-pulse">
                                <p className="font-medium text-lg tracking-wide">Selecciona un ingrediente</p>
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
                    <RecipeDetailPanel recipe={selectedRecipe} allIngredients={allIngredients} onEdit={(r) => onOpenRecipeModal(r)} onDelete={(r) => handleDeleteRecipe(r.id)} onDuplicate={handleDuplicateRecipe} onToolToggle={setIsToolOpen} onNavigate={(view, data) => setCurrentView(view)} onClose={() => setSelectedRecipeId(null)} />
                </div>
            )}
            {selectedIngredient && activeTab === 'ingredients' && (
                <div className="lg:hidden fixed inset-0 z-50 bg-white dark:bg-slate-950 p-4 overflow-y-auto">
                    <Button size="icon" variant="ghost" onClick={() => setSelectedIngredientId(null)} className="absolute top-4 right-4"><Icon svg={ICONS.x} /></Button>
                    <IngredientDetailPanel ingredient={selectedIngredient} onEdit={(ing) => { setEditingIngredient(ing); setShowIngredientModal(true); }} onDelete={(ing) => handleDeleteIngredient(ing)} onClose={() => setSelectedIngredientId(null)} onBuy={startPurchase} />
                </div>
            )}

            {/* Modals */}
            <PurchaseModal isOpen={isPurchaseModalOpen} onClose={closePurchaseModal} ingredient={purchaseTarget} onConfirm={confirmPurchase} suppliers={suppliers} />
            <BulkPurchaseModal
                isOpen={isBulkPurchaseModalOpen}
                onClose={() => setIsBulkPurchaseModalOpen(false)}
                ingredients={bulkPurchaseTargets}
                onConfirm={confirmBulkPurchase}
                suppliers={suppliers}
            />
            {showSuppliersModal && <SuppliersManagerModal isOpen={showSuppliersModal} onClose={() => setShowSuppliersModal(false)} />}
            {showIngredientModal && <IngredientFormModal isOpen={showIngredientModal} onClose={() => setShowIngredientModal(false)} db={db} userId={userId} appId={appId} editingIngredient={editingIngredient} />}
            <Modal isOpen={showCsvImportModal} onClose={() => setShowCsvImportModal(false)} title="Importar Ingredientes CSV">
                <div className="space-y-4 p-4">
                    <p className="text-sm text-slate-500">Formato: Nombre;Categoria;Precio;Unidad.</p>
                    <div className="space-y-2">
                        <Label>Proveedor (Opcional)</Label>
                        <select
                            className="w-full h-10 pl-3 pr-8 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                            value={csvSupplierId}
                            onChange={(e) => setCsvSupplierId(e.target.value)}
                        >
                            <option value="">-- Sin asignar --</option>
                            {suppliers.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                        <p className="text-[10px] text-slate-400">Todos los ingredientes importados se vincularán a este proveedor.</p>
                    </div>
                    <Input type="file" accept=".csv" onChange={handleCsvImport} />
                </div>
            </Modal>
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
