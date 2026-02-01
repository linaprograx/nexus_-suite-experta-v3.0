import * as React from 'react';
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
// import { callGeminiApi } from '../utils/gemini'; // REMOVED: Legacy
// import { Type } from "@google/genai"; // REMOVED: Legacy
import { Alert } from '../components/ui/Alert';
import { Spinner } from '../components/ui/Spinner';
import { usePurchaseIngredient } from '../hooks/usePurchaseIngredient';

import { buildStockFromPurchases } from '../utils/stockUtils';
import { calculateEscandallo } from '../core/finance/cost.engine';
import { useEscandallator } from '../hooks/useEscandallator';
import { useGrimoriumHandlers } from '../hooks/useGrimoriumHandlers';



// Escandallator Imports
import EscandallatorPanel from '../components/escandallator/EscandallatorPanel';
import EscandallatorSidebar from '../components/escandallator/EscandallatorSidebar';
import EscandalloSummaryCard from '../components/escandallator/EscandalloSummaryCard';
import { StockInventoryPanel } from '../components/escandallator/StockInventoryPanel';
import { StockOrdersPanel } from '../components/escandallator/StockOrdersPanel';
import { StockRulesPanel } from '../components/escandallator/StockRulesPanel';
import { StockItemDetailPanel } from '../components/escandallator/StockItemDetailPanel';

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

    // Create aliases for backward compatibility
    const filteredRecipes = hookFilteredRecipes;
    const handleDuplicateRecipe = hookDuplicateRecipe;

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
    } = useEscandallator({ db, userId, allIngredients });

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

    const [selectedRecipes, setSelectedRecipes] = React.useState<string[]>([]);

    // --- HANDLERS HOOK (Extracted) ---
    const {
        csvSupplierId, setCsvSupplierId, useOcr, setUseOcr,
        handleDeleteSelectedRecipes, handleDeleteSelectedIngredients,
        handleTxtImport, handlePdfImport, handleCsvImport,
        handleRecipeCsvImport, handleRecipePdfImportDirect,
        handleSelectRecipeCard, handleAddRecipeClick, handleDragStartWrapper
    } = useGrimoriumHandlers({
        db, userId, appId, storage, allIngredients, allRecipes,
        selectedRecipes, selectedRecipeId, selectedIngredients,
        queryClient, setSelectedRecipes, setSelectedRecipeId, setSelectedIngredients,
        setLoading, showToast,
        setShowTxtImportModal, setShowPdfImportModal, setShowCsvImportModal, setShowImportChoiceModal,
        onOpenRecipeModal, onDragRecipeStart
    });

    const { suppliers } = useSuppliers({ db, userId });

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
                <div className="h-full flex flex-col relative p-0 bg-transparent shadow-none border-none">
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
                                allIngredients={allIngredients}
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
                                    setSelectedStockItemId(ingredientId);
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
                                        onLaunchOrder={handleLaunchOrder}
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
