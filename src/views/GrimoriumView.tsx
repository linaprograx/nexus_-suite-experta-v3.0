import * as React from 'react';
import { collection, doc, addDoc, deleteDoc, writeBatch, Firestore, serverTimestamp } from 'firebase/firestore';
import { ImportRecipeModal } from '../components/grimorium/ImportRecipeModal';
import { parseCsvRecipes } from '../utils/csvRecipeImporter';

import { useQueryClient } from '@tanstack/react-query';
import { useSuppliers } from '../features/suppliers/hooks/useSuppliers';
import { useOrders, Order } from '../hooks/useOrders';
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
import { BulkPurchaseModal } from '../components/grimorium/BulkPurchaseModal';
import { StockReplenishmentModal } from '../components/grimorium/StockReplenishmentModal';
import { SuppliersManagerModal } from '../components/grimorium/SuppliersManagerModal';
import { FiltersSidebar } from '../components/grimorium/FiltersSidebar';
import { Toast } from '../components/ui/Toast';
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

import { buildStockFromPurchases } from '../utils/stockUtils';


// Escandallator Imports
import EscandallatorPanel from '../components/escandallator/EscandallatorPanel';
import EscandallatorSidebar from '../components/escandallator/EscandallatorSidebar';
import EscandalloSummaryCard from '../components/escandallator/EscandalloSummaryCard';
import { StockInventoryPanel } from '../components/escandallator/StockInventoryPanel';
import { StockOrdersPanel } from '../components/escandallator/StockOrdersPanel';
import { StockRulesPanel } from '../components/escandallator/StockRulesPanel';

// Zero Waste Imports
import ZeroWasteResultCard from '../components/zero-waste/ZeroWasteResultCard';
import ZeroWasteControls from '../components/zero-waste/ZeroWasteControls';
import ZeroWasteHistorySidebar from '../components/zero-waste/ZeroWasteHistorySidebar';

import { useRecipes } from '../hooks/useRecipes';
import { useIngredients } from '../hooks/useIngredients';
import { SuppliersList } from '../components/grimorium/SuppliersList';
import { MarketSidebar } from '../components/grimorium/MarketSidebar';


// --- NEW ARCHITECTURE IMPORTS ---
import { GrimoriumShell } from './grimorium/shell/GrimoriumShell';
import { useItemContext } from '../context/Grimorium/ItemContext';
import { GrimoriumToolbar } from './grimorium/shell/GrimoriumToolbar';
import { LayerPanel } from './grimorium/shell/LayerPanel';


interface GrimoriumViewProps {
    onOpenRecipeModal: (recipe: Partial<Recipe> | null) => void;
    onDragRecipeStart: (recipe: Recipe) => void;
    setCurrentView: (view: ViewName) => void;
}

const GrimoriumInner: React.FC<GrimoriumViewProps> = ({ onOpenRecipeModal, onDragRecipeStart, setCurrentView }) => {
    const { db, userId, appId } = useApp();
    const { recipes: allRecipes, isLoading: recipesLoading } = useRecipes();
    const { ingredients: allIngredients } = useIngredients();

    // --- Context Consumption ---
    const {
        viewMode, // 'recipes' | 'stock' | 'market'
        activeLayer, // 'composition' | 'cost' | 'optimization'
        toggleLayer,
        selectItem,
        activeItem,
        setLayer
    } = useItemContext();

    // [PERF_BASELINE] Logging
    React.useEffect(() => {
        console.log('[PERF_BASELINE] GrimoriumView MOUNTED');
    }, []);

    React.useEffect(() => {
        console.time(`[PERF_BASELINE] Tab Switch to ${viewMode}`);
        // We can't easily console.timeEnd here because this effect runs AFTER the painting.
        // But logging the event helps correlate with Profiler.
        console.log(`[PERF_BASELINE] ViewMode changed to: ${viewMode}`);
        return () => console.timeEnd(`[PERF_BASELINE] Tab Switch to ${viewMode}`);
    }, [viewMode]);

    // Track renders
    if (process.env.NODE_ENV === 'development') {
        console.log('[PERF_BASELINE] GrimoriumView RENDER');
    }

    const { storage } = useApp();
    const [loading, setLoading] = React.useState(false);

    const [escandallatorSubTab, setEscandallatorSubTab] = React.useState<'calculator' | 'production'>('calculator');

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
    const [ingredientSearch, setIngredientSearch] = React.useState("");
    const [selectedRecipeId, setSelectedRecipeId] = React.useState<string | null>(null);
    const [ingredientFilters, setIngredientFilters] = React.useState({ category: 'all', status: 'all' });
    const [selectedIngredients, setSelectedIngredients] = React.useState<string[]>([]);
    const [selectedIngredientId, setSelectedIngredientId] = React.useState<string | null>(null);

    // --- Sync Selection with Context ---
    React.useEffect(() => {
        if (selectedRecipeId) {
            const r = allRecipes.find(r => r.id === selectedRecipeId);
            if (r) selectItem(r);
        } else if (selectedIngredientId) {
            const i = allIngredients.find(ing => ing.id === selectedIngredientId);
            if (i) selectItem(i);
        } else {
            if (activeLayer === 'composition') {
                selectItem(null);
            }
        }
    }, [selectedRecipeId, selectedIngredientId, allRecipes, allIngredients]);

    // Modals
    const [showIngredientModal, setShowIngredientModal] = React.useState(false);
    const [editingIngredient, setEditingIngredient] = React.useState<Ingredient | null>(null);
    const [showCsvImportModal, setShowCsvImportModal] = React.useState(false);
    const [showTxtImportModal, setShowTxtImportModal] = React.useState(false);
    const [showPdfImportModal, setShowPdfImportModal] = React.useState(false);
    const [showImportChoiceModal, setShowImportChoiceModal] = React.useState(false); // NEW
    const [useOcr, setUseOcr] = React.useState(false);
    const [showSuppliersModal, setShowSuppliersModal] = React.useState(false);
    const [isToolOpen, setIsToolOpen] = React.useState(false);

    // --- Escandallator & Batcher State ---
    const [selectedEscandalloRecipe, setSelectedEscandalloRecipe] = React.useState<Recipe | null>(null);
    const [precioVenta, setPrecioVenta] = React.useState<number>(0);
    const [batchSelectedRecipeId, setBatchSelectedRecipeId] = React.useState('');
    const [batchTargetQty, setBatchTargetQty] = React.useState('1');
    const [batchTargetUnit, setBatchTargetUnit] = React.useState<'Litros' | 'Botellas'>('Litros');
    const [batchIncludeDilution, setBatchIncludeDilution] = React.useState(false);
    const escandallosColPath = `users/${userId}/escandallo-history`;
    const [batchResult, setBatchResult] = React.useState<any>(null);

    const debouncedRecipeSearch = useDebounce(searchQuery, 300);
    const debouncedIngredientSearch = useDebounce(ingredientSearch, 300);
    const ingredientsColPath = `artifacts/${appId}/users/${userId}/grimorio-ingredients`;

    // Purchase Logic
    const {
        purchaseTarget,
        isPurchaseModalOpen,
        startPurchase,
        confirmPurchase,
        purchaseHistory,
        addPurchase,
        closePurchaseModal
    } = usePurchaseIngredient();
    const { orders, createOrder, deleteOrder, updateOrderStatus } = useOrders();

    // --- Stock Logic Hoisted ---
    const calculatedStockItems = React.useMemo(() => {
        if (!purchaseHistory) return [];
        return buildStockFromPurchases(purchaseHistory);
    }, [purchaseHistory]);

    // --- Bulk Purchase Logic ---
    const [isBulkPurchaseModalOpen, setIsBulkPurchaseModalOpen] = React.useState(false);
    const [bulkPurchaseTargets, setBulkPurchaseTargets] = React.useState<Ingredient[]>([]);

    // Stock V2 State
    const [isReplenishModalOpen, setIsReplenishModalOpen] = React.useState(false);
    const [editingOrder, setEditingOrder] = React.useState<Order | null>(null);
    const [toast, setToast] = React.useState({ message: '', type: 'success' as 'success' | 'error' | 'info', isVisible: false });

    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
        setToast({ message, type, isVisible: true });
    };

    const startBulkPurchase = () => {
        const targets = allIngredients.filter(i => selectedIngredients.includes(i.id));
        if (targets.length === 0) return;
        setBulkPurchaseTargets(targets);
        setIsBulkPurchaseModalOpen(true);
    };

    const [stockRules, setStockRules] = React.useState<any[]>([]);

    const checkAndCreateRule = (ingredientId: string, ingredientName: string) => {
        setStockRules(prev => {
            if (!prev.find(r => r.ingredientId === ingredientId)) {
                // Auto-create rule
                const newRule = {
                    id: Math.random().toString(36).substr(2, 9),
                    ingredientId,
                    ingredientName,
                    minStock: 1,
                    reorderQuantity: 1,
                    active: true
                };
                showToast(`Regla de stock creada para ${ingredientName}`, 'info');
                return [...prev, newRule];
            }
            return prev;
        });
    };

    const confirmBulkPurchase = async (orders: { ingredientId: string; quantity: number; totalCost: number; unit: string }[]) => {
        try {
            const promises = orders.map(async (order) => {
                const ingredient = allIngredients.find(i => i.id === order.ingredientId);
                if (!ingredient) throw new Error(`Ingrediente ${order.ingredientId} no encontrado`);
                checkAndCreateRule(ingredient.id, ingredient.nombre);
                const providerId = ingredient.proveedor || (ingredient.proveedores && ingredient.proveedores[0]) || 'generic_provider';
                const supplierObj = suppliers.find(s => s.id === providerId);
                const providerName = supplierObj ? supplierObj.name : (providerId !== 'generic_provider' ? providerId : 'Proveedor Desconocido');

                await addPurchase({
                    ingredientId: ingredient.id,
                    ingredientName: ingredient.nombre,
                    providerId: providerId,
                    providerName: providerName,
                    unit: order.unit,
                    quantity: order.quantity,
                    unitPrice: ingredient.precioCompra || 0,
                    totalCost: order.totalCost,
                    createdAt: new Date(),
                    status: 'completed'
                });
            });
            await Promise.all(promises);
            showToast('Compra múltiple realizada con éxito', 'success');
        } catch (error) {
            console.error("Error en compra múltiple:", error);
            showToast("Hubo un error al procesar algunos pedidos: " + (error as any).message, 'error');
        } finally {
            setIsBulkPurchaseModalOpen(false);
            setBulkPurchaseTargets([]);
            setSelectedIngredients([]);
        }
    };

    const handleConfirmReplenish = async (orderGroups: { providerId: string; providerName: string; items: any[] }[]) => {
        try {
            const promises = orderGroups.map(async (group) => {
                const orderItems = group.items.map(item => ({
                    ingredientId: item.ingredientId,
                    ingredientName: allIngredients.find(i => i.id === item.ingredientId)?.nombre || 'Unknown',
                    quantity: item.quantity,
                    unit: item.unit,
                    estimatedCost: item.estimatedCost
                }));
                const orderName = `Pedido - ${group.providerName}`;
                await createOrder(orderItems, orderName);
            });
            await Promise.all(promises);
            setIsReplenishModalOpen(false);
            showToast(`${orderGroups.length} Hojas de Pedido creadas en Borradores`, 'success');
        } catch (e) {
            console.error(e);
            showToast("Error creando borrador(es)", 'error');
        }
    };

    const handleLaunchOrder = async (order: Order) => {
        try {
            // ... [Logic omitted for brevity]
            const promises = order.items.map(async (item) => {
                const ingredient = allIngredients.find(i => i.id === item.ingredientId);
                if (ingredient) checkAndCreateRule(ingredient.id, ingredient.nombre);
                const providerId = ingredient?.proveedor || 'generic_provider';
                const providerName = suppliers.find(s => s.id === providerId)?.name || 'Proveedor Desconocido';
                await addPurchase({
                    ingredientId: item.ingredientId,
                    ingredientName: item.ingredientName,
                    providerId: providerId,
                    providerName: providerName,
                    unit: item.unit,
                    quantity: item.quantity,
                    unitPrice: (item.estimatedCost / item.quantity) || 0,
                    totalCost: item.estimatedCost,
                    createdAt: new Date(),
                    status: 'completed'
                });
            });
            await Promise.all(promises);
            await updateOrderStatus(order.id, 'completed');
            showToast("Pedido lanzado y stock actualizado", 'success');
        } catch (e) {
            console.error(e);
            showToast("Error lanzando pedido", 'error');
        }
    };

    const handleDeletePurchase = async (purchaseId: string) => {
        if (!userId) return;
        try {
            await deleteDoc(doc(db, `users/${userId}/purchases`, purchaseId));
            showToast("Registro eliminado del historial", 'info');
        } catch (e) {
            showToast("Error eliminando registro", 'error');
        }
    };

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
                queryClient.invalidateQueries({ queryKey: ['ingredients'] });
                if (selectedIngredients.includes(ing.id)) handleSelectIngredient(ing.id);
                if (selectedIngredientId === ing.id) setSelectedIngredientId(null);
                showToast("Ingrediente eliminado con éxito.", 'success');
            } catch (error) {
                console.error("Error eliminando ingrediente:", error);
                showToast("Error al eliminar el ingrediente.", 'error');
            }
        }
    };

    const handleDeleteSelectedIngredients = async () => {
        if (window.confirm(`¿Seguro que quieres eliminar ${selectedIngredients.length} ingredientes?`)) {
            try {
                const batch = writeBatch(db);
                selectedIngredients.forEach(id => batch.delete(doc(db, ingredientsColPath, id)));
                await batch.commit();
                queryClient.invalidateQueries({ queryKey: ['ingredients'] });
                setSelectedIngredients([]);
                setSelectedIngredientId(null);
                showToast(`${selectedIngredients.length} ingredientes eliminados.`, 'success');
            } catch (error) {
                console.error("Error eliminando ingredientes:", error);
                showToast("Error al eliminar los ingredientes seleccionados.", 'error');
            }
        }
    };

    const [selectedRecipes, setSelectedRecipes] = React.useState<string[]>([]);
    const handleDeleteSelectedRecipes = async () => {
        if (window.confirm(`¿Seguro que quieres eliminar ${selectedRecipes.length} recetas?`)) {
            try {
                const batch = writeBatch(db);
                selectedRecipes.forEach(id => batch.delete(doc(db, `users/${userId}/grimorio`, id)));
                await batch.commit();
                queryClient.invalidateQueries({ queryKey: ['recipes'] });
                setSelectedRecipes([]);
                setSelectedRecipeId(null);
                showToast(`${selectedRecipes.length} recetas eliminadas.`, 'success');
            } catch (error) {
                console.error("Error deleting recipes:", error);
                showToast("Error al eliminar las recetas seleccionadas.", 'error');
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
            if (newRecipes.length === 0) {
                showToast("No se encontraron recetas válidas.", 'error');
                return;
            }
            const batch = writeBatch(db);
            const recipesCollection = collection(db, `users/${userId}/grimorio`);
            newRecipes.forEach(recipe => batch.set(doc(recipesCollection), recipe));
            await batch.commit();
            queryClient.invalidateQueries({ queryKey: ['recipes'] });
            showToast(`${newRecipes.length} recetas importadas.`, 'success');
        } catch (error) {
            console.error(error);
            showToast("Error importando TXT.", 'error');
        } finally {
            setLoading(false);
            setShowTxtImportModal(false);
        }
    };

    const handlePdfImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !db || !userId || !storage) return;
        setLoading(true);
        try {
            const newRecipes = await importPdfRecipes(file, db, storage, userId, allIngredients, useOcr);
            if (newRecipes.length === 0) {
                showToast("No se encontraron recetas.", 'error');
                return;
            }
            const batch = writeBatch(db);
            const recipesCollection = collection(db, `users/${userId}/grimorio`);
            newRecipes.forEach(recipe => batch.set(doc(recipesCollection), recipe));
            await batch.commit();
            queryClient.invalidateQueries({ queryKey: ['recipes'] });
            showToast(`${newRecipes.length} recetas importadas.`, 'success');
        } catch (error) {
            console.error(error);
            showToast("Error importando PDF.", 'error');
        } finally {
            setLoading(false);
            setShowPdfImportModal(false);
        }
    };

    const [csvSupplierId, setCsvSupplierId] = React.useState<string>("");
    const { suppliers } = useSuppliers({ db, userId });

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
                    const ingredientRef = doc(db, ingredientsColPath, existingIngredient.id);
                    const updates: any = {};
                    let needsUpdate = false;
                    if (csvSupplierId && !existingIngredient.proveedores?.includes(csvSupplierId)) {
                        const currentSuppliers = existingIngredient.proveedores || [];
                        updates.proveedores = [...currentSuppliers, csvSupplierId];
                        needsUpdate = true;
                    }
                    if (csvSupplierId) {
                        const currentSupplierData = existingIngredient.supplierData || {};
                        updates.supplierData = { ...currentSupplierData, [csvSupplierId]: { price: price, unit: unit, lastUpdated: serverTimestamp() } };
                        if (!existingIngredient.precioCompra || existingIngredient.precioCompra === 0) updates.precioCompra = price;
                        needsUpdate = true;
                    }
                    if (needsUpdate) {
                        batch.update(ingredientRef, updates);
                        updatedCount++;
                    }
                } else {
                    const newDocRef = doc(collection(db, ingredientsColPath));
                    const dataToSave: any = {
                        nombre: name, categoria: category, precioCompra: price, unidadCompra: unit, proveedores: csvSupplierId ? [csvSupplierId] : [],
                        supplierData: csvSupplierId ? { [csvSupplierId]: { price: price, unit: unit, lastUpdated: serverTimestamp() } } : {}
                    };
                    batch.set(newDocRef, dataToSave);
                    count++;
                }
            }
            await batch.commit();
            queryClient.invalidateQueries({ queryKey: ['ingredients'] });
            showToast(`Importación completada: ${count} nuevos, ${updatedCount} actualizados.`, 'success');
            setLoading(false);
            setShowCsvImportModal(false);
            setCsvSupplierId("");
        };
        reader.readAsText(file);
    };



    // --- Memos ---
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

    const filteredRecipes = hookFilteredRecipes;
    const selectedRecipe = React.useMemo(() => allRecipes.find(r => r.id === selectedRecipeId) || null, [allRecipes, selectedRecipeId]);
    const selectedIngredient = React.useMemo(() => allIngredients.find(i => i.id === selectedIngredientId) || null, [allIngredients, selectedIngredientId]);
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

        // Phase 2.1.A - Real Cost Calculation
        let realCostTotal = 0;
        let missingIngredientsCount = 0;

        if (selectedEscandalloRecipe.ingredientes) {
            selectedEscandalloRecipe.ingredientes.forEach((recipeIng: any) => {
                // Find stock ingredient
                // Find stock ingredient
                const stockIng = allIngredients.find(i => i.id === recipeIng.id || i.nombre === recipeIng.nombre) as any;
                // Use averagePrice or lastPrice. If 0 or undefined, it's missing data.
                const price = stockIng?.averagePrice || stockIng?.lastPrice || 0;

                if (price > 0) {
                    realCostTotal += (recipeIng.cantidad || 0) * price;
                } else {
                    missingIngredientsCount++;
                }
            });
        }
        // If we have no stock data for ANY ingredient, realCost might be 0, but technically it's "unknown" if ingredients exist.
        // Let's set realCost to null if we have missing ingredients and total is 0 to distinguish "free" from "unknown".
        const realCostFinal = (realCostTotal === 0 && missingIngredientsCount > 0) ? null : realCostTotal;

        return {
            report: { costo, precioVenta, baseImponible, ivaSoportado, margenBruto, rentabilidad },
            pie: [{ name: 'Costo', value: costo }, { name: 'Margen', value: margenBruto }, { name: 'IVA', value: ivaSoportado }],
            signals: { realCost: realCostFinal, missingCount: missingIngredientsCount }
        };
    }, [selectedEscandalloRecipe, precioVenta, allIngredients]);

    const handleSaveToHistory = async (reportData: any) => {
        if (!selectedEscandalloRecipe) return;
        const { baseImponible, ...dataToSave } = reportData;
        await addDoc(collection(db, escandallosColPath), {
            recipeId: selectedEscandalloRecipe.id, recipeName: selectedEscandalloRecipe.nombre, ...dataToSave, createdAt: serverTimestamp()
        });
        showToast('Escandallo guardado en el historial.', 'success');
    };

    const handleLoadHistory = (item: any) => {
        const recipe = allRecipes.find(r => r.id === item.recipeId) || null;
        if (recipe) {
            setSelectedEscandalloRecipe(recipe);
            setPrecioVenta(item.precioVenta);
            // setLayer('cost'); // Optional: could auto-switch
        }
    };

    const handleSaveBatchToPizarron = async () => {
        if (!batchResult) return;
        const { meta } = batchResult;
        await addDoc(collection(db, `artifacts/${appId}/public/data/pizarron-tasks`), {
            content: `[Batch] Producir ${meta.targetQuantity} ${meta.targetUnit} de ${meta.recipeName}. Dilución: ${meta.includeDilution ? 'Sí' : 'No'}`,
            status: 'Ideas', category: 'Desarrollo', createdAt: serverTimestamp(), boardId: 'general'
        });
        showToast("Tarea de batch guardada en el Pizarrón.", 'success');
    };

    // --- Zero Waste State ---
    const [zwSelectedIngredients, setZwSelectedIngredients] = React.useState<string[]>([]);
    const [zwRawIngredients, setZwRawIngredients] = React.useState("");
    const [zwLoading, setZwLoading] = React.useState(false);
    const [zwError, setZwError] = React.useState<string | null>(null);
    const [zwRecipeResults, setZwRecipeResults] = React.useState<ZeroWasteResult[]>([]);
    const [zwHistory, setZwHistory] = React.useState<ZeroWasteResult[]>([]);

    const handleZwIngredientToggle = (ingredientName: string) => {
        setZwSelectedIngredients(prev => prev.includes(ingredientName) ? prev.filter(name => name !== ingredientName) : [...prev, ingredientName]);
    };

    const handleSendToZeroWaste = (ing: Ingredient) => {
        setZwSelectedIngredients(prev => prev.includes(ing.nombre) ? prev : [...prev, ing.nombre]);
        setLayer('optimization');
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
                    properties: { nombre: { type: Type.STRING }, ingredientes: { type: Type.STRING }, preparacion: { type: Type.STRING }, },
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
        setLayer('optimization');
    };

    // Calculate colors
    const currentGradient = activeLayer === 'optimization' ? 'lime' :
        activeLayer === 'cost' ? 'red' :
            viewMode === 'stock' ? 'ice' :
                viewMode === 'recipes' ? 'indigo' : 'emerald'; // Market

    // --- RECIPE IMPORT HANDLERS ---
    const handleRecipeCsvImport = async (file: File) => {
        if (!db || !userId) return;
        setLoading(true);
        try {
            const text = await file.text();

            // 1. Parse
            const { recipes, newIngredients } = parseCsvRecipes(text, allIngredients);

            if (recipes.length === 0) {
                showToast("No se encontraron recetas válidas en el CSV.", 'error');
                return;
            }

            const batch = writeBatch(db);

            // 2. Create Missing Ingredients
            const createdIngredientIds = new Map<string, string>(); // name -> id

            if (newIngredients.length > 0) {
                for (const name of newIngredients) {
                    const newDocRef = doc(collection(db, ingredientsColPath));
                    batch.set(newDocRef, {
                        nombre: name,
                        categoria: 'Importado',
                        precioCompra: 0,
                        unidadCompra: 'und',
                        stockActual: 0,
                        proveedores: []
                    });
                    createdIngredientIds.set(name.toLowerCase(), newDocRef.id);
                }
            }

            // 3. Create Recipes (linking to existing or new ingredients)
            const recipesCollection = collection(db, `users/${userId}/grimorio`);

            recipes.forEach(recipe => {
                const newRecipeRef = doc(recipesCollection);

                // Fix ingredient IDs for newly created ones
                const fixedIngredients = recipe.ingredientes?.map(line => {
                    if (!line.ingredientId && line.nombre) {
                        const newId = createdIngredientIds.get(line.nombre.toLowerCase());
                        if (newId) return { ...line, ingredientId: newId };
                    }
                    return line;
                });

                batch.set(newRecipeRef, {
                    ...recipe,
                    ingredientes: fixedIngredients,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                });
            });

            await batch.commit();
            queryClient.invalidateQueries({ queryKey: ['recipes'] });
            queryClient.invalidateQueries({ queryKey: ['ingredients'] });

            showToast(`Importación exitosa: ${recipes.length} recetas, ${newIngredients.length} ingredientes nuevos.`, 'success');

        } catch (error) {
            console.error("Error CSV Import:", error);
            showToast("Error al importar el archivo CSV.", 'error');
        } finally {
            setLoading(false);
            setShowImportChoiceModal(false);
        }
    };

    const handleRecipePdfImportDirect = (file: File) => {
        if (!db || !userId || !storage) return;
        setLoading(true);
        importPdfRecipes(file, db, storage, userId, allIngredients, useOcr)
            .then(async (newRecipes) => {
                if (newRecipes.length === 0) {
                    showToast("No se encontraron recetas.", 'error');
                    return;
                }
                const batch = writeBatch(db);
                const recipesCollection = collection(db, `users/${userId}/grimorio`);
                newRecipes.forEach(recipe => batch.set(doc(recipesCollection), recipe));
                await batch.commit();
                queryClient.invalidateQueries({ queryKey: ['recipes'] });
                showToast(`${newRecipes.length} recetas importadas.`, 'success');
            })
            .catch(err => {
                console.error(err);
                showToast("Error importando PDF.", 'error');
            })
            .finally(() => {
                setLoading(false);
                setShowImportChoiceModal(false);
            });
    };

    const handleConfigureBatch = (amount: number, unit: 'Litros' | 'Botellas') => {
        setBatchTargetQty(amount.toString());
        setBatchTargetUnit(unit);
        setEscandallatorSubTab('production');
    };

    // --- Stable Callbacks for RecipeList Optimization ---
    const handleSelectRecipeCard = React.useCallback((r: Recipe) => {
        setSelectedRecipeId(r.id);
    }, []);

    const handleAddRecipeClick = React.useCallback(() => {
        onOpenRecipeModal(null);
    }, [onOpenRecipeModal]);

    const handleDragStartWrapper = React.useCallback((e: React.DragEvent, r: Recipe) => {
        if (onDragRecipeStart) onDragRecipeStart(r);
    }, [onDragRecipeStart]);

    const handleToggleRecipeSelection = React.useCallback((id: string) => {
        setSelectedRecipes(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]);
    }, []);

    const handleSelectAllRecipes = React.useCallback((select: boolean) => {
        // Note: filteredRecipes is a dependency, so this will change if list changes. 
        // But for simply toggling one card, this callback changing doesn't affect individual card re-render 
        // if we didn't pass it to the card. (We don't, we pass onSelectAll to List, not Card).
        // However, onToggleSelection IS passed to Card.
        setSelectedRecipes(select ? filteredRecipes.map(r => r.id) : []);
    }, [filteredRecipes]);


    return (
        <PremiumLayout
            id="grimorium-section"
            gradientTheme={currentGradient}
            transparentColumns={true}
            className="lg:!grid-cols-[minmax(150px,300px),minmax(600px,1fr),400px] gap-px"
            header={<GrimoriumToolbar />}
            leftSidebar={
                <>
                    {/* STANDARD SIDEBAR for Recipes */}
                    {viewMode === 'recipes' && (
                        <FiltersSidebar
                            activeTab="recipes"
                            allRecipes={allRecipes}
                            selectedRecipe={selectedRecipe}
                            allIngredients={allIngredients}
                            selectedIngredient={selectedIngredient}
                            onImportRecipes={() => setShowTxtImportModal(true)}
                            onImportPdf={() => setShowPdfImportModal(true)}
                            onOpenIngredients={() => { /* Handled by sidebar logic */ }}
                            onImportIngredients={() => setShowCsvImportModal(true)}
                            stats={stats}
                            ingredientSearchTerm=""
                            onIngredientSearchChange={() => { }}
                            ingredientFilters={{}}
                            onIngredientFilterChange={() => { }}
                            onOpenSuppliers={() => setShowSuppliersModal(true)}
                        />
                    )}

                    {/* MARKET SIDEBAR */}
                    {viewMode === 'market' && (
                        <MarketSidebar
                            allIngredients={allIngredients}
                            selectedIngredient={selectedIngredient}
                        />
                    )}

                    {/* ESCANDALLATOR SIDEBAR (Overlay or appended if strictly needed, but usually replaces filtered one when Cost is active) */}
                    {viewMode !== 'stock' && activeLayer === 'cost' && (
                        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                            <EscandallatorSidebar
                                db={db}
                                escandallosColPath={escandallosColPath}
                                onLoadHistory={handleLoadHistory}
                                onNewEscandallo={() => { setSelectedEscandalloRecipe(null); setPrecioVenta(0); }}
                                onConfigureBatch={handleConfigureBatch}
                                activeSubTab={escandallatorSubTab}
                            />
                        </div>
                    )}

                    {/* STOCK MODE SPLIT SIDEBAR (50/50) */}
                    {viewMode === 'stock' && (
                        <div className="h-full flex flex-col gap-4 p-4">
                            {/* TOP HALF: PROVEEDORES (Floating, Invisible Container) */}
                            <div className="flex-1 flex flex-col min-h-0 relative">
                                <div className="mb-2 pl-2">
                                    <h3 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                                        <Icon svg={ICONS.user} className="w-3 h-3 text-emerald-500" />
                                        Proveedores
                                    </h3>
                                    {/* Action Button moved here, horizontal style */}
                                    <button
                                        onClick={() => setShowSuppliersModal(true)}
                                        className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-white/40 dark:bg-slate-800/40 hover:bg-emerald-500 hover:text-white dark:hover:bg-emerald-600 text-slate-600 dark:text-slate-300 rounded-xl backdrop-blur-sm transition-all text-xs font-bold border border-white/20 dark:border-white/5 shadow-sm group"
                                    >
                                        <Icon svg={ICONS.plus} className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                                        <span>Nuevo Proveedor</span>
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto custom-scrollbar py-2 pr-1">
                                    <SuppliersList db={db} userId={userId} onSelect={() => setShowSuppliersModal(true)} />
                                </div>
                            </div>

                            {/* DIVIDER with gradient fading */}
                            <div className="h-px bg-gradient-to-r from-transparent via-slate-300/30 dark:via-slate-600/30 to-transparent shrink-0" />

                            {/* BOTTOM HALF: REGLAS DE STOCK (Floating, Full Scroll) */}
                            <div className="flex-1 flex flex-col min-h-0 relative">
                                <div className="mb-2 pl-2 shrink-0">
                                    <h3 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <Icon svg={ICONS.alertCircle} className="w-3 h-3 text-amber-500" />
                                        Alertas & Reglas
                                    </h3>
                                </div>
                                <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 pb-2">
                                    {activeLayer === 'composition' && (
                                        <StockRulesPanel
                                            allIngredients={allIngredients}
                                            stockItems={calculatedStockItems}
                                            rules={stockRules}
                                            onSaveRule={(rule) => setStockRules(prev => [...prev, rule])}
                                            onDeleteRule={(id) => setStockRules(prev => prev.filter(r => r.id !== id))}
                                            onUpdateRules={setStockRules}
                                            onQuickBuy={startPurchase}
                                            onBulkOrder={(ingredients) => {
                                                setBulkPurchaseTargets(ingredients);
                                                setIsBulkPurchaseModalOpen(true);
                                            }}
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeLayer === 'optimization' && (
                        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                            <ZeroWasteHistorySidebar history={zwHistory} onSelect={handleZwHistorySelect} />
                        </div>
                    )}
                </>
            }
            mainContent={
                <div className="h-full flex flex-col bg-transparent p-0">
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {/* COST LAYER (Takes precedence if active) - REVERTED: Now in Right Sidebar */}

                        {/* RECIPES VIEW */}
                        {viewMode === 'recipes' && (
                            <RecipeList
                                recipes={filteredRecipes}
                                isLoading={recipesLoading}
                                selectedRecipeId={selectedRecipeId}
                                onSelectRecipe={handleSelectRecipeCard}
                                onAddRecipe={handleAddRecipeClick}
                                onDragStart={onDragRecipeStart ? handleDragStartWrapper : undefined}
                                searchTerm={searchQuery}
                                onSearchChange={setSearchQuery}
                                selectedCategory={selectedCategory}
                                onCategoryChange={(cat) => setSelectedCategory(cat)}
                                availableCategories={['Coctel', 'Mocktail', 'Preparacion', 'Otro', ...new Set(allRecipes.flatMap(r => r.categorias || []))]}
                                selectedStatus={selectedStatus}
                                onStatusChange={(stat) => setSelectedStatus(stat)}
                                onDelete={() => selectedRecipeId && handleDeleteRecipe(selectedRecipeId)}
                                selectedRecipeIds={selectedRecipes}
                                onToggleSelection={handleToggleRecipeSelection}
                                onSelectAll={handleSelectAllRecipes}
                                onDeleteSelected={handleDeleteSelectedRecipes}
                                onImport={() => setShowImportChoiceModal(true)}
                            />
                        )}

                        {/* MARKET VIEW (formerly Ingredients) */}
                        {viewMode === 'market' && (
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
                                disableStockAlerts={true}
                            />
                        )}

                        {/* STOCK VIEW (Promoted to Main View) */}
                        {viewMode === 'stock' && (
                            <StockInventoryPanel
                                stockItems={calculatedStockItems}
                                purchases={purchaseHistory}
                                allIngredients={allIngredients}
                                onSelectIngredient={(ingredientId) => {
                                    const stockItem = calculatedStockItems.find(i => i.ingredientId === ingredientId);
                                    const ingredient = allIngredients.find(i => i.id === ingredientId);
                                    if (ingredient) {
                                        const enrichedIngredient = { ...ingredient, stockActual: stockItem ? stockItem.quantityAvailable : 0, cantidadComprada: stockItem ? stockItem.lastPurchaseQuantity || 0 : 0 };
                                        setEditingIngredient(enrichedIngredient);
                                        setShowIngredientModal(true);
                                    }
                                }}
                            />
                        )}

                    </div>
                </div>
            }
            rightSidebar={
                <LayerPanel
                    renderCompositionLayer={() => (
                        <>
                            {/* RECIPES DETAIL */}
                            {viewMode === 'recipes' && selectedRecipe && (
                                <RecipeDetailPanel
                                    recipe={selectedRecipe}
                                    allIngredients={allIngredients}
                                    onEdit={(r) => onOpenRecipeModal(r)}
                                    // ...
                                    onDelete={(r) => handleDeleteRecipe(r.id)}
                                    onDuplicate={handleDuplicateRecipe}
                                    onToolToggle={setIsToolOpen}
                                    onNavigate={(view, data) => setCurrentView(view)}
                                    onClose={() => setSelectedRecipeId(null)}
                                    onEscandallo={() => { setSelectedEscandalloRecipe(selectedRecipe); setLayer('cost'); setEscandallatorSubTab('calculator'); }}
                                    onBatcher={() => {
                                        setBatchSelectedRecipeId(selectedRecipe.id);
                                        setLayer('cost');
                                        setEscandallatorSubTab('production');
                                    }}
                                />
                            )}

                            {/* MARKET DETAIL */}
                            {viewMode === 'market' && selectedIngredient && (
                                <IngredientDetailPanel
                                    ingredient={selectedIngredient}
                                    allIngredients={allIngredients}
                                    recipes={allRecipes}
                                    onEdit={(ing) => { setEditingIngredient(ing); setShowIngredientModal(true); }}
                                    onDelete={(ing) => handleDeleteIngredient(ing)}
                                    onClose={() => setSelectedIngredientId(null)}
                                    onBuy={() => startPurchase(selectedIngredient)}
                                />
                            )}

                            {/* STOCK DETAIL */}
                            {viewMode === 'stock' && (
                                <StockOrdersPanel
                                    purchases={purchaseHistory}
                                    orders={orders}
                                    onCreateOrder={() => {
                                        setEditingOrder(null);
                                        setIsReplenishModalOpen(true);
                                    }}
                                    onLaunchOrder={handleLaunchOrder}
                                    onDeleteOrder={deleteOrder}
                                    onDeleteHistoryItem={handleDeletePurchase}
                                    onEditOrder={(order) => {
                                        setEditingOrder(order);
                                        setIsReplenishModalOpen(true);
                                    }}
                                />
                            )}

                            {/* Empty States */}
                            {(!selectedRecipe && viewMode === 'recipes') && (
                                <EmptyState icon={ICONS.book} text="Detalle de Receta" subtext="Selecciona una receta del listado." />
                            )}
                            {(!selectedIngredient && viewMode === 'market') && (
                                <EmptyState icon={ICONS.flask} text="Detalle de Ingrediente" subtext="Selecciona un ingrediente del listado." />
                            )}
                        </>
                    )}
                    renderCostLayer={() => (
                        <div className="h-full bg-white/30 dark:bg-slate-900/30 backdrop-blur-xl rounded-2xl border border-rose-500/20 dark:border-rose-500/20 shadow-premium overflow-hidden flex flex-col relative group">
                            <div className="flex-none p-2 flex justify-end absolute top-2 right-2 z-50">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => toggleLayer('composition')} // Switch back to composition
                                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                >
                                    <Icon svg={ICONS.x} className="w-4 h-4" />
                                </Button>
                            </div>

                            <EscandallatorPanel
                                db={db}
                                appId={appId}
                                allRecipes={allRecipes}
                                activeSubTab={escandallatorSubTab}
                                onSubTabChange={setEscandallatorSubTab}
                                selectedRecipe={selectedEscandalloRecipe || selectedRecipe}
                                precioVenta={precioVenta}
                                onSelectRecipe={setSelectedEscandalloRecipe}
                                onPriceChange={setPrecioVenta}
                                setBatchResult={setBatchResult}
                                batchSelectedRecipeId={batchSelectedRecipeId}
                                batchTargetQty={batchTargetQty}
                                batchTargetUnit={batchTargetUnit}
                                batchIncludeDilution={batchIncludeDilution}
                                onBatchRecipeChange={setBatchSelectedRecipeId}
                                onBatchQuantityChange={setBatchTargetQty}
                                onBatchUnitChange={setBatchTargetUnit}
                                onBatchDilutionChange={setBatchIncludeDilution}
                                stockItems={calculatedStockItems}
                            />
                        </div>
                    )}
                    renderOptimizationLayer={() => (
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
                />
            }
        >
            {/* ... MODALS ... (Same) */}
            <StockReplenishmentModal
                isOpen={isReplenishModalOpen}
                onClose={() => setIsReplenishModalOpen(false)}
                ingredients={allIngredients}
                onConfirm={handleConfirmReplenish}
                suppliers={suppliers}
                initialOrder={editingOrder}
            />

            <PurchaseModal
                isOpen={isPurchaseModalOpen}
                onClose={closePurchaseModal}
                ingredient={purchaseTarget}
                onConfirm={(data) => {
                    if (purchaseTarget) checkAndCreateRule(purchaseTarget.id, purchaseTarget.nombre);
                    confirmPurchase(data);
                }}
                suppliers={suppliers}
            />

            {/* Bulk Purchase Modals - Updated condition logic implicitly by ViewMode */}
            <BulkPurchaseModal
                isOpen={isBulkPurchaseModalOpen && viewMode !== 'stock'}
                onClose={() => setIsBulkPurchaseModalOpen(false)}
                selectedIngredients={bulkPurchaseTargets}
                onConfirm={confirmBulkPurchase}
                suppliers={suppliers}
                theme="emerald"
            />

            <BulkPurchaseModal
                isOpen={isBulkPurchaseModalOpen && viewMode === 'stock'}
                onClose={() => setIsBulkPurchaseModalOpen(false)}
                selectedIngredients={bulkPurchaseTargets}
                onConfirm={confirmBulkPurchase}
                suppliers={suppliers}
                theme="blue"
            />

            {showSuppliersModal && <SuppliersManagerModal isOpen={showSuppliersModal} onClose={() => setShowSuppliersModal(false)} />}

            {showIngredientModal && (
                <IngredientFormModal
                    isOpen={showIngredientModal}
                    onClose={() => setShowIngredientModal(false)}
                    db={db}
                    userId={userId}
                    appId={appId}
                    editingIngredient={editingIngredient}
                    theme={viewMode === 'stock' ? 'blue' : 'emerald'}
                />
            )}

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
                <div className="p-4 border-t border-slate-100 flex justify-end gap-2">
                    <Button variant="ghost" onClick={() => setShowCsvImportModal(false)}>Cancelar</Button>
                    <Button onClick={() => setShowCsvImportModal(false)}>Cerrar</Button>
                </div>
            </Modal>

            <Toast
                message={toast.message}
                type={toast.type}
                isVisible={toast.isVisible}
                onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
            />
            <Modal isOpen={showTxtImportModal} onClose={() => setShowTxtImportModal(false)} title="Importar Recetas TXT"><div className="space-y-4 p-4"><p className="text-sm text-slate-500">Formato Nexus TXT.</p><Input type="file" accept=".txt" onChange={handleTxtImport} /></div></Modal>
            <Modal isOpen={showPdfImportModal} onClose={() => setShowPdfImportModal(false)} title="Importar Recetas PDF PRO"><div className="space-y-4 p-4"><div className="flex items-center gap-2 mb-2"><input type="checkbox" checked={useOcr} onChange={() => setUseOcr(!useOcr)} id="ocr" /><label htmlFor="ocr">Usar OCR</label></div><Input type="file" accept=".pdf" onChange={handlePdfImport} /></div></Modal>

            <ImportRecipeModal
                isOpen={showImportChoiceModal}
                onClose={() => setShowImportChoiceModal(false)}
                onSelectCsv={handleRecipeCsvImport}
                onSelectPdf={handleRecipePdfImportDirect}
            />
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

const GrimoriumView: React.FC<GrimoriumViewProps> = (props) => (
    <GrimoriumShell>
        <GrimoriumInner {...props} />
    </GrimoriumShell>
);

export default GrimoriumView;
