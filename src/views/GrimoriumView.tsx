import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, doc, addDoc, deleteDoc, writeBatch, Firestore, serverTimestamp } from 'firebase/firestore';
import { ImportRecipeModal } from '../components/grimorium/ImportRecipeModal';
import { GrimoriumImportModals } from '../components/grimorium/GrimoriumImportModals';
import { useQueryClient } from '@tanstack/react-query';
import { useSuppliers } from '../features/suppliers/hooks/useSuppliers';
import { useOrders, Order } from '../hooks/useOrders';
import { Ingredient, Recipe, ViewName, ZeroWasteResult } from '../types';
// import { parseMultipleRecipes } from '../utils/recipeImporter'; // REMOVED
// import { importPdfRecipes } from '../lib/pdf/importPdfRecipes'; // REMOVED
import { useApp } from '../context/AppContext';
// import { parseEuroNumber } from "../utils/parseEuroNumber"; // REMOVED
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
import { ProduceRecipeModal } from '../components/grimorium/ProduceRecipeModal';
import { FiltersSidebar } from '../components/grimorium/FiltersSidebar';
import { Toast } from '../components/ui/Toast';
import { RecipeList } from '../components/grimorium/RecipeList';
import { RecipeDetailPanel } from '../components/grimorium/RecipeDetailPanel';
import { IngredientListPanel } from '../components/grimorium/IngredientListPanel';
import { IngredientDetailPanel } from '../components/grimorium/IngredientDetailPanel';
import { PremiumLayout } from '../components/layout/PremiumLayout';
import { useDebounce } from '../hooks/useDebounce';
import { useCartas } from '../hooks/useCartas';
import { useAlcanceCarta, fijarAlcanceCarta } from '../hooks/useAlcanceCarta';
import { useActiveMenu } from '../hooks/useActiveMenu';
import { exportToCSV } from '../utils/exportToCSV';
import { Card, CardContent } from '../components/ui/Card';
// import { callGeminiApi } from '../utils/gemini'; // REMOVED: Legacy
// import { Type } from "@google/genai"; // REMOVED: Legacy
import { Alert } from '../components/ui/Alert';
import { Spinner } from '../components/ui/Spinner';
import { usePurchaseIngredient } from '../hooks/usePurchaseIngredient';
import { useStockRules } from '../hooks/useStockRules';

import { buildCurrentStock } from '../utils/stockUtils';
import { resolverMaestro, indicePorId } from '../core/identity/masterProduct';
import { useStockMovements } from '../hooks/useStockMovements';
import { calculateEscandallo } from '../core/finance/cost.engine';
import { useEscandallator } from '../hooks/useEscandallator';
import { useGrimoriumHandlers } from '../hooks/useGrimoriumHandlers';
import { useUIStore } from '../store/uiStore';
import { generateText } from '../services/ai/textService';



// Escandallator Imports
import EscandallatorPanel from '../components/escandallator/EscandallatorPanel';
import EscandallatorSidebar from '../components/escandallator/EscandallatorSidebar';
import EscandalloSummaryCard from '../components/escandallator/EscandalloSummaryCard';
import { StockInventoryPanel } from '../components/escandallator/StockInventoryPanel';
import { StockOrdersPanel } from '../components/escandallator/StockOrdersPanel';
import { StockRulesPanel } from '../components/escandallator/StockRulesPanel';
import { StockItemDetailPanel } from '../components/escandallator/StockItemDetailPanel';
import { HerramientasTabs } from '../components/escandallator/HerramientasTabs';

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
import { resolverProveedorDelPedido, precioUnitarioDeLinea } from '../features/orders/resolverProveedor';


interface GrimoriumViewProps {
    // Props are now consumed via useUIStore to avoid prop drilling
}

const GrimoriumInner: React.FC<GrimoriumViewProps> = () => {
    const { setShowRecipeModal, setDraggingRecipe } = useUIStore();
    
    // Create adapters for the old prop names to minimize logic changes
    const onOpenRecipeModal = (recipe: Partial<Recipe> | null) => setShowRecipeModal(true, recipe);
    const onDragRecipeStart = (recipe: Recipe) => setDraggingRecipe(recipe);
    const navigate = useNavigate();
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

    // [PERF_BASELINE] Logging (Only in dev if specifically needed)
    React.useEffect(() => {
        if (import.meta.env.DEV) {
            // console.log('[PERF_DEBUG] GrimoriumView MOUNTED');
        }
    }, []);

    React.useEffect(() => {
        if (import.meta.env.DEV && viewMode) {
            // console.log(`[PERF_DEBUG] ViewMode: ${viewMode}`);
        }
    }, [viewMode]);

    // Render tracking - hidden by default
    // if (process.env.NODE_ENV === 'development') { }

    const { storage } = useApp();
    const [loading, setLoading] = React.useState(false);
    // Collapsing header on scroll (Grimorio only) — hysteresis to avoid flicker
    /**
     * LA FRANJA DE GRIMORIO NO SE PLIEGA. Decisión de diseño, 2026-08-11.
     *
     * Existía un pliegue del título al bajar. Se retira: en las tres pestañas,
     * todo lo que va del título a los filtros permanece fijo, y el listado pasa
     * por detrás.
     *
     * El motivo es de uso, no de estética: los controles de Grimorio —pestañas,
     * buscador, filtros— se usan MIENTRAS se mira la lista, no antes. Una
     * cabecera que aparece y desaparece obliga a recuperarla para cada filtro, y
     * convierte cada gesto en dos.
     *
     * Se paga en pantalla, y conviene saberlo: la franja ocupa ~330 px en un
     * móvil. Si algún día estorba, la respuesta es **hacerla más baja**, no
     * volver a esconderla.
     */
    // Las cartas. La migración adopta las entradas de menú anteriores a que la
    // carta existiera como entidad: no borra ni reescribe nada, solo les añade el
    // `cartaId` que les falta, y es idempotente.
    const { cartaActiva, migrarSiHaceFalta } = useCartas();
    React.useEffect(() => { migrarSiHaceFalta(); }, [migrarSiHaceFalta]);

    const [escandallatorSubTab, setEscandallatorSubTab] = React.useState<'calculator' | 'production'>('calculator');


    const {
        searchQuery, setSearchQuery,
        selectedCategory, setSelectedCategory,
        selectedStatus, setSelectedStatus,
        filteredRecipes: hookFilteredRecipes,
        stats,
        handleDeleteRecipe: hookDeleteRecipe,
        handleDuplicateRecipe: hookDuplicateRecipe
    } = useGrimorium({ db: db!, userId: userId!, allRecipes, allIngredients });

    // Create aliases for backward compatibility
    // Alcance de la carta: filtra el listado a lo que está en la carta activa.
    // Se aplica DESPUÉS de los filtros normales, así que buscar y filtrar por
    // categoría sigue funcionando dentro de la carta.
    const soloCarta = useAlcanceCarta();
    const { menu } = useActiveMenu();
    // `menu` ya viene acotado a la carta activa desde el hook.
    const idsEnCarta = React.useMemo(() => new Set(menu.map(m => m.recipeId)), [menu]);

    const filteredRecipes = React.useMemo(
        () => (soloCarta ? hookFilteredRecipes.filter(r => idsEnCarta.has(r.id)) : hookFilteredRecipes),
        [soloCarta, hookFilteredRecipes, idsEnCarta]
    );
    const handleDuplicateRecipe = hookDuplicateRecipe;

    // Zero Waste State (Restored)
    const [zwSelectedIngredients, setZwSelectedIngredients] = React.useState<string[]>([]);
    const [zwRawIngredients, setZwRawIngredients] = React.useState("");
    const [zwLoading, setZwLoading] = React.useState(false);
    const [zwHistory, setZwHistory] = React.useState<ZeroWasteResult[]>([]);
    const [zwResults, setZwResults] = React.useState<ZeroWasteResult[]>([]);

    const handleZwIngredientToggle = (ingredientName: string) => {
        setZwSelectedIngredients(prev =>
            prev.includes(ingredientName) ? prev.filter(n => n !== ingredientName) : [...prev, ingredientName]
        );
    };

    const handleGenerateZeroWasteRecipes = async () => {
        if (!db || !userId) return;
        setZwLoading(true);
        try {
            const promptIngredients = [...zwSelectedIngredients, zwRawIngredients].filter(Boolean).join(', ');
            const systemPrompt = "Eres un chef de I+D 'zero waste' de élite. NO eres un bartender. Tu foco es crear *elaboraciones complejas* (cordiales, siropes, polvos, aceites, shrubs) a partir de desperdicios. Tu respuesta debe ser estrictamente un array JSON.";
            const userQuery = `Usando estos ingredientes: ${promptIngredients}. Genera de 3 a 5 elaboraciones 'zero waste'.`;
            const response = await generateText(userQuery, systemPrompt);
            // Robust parse: strip markdown fences and handle object envelopes
            const cleaned = response.text.replace(/```json/gi, '').replace(/```/g, '').trim();
            let parsed: any = JSON.parse(cleaned);
            if (!Array.isArray(parsed) && parsed && typeof parsed === 'object') {
                const arr = Object.values(parsed).find(v => Array.isArray(v));
                parsed = arr || [];
            }
            const results = parsed as ZeroWasteResult[];
            if (!Array.isArray(results) || results.length === 0) throw new Error('Respuesta IA vacía');
            setZwResults(results);
            setZwHistory(prev => [...results, ...prev]);
        } catch (e) {
            console.error(e);
            showToast('Error generando Zero Waste (¿IA disponible?)', 'error');
        } finally {
            setZwLoading(false);
        }
    };

    const handleZwHistorySelect = (result: ZeroWasteResult) => setZwResults([result]);

    // Gradient theme for Grimorio
    const currentGradient = 'emerald' as const;

    // Grimorium State
    const [ingredientSearch, setIngredientSearch] = React.useState("");
    const [selectedRecipeId, setSelectedRecipeId] = React.useState<string | null>(null);
    const [ingredientFilters, setIngredientFilters] = React.useState({ category: 'all', status: 'all' });
    const [selectedIngredients, setSelectedIngredients] = React.useState<string[]>([]);
    const [selectedIngredientId, setSelectedIngredientId] = React.useState<string | null>(null);
    const [selectedStockItemId, setSelectedStockItemId] = React.useState<string | null>(null); // New state for Stock Selection

    // Filtered ingredients (simple filter by search) - MUST be after ingredientSearch declaration
    const filteredIngredients = React.useMemo(() => {
        if (!ingredientSearch) return allIngredients;
        const search = ingredientSearch.toLowerCase();
        return allIngredients.filter(ing =>
            ing.nombre.toLowerCase().includes(search) ||
            ing.categoria?.toLowerCase().includes(search)
        );
    }, [allIngredients, ingredientSearch]);

    // Compute selected items from IDs
    const selectedRecipe = React.useMemo(() => {
        return selectedRecipeId ? allRecipes.find(r => r.id === selectedRecipeId) || null : null;
    }, [selectedRecipeId, allRecipes]);

    const selectedIngredient = React.useMemo(() => {
        return selectedIngredientId ? allIngredients.find(i => i.id === selectedIngredientId) || null : null;
    }, [selectedIngredientId, allIngredients]);

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
    const [showSuppliersModal, setShowSuppliersModal] = React.useState(false);
    const [isToolOpen, setIsToolOpen] = React.useState(false);

    // --- Escandallator Logic ---
    const {
        selectedRecipe: selectedEscandalloRecipe,
        setSelectedRecipe: setSelectedEscandalloRecipe,
        precioVenta,
        setPrecioVenta,
        escandalloData,
        saveToHistory: saveEscandalloHistory,
        loadFromHistory: loadEscandalloHistory
    } = useEscandallator({ db: db!, userId: userId!, allIngredients });

    const handleSaveToHistory = async (reportData: any) => {
        try {
            await saveEscandalloHistory(reportData);
            showToast('Escandallo guardado en el historial.', 'success');
        } catch (e) {
            console.error(e);
            showToast('Error guardando escandallo.', 'error');
        }
    };

    const handleLoadHistory = (item: any) => {
        loadEscandalloHistory(item, allRecipes);
    };

    // --- Batcher State ---
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
    // Stock = purchases IN − movements OUT (consumption/waste/adjustment).
    // With no movements recorded, applyMovementsToStock returns the purchase-built stock unchanged.
    const { movements: stockMovements, addMovements } = useStockMovements();
    // Consolidación por producto maestro. Hoy es una operación NULA: mientras
    // ningún ingrediente tenga `masterProductId`, `resolverMaestro` devuelve el
    // mismo id que recibe y el resultado es idéntico al de antes.
    const indiceIngredientes = React.useMemo(() => indicePorId(allIngredients || []), [allIngredients]);
    const calculatedStockItems = React.useMemo(() => {
        if (!purchaseHistory) return [];
        return buildCurrentStock(purchaseHistory, stockMovements, id => resolverMaestro(id, indiceIngredientes));
    }, [purchaseHistory, stockMovements, indiceIngredientes]);

    // Record a stock-out movement (consumption / waste / adjustment) in the item's own unit
    const handleRecordStockMovement = React.useCallback(async (
        item: { ingredientId: string; ingredientName: string; unit: string },
        quantity: number,
        type: 'consumption' | 'waste' | 'adjustment',
        reason?: string
    ) => {
        try {
            await addMovements([{
                ingredientId: item.ingredientId,
                ingredientName: item.ingredientName,
                quantity,
                unit: item.unit,
                type,
                origen: 'manual',
                reason,
            }]);
            const label = type === 'waste' ? 'Merma' : type === 'adjustment' ? 'Ajuste' : 'Consumo';
            showToast(`${label} registrado: −${quantity} ${item.unit} de ${item.ingredientName}`, 'success');
        } catch (e) {
            console.error(e);
            showToast('Error registrando el movimiento de stock', 'error');
        }
    }, [addMovements]);

    // Automatic depletion: producing/serving a recipe deducts its ingredients from stock
    const [produceRecipe, setProduceRecipe] = React.useState<Recipe | null>(null);
    const handleProduceConfirm = React.useCallback(async (lines: any[], servings: number) => {
        if (!lines.length) return;
        try {
            await addMovements(lines.map(l => ({
                ingredientId: l.ingredientId,
                ingredientName: l.ingredientName,
                quantity: l.quantity,
                unit: l.unit,
                type: 'consumption' as const,
                origen: 'produccion' as const,
                reason: `Producción: ${produceRecipe?.nombre || 'receta'} ×${servings}`,
                recipeId: produceRecipe?.id,
                recipeName: produceRecipe?.nombre,
            })));
            showToast(`Stock descontado: ${lines.length} ingrediente(s) · ${produceRecipe?.nombre} ×${servings}`, 'success');
        } catch (e) {
            console.error(e);
            showToast('Error descontando el stock', 'error');
        }
    }, [addMovements, produceRecipe]);

    // Physical count (#4): each difference becomes a signed 'adjustment' movement (digital − counted)
    const handlePhysicalCount = React.useCallback(async (
        adjustments: { item: { ingredientId: string; ingredientName: string; unit: string }; counted: number; delta: number }[]
    ) => {
        if (adjustments.length === 0) return;
        try {
            await addMovements(adjustments.map(a => ({
                ingredientId: a.item.ingredientId,
                ingredientName: a.item.ingredientName,
                quantity: a.delta, // signed: >0 removes, <0 adds back
                unit: a.item.unit,
                type: 'adjustment' as const,
                origen: 'conteo' as const,
                reason: 'Conteo físico',
            })));
            showToast(`Conteo aplicado: ${adjustments.length} ajuste(s) de inventario`, 'success');
        } catch (e) {
            console.error(e);
            showToast('Error aplicando el conteo físico', 'error');
        }
    }, [addMovements]);

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

    // Persistent stock rules (Firestore-backed — survive reloads)
    const { rules: stockRules, saveRule: saveStockRule, deleteRule: deleteStockRule, ensureRule } = useStockRules();

    const checkAndCreateRule = (ingredientId: string, ingredientName: string) => {
        if (!stockRules.find(r => r.ingredientId === ingredientId)) {
            ensureRule(ingredientId, ingredientName);
            showToast(`Regla de stock creada para ${ingredientName}`, 'info');
        }
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
                // El proveedor viaja como dato, no solo dentro del nombre.
                await createOrder(orderItems, orderName, 'draft', {
                    id: group.providerId,
                    nombre: group.providerName,
                });
            });
            await Promise.all(promises);
            setIsReplenishModalOpen(false);
            showToast(`${orderGroups.length} Hojas de Pedido creadas en Borradores`, 'success');
        } catch (e) {
            console.error(e);
            showToast("Error creando borrador(es)", 'error');
        }
    };

    // Step 1: send the order to the supplier — no purchases, no stock change yet
    const handleSendOrder = async (order: Order) => {
        try {
            await updateOrderStatus(order.id, 'sent');
            showToast("Pedido enviado al proveedor — pendiente de recibir", 'success');
        } catch (e) {
            console.error(e);
            showToast("Error enviando pedido", 'error');
        }
    };

    // Step 2: mark as received — NOW creates the purchases and updates stock (original launch logic)
    const handleReceiveOrder = async (order: Order) => {
        try {
            const promises = order.items.map(async (item) => {
                const ingredient = allIngredients.find(i => i.id === item.ingredientId);
                if (ingredient) checkAndCreateRule(ingredient.id, ingredient.nombre);

                // Manda el proveedor con el que se hizo el pedido; los pedidos
                // anteriores a M2 se siguen deduciendo como entonces. La regla
                // vive en `resolverProveedorDelPedido`, con sus pruebas.
                const { providerId, providerName } = resolverProveedorDelPedido(order, ingredient, suppliers);

                await addPurchase({
                    ingredientId: item.ingredientId,
                    ingredientName: item.ingredientName,
                    providerId: providerId,
                    providerName: providerName,
                    unit: item.unit,
                    quantity: item.quantity,
                    unitPrice: precioUnitarioDeLinea(item.estimatedCost, item.quantity),
                    totalCost: item.estimatedCost,
                    createdAt: new Date(),
                    status: 'completed'
                });
            });
            await Promise.all(promises);
            await updateOrderStatus(order.id, 'completed');
            showToast("Pedido recibido y stock actualizado", 'success');
        } catch (e) {
            console.error(e);
            showToast("Error recibiendo pedido", 'error');
        }
    };
    const handleDeletePurchase = async (purchaseId: string) => {
        if (!userId || !db) return;
        try {
            await deleteDoc(doc(db, `users/${userId}/purchases`, purchaseId));
            showToast("Registro eliminado del historial", 'info');
        } catch (e) {
            showToast("Error eliminando registro", 'error');
        }
    };

    /**
     * Borrado de una receta.
     *
     * Escribe directamente en `users/{uid}/grimorio` e invalida la caché, que es
     * exactamente lo que hace `handleDeleteSelectedRecipes` —el borrado múltiple,
     * comprobado funcionando— en lugar de delegar en `useGrimorium`.
     *
     * El camino anterior pasaba por `grimoriumService`, que apuntaba a
     * `users/{uid}/recipes`: una colección inexistente. Firestore resuelve un
     * `deleteDoc` sobre un documento que no existe SIN ERROR, así que el diálogo
     * se cerraba, la consola quedaba limpia y la receta seguía ahí. Corregir la
     * ruta del servicio no bastó, de modo que este flujo deja de depender de él.
     *
     * Faltaba además invalidar la consulta: sin eso, aunque el borrado hubiera
     * funcionado, el listado habría seguido mostrando la receta.
     */
    const handleDeleteRecipe = async (recipeId: string) => {
        if (!db || !userId || !recipeId) return;
        if (!window.confirm('¿Seguro que quieres eliminar esta receta?')) return;
        try {
            await deleteDoc(doc(db, `users/${userId}/grimorio`, recipeId));
            queryClient.invalidateQueries({ queryKey: ['recipes'] });
            setSelectedRecipeId(null);
            showToast('Receta eliminada.', 'success');
        } catch (error) {
            console.error('Error al eliminar la receta:', error);
            showToast('No se ha podido eliminar la receta.', 'error');
        }
    };

    // Routes the recipe "Herramientas" actions to the right place: in-Grimorium
    // layers stay here; cross-module tools navigate carrying the recipe context.
    const handleRecipeToolNavigate = (view: string, data?: any) => {
        const recipe: Recipe | undefined = data?.recipe || selectedRecipe || undefined;
        switch (view) {
            case 'escandallator':
            case 'cost':
                if (recipe) setSelectedEscandalloRecipe(recipe);
                setLayer('cost');
                setEscandallatorSubTab('calculator');
                break;
            case 'batcher':
                if (recipe) { setSelectedEscandalloRecipe(recipe); setBatchSelectedRecipeId(recipe.id); }
                setLayer('cost');
                setEscandallatorSubTab('production');
                break;
            case 'zerowaste':
            case 'zeroWaste':
                setLayer('optimization');
                break;
            case 'cerebrity':
            case 'cerebrIty':
            case 'lab': {
                // Stash recipe context so Cerebrity/The Lab can pick it up
                try {
                    if (recipe) sessionStorage.setItem('nexus_recipe_context', JSON.stringify({ id: recipe.id, nombre: recipe.nombre }));
                    sessionStorage.setItem('cerebrity_tab', view === 'lab' ? 'lab' : 'creativity');
                } catch { /* ignore */ }
                navigate('/cerebrity');
                break;
            }
            case 'menu':
                navigate('/make-menu');
                break;
            default:
                break;
        }
    };

    const queryClient = useQueryClient();

    const handleSelectIngredient = (id: string) => {
        setSelectedIngredients(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const handleDeleteIngredient = async (ing: Ingredient) => {
        if (window.confirm(`¿Seguro que quieres eliminar ${ing.nombre}?`)) {
            try {
                await deleteDoc(doc(db!, ingredientsColPath, ing.id));
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

    const [selectedRecipes, setSelectedRecipes] = React.useState<string[]>([]);

    // --- HANDLERS HOOK (Extracted) ---
    const {
        csvSupplierId, setCsvSupplierId, useOcr, setUseOcr,
        handleDeleteSelectedRecipes, handleDeleteSelectedIngredients,
        handleTxtImport, handlePdfImport, handleCsvImport,
        handleRecipeCsvImport, handleRecipePdfImportDirect,
        handleSelectRecipeCard, handleAddRecipeClick, handleDragStartWrapper
    } = useGrimoriumHandlers({
        db: db!, userId: userId!, appId: appId!, storage: storage!, allIngredients, allRecipes,
        selectedRecipes, selectedRecipeId, selectedIngredients,
        queryClient, setSelectedRecipes, setSelectedRecipeId, setSelectedIngredients,
        setLoading, showToast,
        setShowTxtImportModal, setShowPdfImportModal, setShowCsvImportModal, setShowImportChoiceModal,
        onOpenRecipeModal, onDragRecipeStart
    });

    const { suppliers } = useSuppliers({ db: db!, userId: userId! });

    const handleConfigureBatch = (amount: number, unit: 'Litros' | 'Botellas') => {
        setBatchTargetQty(amount.toString());
        setBatchTargetUnit(unit);
        setEscandallatorSubTab('production');
    };

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
            backgroundMode="screen"
            transparentColumns={true}
            gridColsOverride={
                viewMode === 'recipes' ? 'grid-cols-1 lg:grid-cols-[3fr_4.4fr_2.6fr]'
                    // Market needs a wider right column (ingredient detail) and a leaner left one
                    : viewMode === 'market' ? 'grid-cols-1 lg:grid-cols-[2fr_5fr_3fr]'
                        : undefined
            }
            {...{
                // On phones the detail column becomes a sheet that opens on selection
                mobile: viewMode === 'recipes'
                    ? {
                        // Activar una capa abre su panel. Antes no ocurría nada
                        // visible al pulsar Costes o Zero Waste: había que descubrir
                        // la pestaña oculta del borde derecho, y quien no la conocía
                        // concluía que el botón estaba roto.
                        detailOpen: !!selectedRecipe || activeLayer !== 'composition',
                        // Cerrar el panel apaga la capa. Así el aspa de la hoja
                        // significa lo mismo que el de la herramienta y sobra uno.
                        onDetailClose: () => {
                            if (activeLayer !== 'composition') toggleLayer('composition');
                            else setSelectedRecipeId(null);
                        },
                        // El título debe decir lo que hay DENTRO. Con una capa activa
                        // el panel derecho no muestra la receta sino su herramienta, y
                        // leer "Ficha de receta" sobre una calculadora de rentabilidad
                        // desconcierta: parece que la ficha se ha roto.
                        detailTitle: activeLayer === 'cost' ? 'Rentabilidad y producción'
                            : activeLayer === 'optimization' ? 'Zero Waste Lab'
                                : selectedRecipe?.nombre,
                        detailSubtitle: activeLayer === 'cost' ? (selectedRecipe?.nombre || 'Herramientas de coste')
                            : activeLayer === 'optimization' ? 'Aprovechamiento de descartes'
                                : 'Ficha de receta',
                        insightsLabel: 'Análisis',
                        accentClass: 'bg-teal-500',
                        cabeceraFija: true,
                    }
                    : viewMode === 'market'
                        ? {
                            detailOpen: !!selectedIngredient || activeLayer !== 'composition',
                            onDetailClose: () => {
                                if (activeLayer !== 'composition') toggleLayer('composition');
                                else setSelectedIngredientId(null);
                            },
                            detailTitle: selectedIngredient?.nombre,
                            detailSubtitle: 'Detalle de ingrediente',
                            insightsLabel: 'Comparativa',
                            accentClass: 'bg-emerald-500',
                            cabeceraFija: true,
                        }
                        : {
                            detailOpen: !!selectedStockItemId || activeLayer !== 'composition',
                            onDetailClose: () => {
                                if (activeLayer !== 'composition') toggleLayer('composition');
                                else setSelectedStockItemId(null);
                            },
                            insightsLabel: 'Reglas y proveedores',
                            detailLabel: 'Pedidos',
                            accentClass: 'bg-sky-500',
                            cabeceraFija: true,
                        },
            }}
            className=""
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
                            onSelectRecipe={handleSelectRecipeCard}
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
                            onNewSupplier={() => setShowSuppliersModal(true)}
                        />
                    )}

                    {/* ESCANDALLATOR SIDEBAR (Overlay or appended if strictly needed, but usually replaces filtered one when Cost is active) */}
                    {viewMode !== 'stock' && activeLayer === 'cost' && (
                        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                            <EscandallatorSidebar
                                db={db!}
                                escandallosColPath={escandallosColPath}
                                onLoadHistory={handleLoadHistory}
                                onNewEscandallo={() => { setSelectedEscandalloRecipe(null); setPrecioVenta(0); }}
                                onConfigureBatch={handleConfigureBatch}
                                activeSubTab={escandallatorSubTab}
                            />
                        </div>
                    )}

                    {/* STOCK MODE SIDEBAR — Reglas & Alertas (primary) on top, Proveedores below */}
                    {viewMode === 'stock' && (
                        <div className="lg:h-full lg:min-h-0 lg:overflow-hidden flex flex-col gap-4 p-0 lg:p-3">
                            {/* PRIMARY: ALERTAS & REGLAS (~64%) */}
                            <div className="flex-[64] flex flex-col min-h-0 bg-white/55 dark:bg-slate-900/50 rounded-3xl border border-white/40 dark:border-white/5 backdrop-blur-xl shadow-premium overflow-hidden">
                                {/* Unified narrow-first header: icon + title + count chip (no truncating subtitle) */}
                                <div className="flex items-center gap-2.5 px-4 py-3 border-b border-slate-200/50 dark:border-white/5 shrink-0 bg-gradient-to-r from-amber-50/60 to-transparent dark:from-amber-900/10">
                                    <span className="p-1.5 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-sm shadow-amber-500/30 shrink-0">
                                        <Icon svg={ICONS.alertCircle} className="w-3.5 h-3.5" />
                                    </span>
                                    <h3 className="flex-1 min-w-0 text-sm font-black text-slate-700 dark:text-slate-200 tracking-tight truncate">Reglas & Alertas</h3>
                                    {stockRules.length > 0 && (
                                        <span className="shrink-0 min-w-[22px] text-center text-[11px] font-black text-amber-600 dark:text-amber-400 bg-amber-100/80 dark:bg-amber-900/30 px-2 py-0.5 rounded-full tabular-nums">
                                            {stockRules.length}
                                        </span>
                                    )}
                                </div>
                                <div className="lg:flex-1 lg:overflow-y-auto custom-scrollbar lg:min-h-0">
                                    {/* Sin `onUpdateRules` a propósito: reescribía las 611 reglas,
                                        una a una, cada vez que se guardaba o borraba UNA.
                                        `onSaveRule` ya persiste la regla y `onDeleteRule` ya la
                                        borra; el volcado masivo no aportaba nada y costaba 611
                                        escrituras en Firestore por clic. */}
                                    {activeLayer === 'composition' && (
                                        <StockRulesPanel
                                            allIngredients={allIngredients}
                                            stockItems={calculatedStockItems}
                                            rules={stockRules}
                                            onSaveRule={(rule) => saveStockRule(rule)}
                                            onDeleteRule={(id) => deleteStockRule(id)}
                                            onQuickBuy={startPurchase}
                                            onBulkOrder={(ingredients) => {
                                                setBulkPurchaseTargets(ingredients);
                                                setIsBulkPurchaseModalOpen(true);
                                            }}
                                        />
                                    )}
                                </div>
                            </div>

                            {/* SECONDARY: PROVEEDORES (~36%) */}
                            <div className="flex-[36] flex flex-col min-h-0 bg-white/55 dark:bg-slate-900/50 rounded-3xl border border-white/40 dark:border-white/5 backdrop-blur-xl shadow-premium overflow-hidden">
                                {/* Unified narrow-first header */}
                                <div className="flex items-center gap-2.5 px-4 py-3 border-b border-slate-200/50 dark:border-white/5 shrink-0 bg-gradient-to-r from-emerald-50/60 to-transparent dark:from-emerald-900/10">
                                    <span className="p-1.5 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-sm shadow-emerald-500/30 shrink-0">
                                        <Icon svg={ICONS.user} className="w-3.5 h-3.5" />
                                    </span>
                                    <h3 className="flex-1 min-w-0 text-sm font-black text-slate-700 dark:text-slate-200 tracking-tight truncate">Proveedores</h3>
                                    {suppliers.length > 0 && (
                                        <span className="shrink-0 min-w-[22px] text-center text-[11px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-100/80 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full tabular-nums">
                                            {suppliers.length}
                                        </span>
                                    )}
                                </div>
                                {/* Full-width action button (narrow-first) */}
                                <div className="px-3 pt-3 shrink-0">
                                    <button
                                        onClick={() => setShowSuppliersModal(true)}
                                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-all text-xs font-bold shadow-sm shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:-translate-y-0.5 group"
                                    >
                                        <Icon svg={ICONS.plus} className="w-4 h-4 group-hover:rotate-90 transition-transform" />
                                        <span>Nuevo proveedor</span>
                                    </button>
                                </div>
                                <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
                                    <SuppliersList db={db!} userId={userId!} onSelect={() => setShowSuppliersModal(true)} />
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
                <div className="lg:h-full flex flex-col relative p-0 bg-transparent shadow-none border-none">
                    {/* Scroll interno solo en escritorio.
                        En móvil scrollea la página. Este contenedor envuelve las TRES
                        pestañas, así que mientras creaba un scroll propio se convertía
                        en el ancla del `sticky` de todas las barras de filtros; y como
                        su contenido cabe entero, nunca scrollea y el `sticky` no
                        llegaba a activarse. Por eso fallaba también en Inventario, cuyo
                        panel sí estaba bien limitado. */}
                    <div className="lg:flex-1 lg:overflow-y-auto custom-scrollbar">
                        {/* COST LAYER (Takes precedence if active) - REVERTED: Now in Right Sidebar */}

                        {/* RECIPES VIEW */}
                        {viewMode === 'recipes' && activeLayer !== 'optimization' && (
                            <>
                            {/* Filtrar sin avisar se lee como "faltan recetas" — es
                                justo lo que pasó con la capa de Costes. */}
                            {soloCarta && (
                                <div className="flex items-center justify-between gap-3 mb-3 px-3 py-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                                    <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 truncate">
                                        {cartaActiva?.nombre || 'Carta'} · {filteredRecipes.length} de {hookFilteredRecipes.length}
                                    </span>
                                    <button
                                        onClick={() => fijarAlcanceCarta(false)}
                                        className="shrink-0 h-8 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold uppercase tracking-wider"
                                    >
                                        Ver todas
                                    </button>
                                </div>
                            )}
                            <RecipeList
                                recipes={filteredRecipes}
                                isLoading={recipesLoading}
                                selectedRecipeId={selectedRecipeId}
                                onSelectRecipe={handleSelectRecipeCard}
                                onAddRecipe={handleAddRecipeClick}
                                onDragStart={handleDragStartWrapper}
                                searchTerm={searchQuery}
                                onSearchChange={setSearchQuery}
                                selectedCategory={selectedCategory}
                                onCategoryChange={(cat) => setSelectedCategory(cat)}
                                availableCategories={['Coctel', 'Mocktail', 'Preparacion', 'Otro', ...Array.from(new Set(allRecipes.flatMap(r => r.categorias || [])))]}
                                selectedStatus={selectedStatus}
                                onStatusChange={(stat) => setSelectedStatus(stat)}
                                onDelete={() => selectedRecipeId && handleDeleteRecipe(selectedRecipeId)}
                                selectedRecipeIds={selectedRecipes}
                                onToggleSelection={handleToggleRecipeSelection}
                                onSelectAll={handleSelectAllRecipes}
                                onDeleteSelected={handleDeleteSelectedRecipes}
                                onImport={() => setShowImportChoiceModal(true)}
                                allIngredients={allIngredients}
                            />
                            </>
                        )}

                        {/* ZERO WASTE RESULTS VIEW */}
                        {activeLayer === 'optimization' && (
                            zwResults.length > 0 ? (
                                <div className="grid grid-cols-1 gap-6 pb-6 px-4">
                                    {zwResults.map((recipe, index) => (
                                        <ZeroWasteResultCard
                                            key={index}
                                            recipe={recipe}
                                            db={db!}
                                            userId={userId!}
                                            appId={appId!}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                                    <div className="p-4 bg-lime-100 dark:bg-lime-900/20 rounded-full mb-4">
                                        <Icon svg={ICONS.refresh} className="w-10 h-10 text-lime-600 dark:text-lime-400" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200 mb-1">Zero Waste Lab</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">
                                        Selecciona ingredientes y mermas en el panel derecho y genera elaboraciones (cordiales, siropes, polvos) para aprovecharlo todo.
                                    </p>
                                </div>
                            )
                        )}

                        {/* MARKET VIEW (formerly Ingredients) */}
                        {viewMode === 'market' && activeLayer !== 'optimization' && (
                            <IngredientListPanel
                                ingredients={filteredIngredients}
                                selectedIngredientIds={selectedIngredients}
                                viewingIngredientId={selectedIngredientId}
                                onToggleSelection={handleSelectIngredient}
                                onSelectAll={(selected) => setSelectedIngredients(selected ? filteredIngredients.map(i => i.id) : [])}
                                onDeleteSelected={handleDeleteSelectedIngredients}
                                onImportCSV={() => setShowCsvImportModal(true)}
                                onEditIngredient={(ing) => ing && setSelectedIngredientId(ing.id)}
                                onNewIngredient={() => { setEditingIngredient(null); setShowIngredientModal(true); }}
                                ingredientSearchTerm={ingredientSearch}
                                onIngredientSearchChange={setIngredientSearch}
                                ingredientFilters={ingredientFilters}
                                onIngredientFilterChange={(k, v) => setIngredientFilters(prev => ({ ...prev, [k]: v }))}
                                availableCategories={['General', ...Array.from(new Set(allIngredients.map(i => i.categoria || 'General').filter(Boolean)))]}
                                onBuy={startPurchase}
                                onBulkBuy={startBulkPurchase}
                                disableStockAlerts={true}
                            />
                        )}

                        {/* STOCK VIEW (Promoted to Main View) */}
                        {viewMode === 'stock' && activeLayer !== 'optimization' && (
                            <StockInventoryPanel
                                stockItems={calculatedStockItems}
                                purchases={purchaseHistory}
                                allIngredients={allIngredients}
                                onSelectIngredient={(ingredientId) => {
                                    setSelectedStockItemId(ingredientId);
                                }}
                                onRecordMovement={handleRecordStockMovement}
                                onPhysicalCount={handlePhysicalCount}
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
                                    allRecipes={allRecipes}
                                    onProduce={(r) => setProduceRecipe(r)}
                                    // Cierra la ficha antes de abrir el modal: si no, el
                                    // modal aparecía DETRÁS de la hoja de detalle y había
                                    // que cerrarla a mano para llegar a él.
                                    onEdit={(r) => { setSelectedRecipeId(null); onOpenRecipeModal(r); }}
                                    // ...
                                    onDelete={(r) => handleDeleteRecipe(r.id)}
                                    onDuplicate={handleDuplicateRecipe}
                                    onToolToggle={setIsToolOpen}
                                    onNavigate={handleRecipeToolNavigate}
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
                                selectedStockItemId ? (
                                    (() => {
                                        const selectedStockItem = calculatedStockItems.find(i => i.ingredientId === selectedStockItemId);
                                        if (!selectedStockItem) return null;
                                        return (
                                            <div className="h-full bg-white/30 dark:bg-slate-900/30 backdrop-blur-xl rounded-2xl border border-emerald-500/20 shadow-premium overflow-hidden">
                                                <StockItemDetailPanel
                                                    stockItem={selectedStockItem}
                                                    onEdit={() => {
                                                        const ingredient = allIngredients.find(i => i.id === selectedStockItem.ingredientId);
                                                        if (ingredient) {
                                                            const enriched = { ...ingredient, stockActual: selectedStockItem.quantityAvailable, cantidadComprada: selectedStockItem.lastPurchaseQuantity };
                                                            setEditingIngredient(enriched);
                                                            setShowIngredientModal(true);
                                                        }
                                                    }}
                                                    onDelete={() => { /* Logic to delete/zero stock? */ }}
                                                    onClose={() => setSelectedStockItemId(null)}
                                                />
                                            </div>
                                        );
                                    })()
                                ) : (
                                    <StockOrdersPanel
                                        purchases={purchaseHistory}
                                        orders={orders}
                                        onCreateOrder={() => {
                                            setEditingOrder(null);
                                            setIsReplenishModalOpen(true);
                                        }}
                                        onSendOrder={handleSendOrder}
                                        onReceiveOrder={handleReceiveOrder}
                                        onDeleteOrder={deleteOrder}
                                        onDeleteHistoryItem={handleDeletePurchase}
                                        onEditOrder={(order) => {
                                            setEditingOrder(order);
                                            setIsReplenishModalOpen(true);
                                        }}
                                    />
                                )
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
                            {/* En móvil manda el aspa de la hoja, que además apaga la capa: dos aspas
                                juntas no dejaban claro cuál cerraba qué. */}
                            <div className="hidden lg:flex flex-none p-2 justify-end absolute top-2 right-2 z-50">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => toggleLayer('composition')}
                                    aria-label="Cerrar la capa"
                                    title="Cerrar la capa y volver a la ficha"
                                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                >
                                    <Icon svg={ICONS.x} className="w-4 h-4" />
                                </Button>
                            </div>

                            <EscandallatorPanel
                                db={db!}
                                appId={appId!}
                                allRecipes={allRecipes}
                                activeSubTab={escandallatorSubTab}
                                onSubTabChange={setEscandallatorSubTab}
                                onZeroWaste={() => setLayer('optimization')}
                                selectedRecipe={selectedEscandalloRecipe || selectedRecipe}
                                precioVenta={precioVenta}
                                onSelectRecipe={setSelectedEscandalloRecipe}
                                onPriceChange={setPrecioVenta}
                                setBatchResult={setBatchResult}
                                batchResult={batchResult}
                                allIngredients={allIngredients}
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
                        <div className="h-full flex flex-col overflow-hidden">
                            {/* Las mismas pestañas que en la capa de coste: sin ellas, Zero
                                Waste sería un callejón sin salida desde que dejó de tener
                                su propio icono en la barra. */}
                            <HerramientasTabs
                                activa="zerowaste"
                                onSelect={(h) => {
                                    if (h === 'zerowaste') return;
                                    setEscandallatorSubTab(h as 'calculator' | 'production');
                                    setLayer('cost');
                                }}
                            />
                            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
                        <ZeroWasteControls
                            allIngredients={allIngredients}
                            selectedIngredients={zwSelectedIngredients}
                            rawIngredients={zwRawIngredients}
                            loading={zwLoading}
                            onToggleIngredient={handleZwIngredientToggle}
                            onRawIngredientsChange={setZwRawIngredients}
                            onGenerate={handleGenerateZeroWasteRecipes}
                        />
                            </div>
                        </div>
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

            <BulkPurchaseModal
                isOpen={isBulkPurchaseModalOpen}
                onClose={() => setIsBulkPurchaseModalOpen(false)}
                selectedIngredients={bulkPurchaseTargets}
                onConfirm={confirmBulkPurchase}
                suppliers={suppliers}
                theme={viewMode === 'stock' ? 'blue' : 'emerald'}
            />

            {showSuppliersModal && <SuppliersManagerModal isOpen={showSuppliersModal} onClose={() => setShowSuppliersModal(false)} />}

            {produceRecipe && (
                <ProduceRecipeModal
                    recipe={produceRecipe}
                    allIngredients={allIngredients}
                    allRecipes={allRecipes}
                    stockItems={calculatedStockItems}
                    onClose={() => setProduceRecipe(null)}
                    onConfirm={handleProduceConfirm}
                />
            )}

            {showIngredientModal && (
                <IngredientFormModal
                    isOpen={showIngredientModal}
                    onClose={() => setShowIngredientModal(false)}
                    db={db!}
                    userId={userId!}
                    appId={appId!}
                    editingIngredient={editingIngredient}
                    theme={viewMode === 'stock' ? 'blue' : 'emerald'}
                />
            )}

            <GrimoriumImportModals
                showCsvImport={showCsvImportModal}
                onCloseCsv={() => setShowCsvImportModal(false)}
                onCsvImport={handleCsvImport}
                csvSupplierId={csvSupplierId}
                setCsvSupplierId={setCsvSupplierId}
                suppliers={suppliers}
                showTxtImport={showTxtImportModal}
                onCloseTxt={() => setShowTxtImportModal(false)}
                onTxtImport={handleTxtImport}
                showPdfImport={showPdfImportModal}
                onClosePdf={() => setShowPdfImportModal(false)}
                onPdfImport={handlePdfImport}
                useOcr={useOcr}
                setUseOcr={setUseOcr}
            />

            <Toast
                message={toast.message}
                type={toast.type}
                isVisible={toast.isVisible}
                onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
            />

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
