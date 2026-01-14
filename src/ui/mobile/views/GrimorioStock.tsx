import React, { useMemo, useState } from 'react';
import { collection, addDoc, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { useQueryClient } from '@tanstack/react-query';
import { PageName, UserProfile } from '../types';
import { Ingredient } from '../../../types';
import GlassCard from '../components/GlassCard';
import PremiumButton from '../components/PremiumButton';
import { useIngredients } from '../../../hooks/useIngredients';
import { GrimorioHeader } from '../components/GrimorioHeader';
import { useApp } from '../../../context/AppContext';
import { IngredientFormModal } from '../../../components/grimorium/IngredientFormModal';
import { PurchaseModal } from '../../../components/grimorium/PurchaseModal';
import { BulkPurchaseModal } from '../../../components/grimorium/BulkPurchaseModal';
import { useSuppliers } from '../../../features/suppliers/hooks/useSuppliers';
import { usePurchaseIngredient } from '../../../hooks/usePurchaseIngredient';
import { useOrders, Order } from '../../../hooks/useOrders'; // Added import
import { StockReplenishmentModal } from '../../../components/grimorium/StockReplenishmentModal';
import { StockRuleModal } from '../../../components/grimorium/StockRuleModal';
import { StockRule } from '../../../types';

interface Props {
    onNavigate: (page: PageName) => void;
    user?: UserProfile;
}

const GrimorioStock: React.FC<Props> = ({ onNavigate }) => {
    const { db, userId, appId } = useApp();
    const queryClient = useQueryClient();
    const { ingredients, isLoading } = useIngredients();
    const { suppliers } = useSuppliers({ db, userId });
    const { addPurchase, purchaseHistory } = usePurchaseIngredient();
    const { orders: historyOrders, createOrder, updateOrderStatus } = useOrders(); // Added hook


    const [showIngredientModal, setShowIngredientModal] = useState(false);
    const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
    // Orders Sub-tabs
    const [ordersTab, setOrdersTab] = useState<'drafts' | 'history'>('drafts');
    const [activeTab, setActiveTab] = useState<'stock' | 'orders' | 'alerts'>('stock');

    // Shopping Cart (Drafts)
    const [cart, setCart] = useState<Ingredient[]>([]);

    // Purchase Modals
    const [showPurchaseModal, setShowPurchaseModal] = useState(false);
    const [purchasingIngredient, setPurchasingIngredient] = useState<Ingredient | null>(null);
    const [showBulkPurchaseModal, setShowBulkPurchaseModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const [showDebug, setShowDebug] = useState(false); // New Debug Toggle State

    // New Modals State
    const [showReplenishModal, setShowReplenishModal] = useState(false);
    const [showRuleModal, setShowRuleModal] = useState(false);

    const toggleCartItem = (ing: Ingredient) => {
        setCart(prev => {
            const exists = prev.find(i => i.id === ing.id);
            if (exists) return prev.filter(i => i.id !== ing.id);
            return [...prev, ing];
        });
    };

    const handleSmartRestock = () => {
        // @ts-ignore
        const critical = ingredients.filter(i => getStock(i) <= (i.minStock || 0));
        if (critical.length === 0) return;

        setCart(critical);
        setShowBulkPurchaseModal(true);
    };

    const handleReceiveOrder = async (order: any) => {
        if (!db || !userId || !appId) return;

        try {
            // 1. Iterate over items to update stock
            const promises = order.items.map(async (item: any) => {
                if (!item.ingredientId) return;

                const ingredientRef = doc(db, `artifacts/${appId}/users/${userId}/grimorio-ingredients`, item.ingredientId);
                const currentIng = ingredients.find(i => i.id === item.ingredientId);

                if (currentIng) {
                    const newStock = (currentIng.stock || 0) + (item.quantity || 0);
                    await updateDoc(ingredientRef, { stock: newStock });

                    // Optional: If you want to keep 'purchases' collection in sync as a ledger:
                    // await addPurchase({ ...item data ... }) 
                    // For now, we trust 'orders' collection as the new source of truth for history.
                }
            });

            await Promise.all(promises);

            // 2. Mark Order as Completed
            if (order.isLegacy) {
                // Legacy orders live in 'purchases' collection
                const purchaseRef = doc(db, `users/${userId}/purchases`, order.id);
                await updateDoc(purchaseRef, { status: 'completed' });
            } else {
                // New orders live in 'orders' collection
                await updateOrderStatus(order.id, 'completed');
            }

            // Invalidate to refresh UI
            queryClient.invalidateQueries({ queryKey: ['ingredients'] });

            alert(`✅ Stock actualizado exitosamente`);
        } catch (error) {
            console.error("Error receiving order:", error);
            alert("Error al actualizar el stock");
        }
    };

    // Helper to robustly get Stock and Price (Omni-Fetcher)
    const getStock = (ing: any): number => {
        const candidates = [
            ing.stockActual,
            ing.stock,
            ing.cantidad,
            ing.quantity,
            ing.quantityAvailable
        ];

        // 1. Try to find a positive number first (Legacy prioritizer)
        for (let val of candidates) {
            if (val !== undefined && val !== null && val !== '') {
                const asString = String(val).replace(',', '.');
                const num = parseFloat(asString);
                if (!isNaN(num) && num > 0) return num;
            }
        }

        // 2. If no positive found, return the first defined number (likely 0)
        for (let val of candidates) {
            if (val !== undefined && val !== null && val !== '') {
                const asString = String(val).replace(',', '.');
                const num = parseFloat(asString);
                if (!isNaN(num)) return num;
            }
        }

        return 0;
    };

    const getPrice = (ing: any): number => {
        const candidates = [
            ing.precioCompra,
            ing.costo,
            ing.costo,
            ing.price,
            ing.unitPrice,
            ing.lastPrice, // Re-added
            ing.cost,      // Added English variant
            ing.standardPrice,
            ing.averageUnitCost
        ];

        if (ing.supplierData) {
            const first = Object.values(ing.supplierData)[0] as any;
            if (first?.price) candidates.push(first.price);
        }

        // 1. Try to find a positive price
        for (let val of candidates) {
            if (val !== undefined && val !== null && val !== '') {
                const asString = String(val).replace(',', '.');
                const num = parseFloat(asString);
                if (!isNaN(num) && num > 0) return num;
            }
        }

        return 0;
    };

    const stats = useMemo(() => {
        const totalItems = ingredients.length;
        const totalValue = ingredients.reduce((acc, ing) => {
            const qty = getStock(ing);
            const price = getPrice(ing);
            return acc + (qty * price);
        }, 0);

        const lowStock = ingredients.filter(i => getStock(i) <= (i.minStock || 0)).length;
        const itemsWithStock = ingredients.filter(i => getStock(i) > 0).length;

        return { totalItems, totalValue, lowStock, itemsWithStock };
    }, [ingredients]);

    const handleIngredientClick = (ing: Ingredient) => {
        setEditingIngredient(ing);
        setShowIngredientModal(true);
    };

    const handleNewIngredient = () => {
        setEditingIngredient(null);
        setShowIngredientModal(true);
    };

    // Purchase Handlers
    const handleQuickPurchase = (ing: Ingredient) => {
        setPurchasingIngredient(ing);
        setShowPurchaseModal(true);
    };

    const handleBulkPurchase = () => {
        const criticalIngs = ingredients.filter(i => (i.stock || 0) < (i.minStock || 0) * 0.5);
        if (criticalIngs.length === 0) {
            alert('No hay ingredientes críticos para comprar');
            return;
        }
        setShowBulkPurchaseModal(true);
    };

    // Process Cart (Create Orders for all items in Cart)
    const handleProcessCart = () => {
        if (cart.length === 0) return;
        // For now, open BulkPurchaseModal pre-filled with Cart items
        // We'll simulate this by passing only cart items to the modal
        // Note: BulkPurchaseModal traditionally takes 'selectedIngredients'
        // We might need to adjust or just set 'showBulkPurchaseModal' but passing the CART as selection logic
        // But BulkPurchaseModal usually filters ingredients itself.
        // Let's modify BulkPurchaseModal usage below to accept a specific list if needed, OR 
        // Logic: just use the cart as the filter.
        setShowBulkPurchaseModal(true);
    };

    const handleConfirmPurchase = async (data: { quantity: number; totalCost: number; unit: string }) => {
        if (!purchasingIngredient || !db || !userId || !appId) return;
        try {
            // 1. Update Stock Immediately
            const ingredientRef = doc(db, `artifacts/${appId}/users/${userId}/grimorio-ingredients`, purchasingIngredient.id);
            const currentStock = purchasingIngredient.stock || 0;
            const newStock = currentStock + data.quantity;

            await updateDoc(ingredientRef, {
                stock: newStock,
                // Start tracking average cost if needed? For now just stock.
            });

            // 2. Record Purchase as Completed
            await addPurchase({
                ingredientId: purchasingIngredient.id,
                ingredientName: purchasingIngredient.nombre,
                providerId: purchasingIngredient.proveedor || purchasingIngredient.proveedores?.[0] || 'generic_provider',
                providerName: purchasingIngredient.proveedor || purchasingIngredient.proveedores?.[0] || 'Proveedor Desconocido',
                quantity: data.quantity,
                totalCost: data.totalCost,
                unitPrice: purchasingIngredient.costo || 0,
                unit: data.unit,
                status: 'completed' // DIRECTLY COMPLETED
            });

            setShowPurchaseModal(false);
            setPurchasingIngredient(null);

            // Invalidate to refresh UI
            queryClient.invalidateQueries({ queryKey: ['ingredients'] });

            alert('✅ Compra realizada y stock actualizado');
        } catch (error) {
            console.error('Error purchasing:', error);
            alert('Error al registrar la compra');
        }
    };

    const handleConfirmBulkPurchase = async () => {
        if (!db || !userId || !appId) return;
        try {
            // 1. Prepare Batched Stock Updates (Max 500 ops per batch)
            const batch = writeBatch(db);
            let opCount = 0;

            cart.forEach((ing) => {
                const ingredientRef = doc(db, `artifacts/${appId}/users/${userId}/grimorio-ingredients`, ing.id);
                const quantityToBuy = ing.minStock ? Math.max(1, ing.minStock - (ing.stock || 0)) : 1;
                const newStock = (ing.stock || 0) + quantityToBuy;

                batch.update(ingredientRef, { stock: newStock });
                opCount++;
            });

            // Commit Batch (If > 500, we'd need loop, but assumes <500 for now or simple safety limit)
            // For robust 1000+ support, ideally we loop batches.
            // Let's do simple loop commit if needed, but standard limit is high enough for typical usage.
            // If strict 500 limit, we should chunk.

            // Chunked Batch Logic
            const chunks = [];
            for (let i = 0; i < cart.length; i += 500) {
                chunks.push(cart.slice(i, i + 500));
            }

            for (const chunk of chunks) {
                const chunkBatch = writeBatch(db);
                chunk.forEach(ing => {
                    const ingredientRef = doc(db, `artifacts/${appId}/users/${userId}/grimorio-ingredients`, ing.id);
                    const quantityToBuy = ing.minStock ? Math.max(1, ing.minStock - (ing.stock || 0)) : 1;
                    const newStock = (ing.stock || 0) + quantityToBuy;
                    chunkBatch.update(ingredientRef, { stock: newStock });
                });
                await chunkBatch.commit();
            }

            // 3. Create Completed Orders
            const ordersByProvider: Record<string, { providerName: string, items: any[] }> = {};

            cart.forEach(ing => {
                const providerId = ing.proveedor || (ing.proveedores && ing.proveedores[0]) || 'generic_provider';
                const providerName = suppliers.find(s => s.id === providerId)?.name || (providerId !== 'generic_provider' ? providerId : 'Proveedor Desconocido');

                if (!ordersByProvider[providerId]) {
                    ordersByProvider[providerId] = { providerName, items: [] };
                }

                ordersByProvider[providerId].items.push({
                    ingredientId: ing.id,
                    ingredientName: ing.nombre,
                    quantity: ing.minStock ? Math.max(1, ing.minStock - (ing.stock || 0)) : 1,
                    unit: ing.unidad || 'und',
                    estimatedCost: ing.costo || 0
                });
            });

            const orderPromises = Object.values(ordersByProvider).map(async (group) => {
                await createOrder(
                    group.items,
                    `Pedido ${group.providerName} - ${new Date().toLocaleDateString()}`,
                    'completed'
                );
            });

            await Promise.all(orderPromises);

            queryClient.invalidateQueries({ queryKey: ['ingredients'] });

            setShowBulkPurchaseModal(false);
            setCart([]);
            setActiveTab('orders');
            setOrdersTab('history');
            alert(`✅ Stock actualizado y ${Object.keys(ordersByProvider).length} pedidos registrados (Agrupados por Proveedor).`);

        } catch (error) {
            console.error('Error creating order:', error);
            alert('Error al procesar la compra masiva');
        }
    };

    // --- New Desktop-Parity Handlers ---

    const handleConfirmReplenish = async (orderGroups: { providerId: string; providerName: string; items: any[] }[]) => {
        if (!db || !userId) return;
        try {
            const promises = orderGroups.map(async (group) => {
                const orderItems = group.items.map(item => {
                    const ing = ingredients.find(i => i.id === item.ingredientId);
                    return {
                        ingredientId: item.ingredientId,
                        ingredientName: ing?.nombre || 'Unknown',
                        quantity: item.quantity,
                        unit: item.unit,
                        estimatedCost: item.estimatedCost
                    };
                });

                await createOrder(orderItems, `Pedido - ${group.providerName}`, 'draft'); // Defaults to draft in hook usually, but explicit here
            });
            await Promise.all(promises);
            setShowReplenishModal(false);
            alert("Pedidos generados en Borradores");
            setOrdersTab('drafts');
            setActiveTab('orders');
        } catch (error) {
            console.error(error);
            alert("Error creando pedidos");
        }
    };

    const handleSaveRule = async (rule: StockRule) => {
        if (!db || !userId) return;
        try {
            // Persist rule to a collection so it's not lost
            await addDoc(collection(db, `users/${userId}/rules`), rule);
            // Also update local state if we were using it, but for now we trust the modal or firestore subscriptions if any
            setShowRuleModal(false);
            alert("Regla de alerta creada");
            // Optionally invalidate queries if we displayed rules list
        } catch (error) {
            console.error(error);
            alert("Error guardando regla");
        }
    };

    // @ts-ignore
    const criticalItems = ingredients.filter(i => getStock(i) <= (i.minStock || 0));

    return (
        <div className="bg-transparent relative overflow-hidden flex flex-col h-full text-zinc-800 dark:text-zinc-100">

            {/* Shared Grimorio Header */}
            <GrimorioHeader
                activeSection="stock"
                pageTitle="Stock Alert"
            />

            {/* DEBUG TOGGLE */}
            <div className="absolute top-4 right-4 z-50">
                <button
                    onClick={() => setShowDebug(!showDebug)}
                    className={`p-2 rounded-full ${showDebug ? 'bg-red-500 text-white' : 'bg-transparent text-zinc-300'}`}
                >
                    <span className="material-symbols-outlined text-xs">bug_report</span>
                </button>
            </div>

            {/* DASHBOARD METRICS (Desktop Parity) */}
            <div className="px-5 pt-4 pb-2 grid grid-cols-2 gap-3">
                <GlassCard padding="sm" className="bg-emerald-500/10 border-emerald-500/20 flex flex-col items-center justify-center py-4">
                    <span className="text-[10px] uppercase font-bold text-emerald-600/70 tracking-wider mb-1">Valor Inventario</span>
                    <span className="text-xl font-black text-emerald-700">€{stats.totalValue.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                </GlassCard>
                <GlassCard padding="sm" className="bg-indigo-500/10 border-indigo-500/20 flex flex-col items-center justify-center py-4">
                    <span className="text-[10px] uppercase font-bold text-indigo-600/70 tracking-wider mb-1">Catálogo / Stock</span>
                    <div className="flex items-baseline gap-1">
                        <span className="text-xl font-black text-indigo-700">{stats.itemsWithStock}</span>
                        <span className="text-xs font-bold text-indigo-400">/ {stats.totalItems}</span>
                    </div>
                </GlassCard>
            </div>

            {/* Status Pills (Navigation) */}

            {/* DEBUG DIAGNOSTICS PANEL */}
            {showDebug && (
                <div className="px-5 pb-4">
                    <div className="bg-zinc-900 rounded-xl p-3 border border-red-500/50">
                        <h4 className="text-red-400 font-bold text-xs uppercase mb-2 flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">troubleshoot</span>
                            Diagnóstico de Datos
                        </h4>
                        <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-zinc-400">
                            <div className="flex justify-between">
                                <span>Total Ítems:</span>
                                <span className="text-white font-bold">{ingredients.length}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Con Stock {'>'} 0:</span>
                                <span className="text-emerald-400 font-bold">{stats.itemsWithStock}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Con Precio {'>'} 0:</span>
                                <span className="text-blue-400 font-bold">{ingredients.filter(i => getPrice(i) > 0).length}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Con Valor Total {'>'} 0:</span>
                                <span className="text-yellow-400 font-bold">{ingredients.filter(i => getStock(i) * getPrice(i) > 0).length}</span>
                            </div>
                        </div>
                        <div className="mt-2 text-[10px] text-zinc-500 italic border-t border-zinc-800 pt-1">
                            *Si estos números son bajos, faltan datos de Precio o Stock en la base de datos.
                        </div>
                    </div>
                </div>
            )}

            <div className="px-5 pb-4">
                <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
                    <button
                        onClick={() => setActiveTab('stock')}
                        className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all
                            ${activeTab === 'stock'
                                ? 'bg-white text-zinc-900 shadow-sm'
                                : 'bg-white/10 backdrop-blur-md border border-white/20 text-indigo-900/40' // Adjusted color so it's visible on reddish bg if header is red, but likely header is red and body is transparent? 
                            // Actually GrimorioStock bg is transparent, but GrimorioHeader usually sets atmosphere. 
                            // Let's use generic styles or match Recipes: 'bg-white/10 ... text-white/80' if dark, or text-zinc-400 if light.
                            // Recipes used: bg-white/10 ... text-white/80. Assuming dark bg or colorful bg.
                            }`}
                    >
                        Stock
                    </button>
                    <button
                        onClick={() => setActiveTab('orders')}
                        className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all
                            ${activeTab === 'orders'
                                ? 'bg-white text-zinc-900 shadow-sm'
                                : 'bg-white/10 backdrop-blur-md border border-white/20 text-indigo-900/40'
                            }`}
                    >
                        Pedidos
                    </button>
                    <button
                        onClick={() => setActiveTab('alerts')}
                        className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all flex items-center gap-2
                            ${activeTab === 'alerts'
                                ? 'bg-white text-red-600 shadow-sm'
                                : 'bg-white/10 backdrop-blur-md border border-white/20 text-indigo-900/40'
                            }`}
                    >
                        Alertas
                        {stats.lowStock > 0 && (
                            <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[8px] flex items-center justify-center">{stats.lowStock}</span>
                        )}
                    </button>
                </div>
            </div>

            {/* Context-Aware Floating Action Button */}
            <div
                className="fixed bottom-24 left-1/2 -translate-x-1/2 z-20 bg-zinc-900 border border-zinc-700 rounded-full p-4 shadow-xl cursor-pointer hover:scale-105 transition-all active:scale-95 text-white flex items-center justify-center transform"
                onClick={() => {
                    if (activeTab === 'stock') handleNewIngredient();
                    else if (activeTab === 'orders') setShowReplenishModal(true);
                    else if (activeTab === 'alerts') setShowRuleModal(true);
                }}
            >
                <span className="material-symbols-outlined">
                    {activeTab === 'orders' ? 'list_alt_add' : activeTab === 'alerts' ? 'notification_add' : 'add'}
                </span>
            </div>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto custom-scroll px-5 pb-24 space-y-4">

                {/* 1. STOCK LIST TAB */}
                {activeTab === 'stock' && (
                    <div className="space-y-3">
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">search</span>
                            <input
                                type="text"
                                placeholder="Buscar ingrediente..."
                                className="w-full bg-white dark:bg-zinc-800 pl-10 pr-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        {ingredients.filter(i => i.nombre.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 ? (
                            <div className="text-center py-10 opacity-50">
                                <span className="material-symbols-outlined text-4xl">inventory_2</span>
                                <p className="text-sm mt-2">No se encontraron ingredientes</p>
                            </div>
                        ) : (
                            ingredients.filter(i => i.nombre.toLowerCase().includes(searchTerm.toLowerCase())).map(ing => {
                                const currentStock = getStock(ing);
                                const currentPrice = getPrice(ing);

                                return (
                                    <div key={ing.id} onClick={() => handleIngredientClick(ing)} className="bg-white dark:bg-zinc-800 rounded-xl p-3 shadow-sm border border-zinc-100 flex flex-col gap-2 cursor-pointer active:scale-98 transition-transform">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-sm ${ing.categoria === 'Licores' ? 'bg-purple-100 text-purple-600' :
                                                    ing.categoria === 'Frutas' ? 'bg-orange-100 text-orange-600' :
                                                        'bg-zinc-100 text-zinc-500'
                                                    }`}>
                                                    {ing.emoji || '📦'}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{ing.nombre}</h4>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${currentStock > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                                            {currentStock > 0 ? `Stock: ${currentStock}` : 'Sin Stock (0)'}
                                                        </span>
                                                        <span className="text-[10px] text-zinc-400">
                                                            {ing.categoria || 'General'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="text-right">

                                                {currentPrice * currentStock > 0 ? (
                                                    <span className="text-sm font-black text-emerald-600 block">€{(currentPrice * currentStock).toLocaleString()}</span>
                                                ) : (
                                                    <span className="text-xs font-bold text-red-400 block">⚠️ Sin Valor</span>
                                                )}

                                                {currentPrice > 0 ? (
                                                    <span className="text-[9px] text-zinc-400 block">Unit: €{currentPrice}</span>
                                                ) : (
                                                    <span className="text-[9px] text-red-300 font-bold block">Falta Precio</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* DEBUG INFO */}
                                        {showDebug && (
                                            <div className="mt-2 p-2 bg-zinc-900 rounded text-[10px] font-mono text-emerald-400 overflow-x-auto">
                                                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                                    <span className="text-zinc-500">ID: {ing.id}</span>
                                                    <span className="text-zinc-500">Comp: {(ing as any).cantidadComprada}</span>

                                                    <span className="border-t border-zinc-700 col-span-2 my-1"></span>

                                                    <span>stockActual: <span className="text-white">{(ing as any).stockActual}</span></span>
                                                    <span>stock: <span className="text-white">{ing.stock}</span></span>
                                                    <span>cantidad: <span className="text-white">{(ing as any).cantidad}</span></span>
                                                    <span>quantity: <span className="text-white">{(ing as any).quantity}</span></span>

                                                    <span className="border-t border-zinc-700 col-span-2 my-1"></span>

                                                    <span>precioCompra: <span className="text-white">{ing.precioCompra}</span></span>
                                                    <span>costo: <span className="text-white">{ing.costo}</span></span>
                                                    <span>price: <span className="text-white">{(ing as any).price}</span></span>
                                                    <span>lastPrice: <span className="text-white">{(ing as any).lastPrice}</span></span>
                                                    <span>avgCost: <span className="text-white">{(ing as any).averageUnitCost}</span></span>

                                                    <span className="border-t border-zinc-700 col-span-2 my-1"></span>

                                                    <span className="text-yellow-400 font-bold">RESOLVED STOCK: {currentStock}</span>
                                                    <span className="text-yellow-400 font-bold">RESOLVED PRICE: {currentPrice}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )
                            })
                        )}
                    </div>
                )}

                {/* 2. ORDERS TAB */}
                {activeTab === 'orders' && (
                    <div className="space-y-4">
                        {/* Drafts vs History Sub-tabs */}
                        <div className="flex items-center gap-4 border-b border-zinc-200 dark:border-zinc-700 pb-2 mb-2">
                            <button
                                onClick={() => setOrdersTab('drafts')}
                                className={`text-xs font-bold uppercase tracking-wider pb-1 transition-colors ${ordersTab === 'drafts' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-zinc-400'}`}
                            >Borradores ({cart.length})</button>
                            <button
                                onClick={() => setOrdersTab('history')}
                                className={`text-xs font-bold uppercase tracking-wider pb-1 transition-colors ${ordersTab === 'history' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-zinc-400'}`}
                            >Historial</button>
                        </div>

                        {ordersTab === 'drafts' ? (
                            <div className="space-y-3">
                                {cart.length === 0 ? (
                                    <GlassCard padding="lg" className="border-dashed border-2 border-zinc-300 bg-zinc-50 flex flex-col items-center justify-center py-8">
                                        <span className="material-symbols-outlined text-4xl text-zinc-300 mb-2">shopping_cartoon</span>
                                        <p className="text-sm font-bold text-zinc-400">Carrito vacío</p>
                                        <button
                                            className="mt-3 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg shadow-lg hover:bg-indigo-700"
                                            onClick={() => setActiveTab('alerts')}
                                        >
                                            Ver Alertas
                                        </button>
                                    </GlassCard>
                                ) : (
                                    <>
                                        {/* Cart Items List GROUPED BY PROVIDER */}
                                        {Object.entries(cart.reduce((acc, ing) => {
                                            const providerId = ing.proveedor || (ing.proveedores && ing.proveedores[0]) || 'generic_provider';
                                            const providerName = suppliers.find(s => s.id === providerId)?.name || (providerId !== 'generic_provider' ? providerId : 'Proveedor Desconocido');

                                            if (!acc[providerName]) acc[providerName] = [];
                                            acc[providerName].push(ing);
                                            return acc;
                                        }, {} as Record<string, Ingredient[]>)).map(([providerName, items]) => (
                                            <div key={providerName} className="mb-4">
                                                <div className="flex items-center gap-2 mb-2 px-1">
                                                    <span className="material-symbols-outlined text-zinc-400 text-sm">local_shipping</span>
                                                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">{providerName}</h4>
                                                    <span className="text-[10px] bg-zinc-100 text-zinc-500 px-1.5 rounded-full">{items.length}</span>
                                                </div>
                                                <div className="space-y-2 pl-2 border-l-2 border-zinc-100 dark:border-zinc-800">
                                                    {items.map(ing => (
                                                        <div key={ing.id} className="bg-white dark:bg-zinc-900 rounded-lg p-2 border border-zinc-100 dark:border-zinc-800 shadow-sm flex items-center justify-between">
                                                            <div>
                                                                <h4 className="font-bold text-xs text-zinc-800 dark:text-zinc-200">{ing.nombre}</h4>
                                                                <p className="text-[10px] text-zinc-400">
                                                                    Stock: {ing.stock || 0} → <span className="text-emerald-500 font-bold">New: {(ing.stock || 0) + (ing.minStock ? Math.max(1, ing.minStock - (ing.stock || 0)) : 1)}</span>
                                                                </p>
                                                            </div>
                                                            <button onClick={() => toggleCartItem(ing)} className="text-zinc-300 hover:text-red-400">
                                                                <span className="material-symbols-outlined text-sm">close</span>
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}

                                        {/* Finalize Button */}
                                        <button
                                            onClick={handleProcessCart}
                                            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold uppercase tracking-wider shadow-lg hover:bg-indigo-700 active:scale-95 transition-all mt-4"
                                        >
                                            Tramitar Pedido ({cart.length})
                                        </button>
                                    </>
                                )}
                            </div>
                        ) : (
                            /* History List (Unified) */
                            <div className="space-y-3">
                                {(() => {
                                    // Merge Legacy and New Orders
                                    const legacyOrders = purchaseHistory.map(p => ({
                                        id: p.id,
                                        name: `Compra: ${p.ingredientName}`,
                                        items: [{ ingredientId: p.ingredientId, ingredientName: p.ingredientName, quantity: p.quantity, unit: p.unit }],
                                        totalEstimatedCost: p.totalCost,
                                        status: p.status,
                                        createdAt: p.createdAt,
                                        isLegacy: true
                                    }));

                                    const allOrders = [...historyOrders, ...legacyOrders].sort((a, b) => (b.createdAt?.getTime?.() || 0) - (a.createdAt?.getTime?.() || 0));

                                    if (allOrders.length === 0) {
                                        return (
                                            <div className="text-center py-10 opacity-50">
                                                <p>No hay historial de pedidos</p>
                                            </div>
                                        );
                                    }

                                    return allOrders.map((order) => (
                                        <div key={order.id} className="bg-white dark:bg-zinc-900 rounded-xl p-3 border border-zinc-100 dark:border-zinc-800 shadow-sm mb-3">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex gap-3 items-center">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${order.status === 'completed' ? 'bg-emerald-100 text-emerald-600' : 'bg-zinc-100 text-zinc-500'}`}>
                                                        <span className="material-symbols-outlined text-xl">
                                                            {order.status === 'completed' ? 'check_circle' : 'receipt_long'}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">{order.name || 'Pedido'}</h4>
                                                        <p className="text-[10px] text-zinc-500">
                                                            {order.createdAt?.toLocaleDateString ? order.createdAt.toLocaleDateString() : 'N/A'} • {order.items.length} items
                                                            {/* @ts-ignore */}
                                                            {order.isLegacy && <span className="ml-1 text-[9px] bg-amber-100 text-amber-700 px-1 rounded">LEGACY</span>}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-sm font-black text-zinc-800 dark:text-zinc-200 block">€{(order.totalEstimatedCost || 0).toLocaleString()}</span>
                                                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md uppercase ${order.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                        {order.status === 'draft' ? 'Borrador' : order.status === 'pending' ? 'Pendiente' : 'Completado'}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* ACTION BUTTONS: RE-ORDER vs RECEIVE (Legacy) */}
                                            {order.status === 'completed' ? (
                                                <div className="mt-2 flex gap-2">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            const itemsToAdd = order.items.map(item => ingredients.find(i => i.id === item.ingredientId)).filter(Boolean) as Ingredient[];

                                                            if (itemsToAdd.length > 0) {
                                                                setCart(prev => {
                                                                    const newItems = itemsToAdd.filter(newItem => !prev.find(p => p.id === newItem.id));
                                                                    return [...prev, ...newItems];
                                                                });
                                                                setOrdersTab('drafts');
                                                                alert(`📦 ${itemsToAdd.length} productos añadidos al carrito`);
                                                            } else {
                                                                alert("No se pudieron encontrar los productos originales en el inventario.");
                                                            }
                                                        }}
                                                        className="w-full py-2 bg-indigo-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-indigo-600"
                                                    >
                                                        <span className="material-symbols-outlined text-sm">refresh</span>
                                                        Volver a Pedir
                                                    </button>
                                                </div>
                                            ) : (
                                                // LEGACY / PENDING logic
                                                !(order as any).isLegacy && (
                                                    <div className="mt-2 flex gap-2">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (confirm("¿Confirmar recepción de pedido? Esto añadirá el stock.")) {
                                                                    handleReceiveOrder(order);
                                                                }
                                                            }}
                                                            className="w-full py-2 bg-emerald-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-emerald-600"
                                                        >
                                                            <span className="material-symbols-outlined text-sm">inventory</span>
                                                            Recibir Stock
                                                        </button>
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    ));
                                })()}
                            </div>
                        )}
                    </div>
                )}

                {/* 3. ALERTS TAB */}
                {activeTab === 'alerts' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500">Centro de Alertas</h3>
                        </div>

                        {isLoading ? (
                            <div className="flex justify-center py-10">
                                <span className="material-symbols-outlined animate-spin text-zinc-400">sync</span>
                            </div>
                        ) : criticalItems.length > 0 ? (
                            <div className="grid grid-cols-1 gap-3">
                                {/* Smart Alert Card */}
                                <GlassCard
                                    padding="md"
                                    className="border-l-4 border-l-red-500 bg-white dark:bg-zinc-800 flex flex-col gap-4"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex gap-3">
                                            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shadow-sm">
                                                <span className="material-symbols-outlined text-2xl">published_with_changes</span>
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-lg text-zinc-900 dark:text-zinc-100">Stock Crítico Detectado</h4>
                                                <p className="text-xs text-zinc-500 mt-1">
                                                    {criticalItems.length} productos por debajo del mínimo.
                                                </p>
                                                <div className="flex -space-x-2 mt-2 overflow-hidden py-1">
                                                    {criticalItems.slice(0, 5).map(i => (
                                                        <div key={i.id} className="w-6 h-6 rounded-full bg-zinc-100 border border-white flex items-center justify-center text-[10px]" title={i.nombre}>
                                                            {i.emoji || '📦'}
                                                        </div>
                                                    ))}
                                                    {criticalItems.length > 5 && (
                                                        <div className="w-6 h-6 rounded-full bg-zinc-100 border border-white flex items-center justify-center text-[8px] font-bold text-zinc-500">
                                                            +{criticalItems.length - 5}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-3 border-t border-zinc-100 dark:border-zinc-700">
                                        <button
                                            onClick={handleSmartRestock}
                                            className="w-full py-3 bg-red-600 text-white rounded-xl font-bold uppercase tracking-wider shadow-lg hover:bg-red-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                                        >
                                            <span className="material-symbols-outlined">shopping_cart_checkout</span>
                                            Generar Hoja de Pedido
                                        </button>
                                        <p className="text-[10px] text-center text-zinc-400 mt-2">
                                            Nexus generará automáticamente una orden con las cantidades necesarias.
                                        </p>
                                    </div>
                                </GlassCard>

                                <div className="mt-4">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">Detalle de Alertas</h4>
                                    {criticalItems.map((item) => {
                                        const currentStock = getStock(item);
                                        return (
                                            <div key={item.id} className="flex justify-between items-center py-2 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xl">{item.emoji || '📦'}</span>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{item.nombre}</span>
                                                        <span className="text-[10px] text-red-500 font-bold">Stock: {currentStock} / {item.minStock}</span>
                                                    </div>
                                                </div>
                                                <button className="text-zinc-400 text-xs hover:text-indigo-600" onClick={() => handleIngredientClick(item)}>
                                                    Ver Item
                                                </button>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8 bg-white/50 rounded-2xl border border-zinc-200">
                                <span className="material-symbols-outlined text-4xl text-emerald-500 mb-2">check_circle</span>
                                <p className="text-sm font-bold text-zinc-600">Todo en orden</p>
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* Ingredient Modal */}
            {
                showIngredientModal && db && userId && appId && (
                    <IngredientFormModal
                        isOpen={showIngredientModal}
                        onClose={() => setShowIngredientModal(false)}
                        db={db}
                        userId={userId}
                        appId={appId}
                        editingIngredient={editingIngredient}
                    />
                )
            }

            {/* Purchase Modal */}
            {
                purchasingIngredient && (
                    <PurchaseModal
                        isOpen={showPurchaseModal}
                        onClose={() => {
                            setShowPurchaseModal(false);
                            setPurchasingIngredient(null);
                        }}
                        ingredient={purchasingIngredient}
                        onConfirm={handleConfirmPurchase}
                        suppliers={suppliers}
                    />
                )
            }

            {/* Bulk Purchase Modal */}
            <BulkPurchaseModal
                isOpen={showBulkPurchaseModal}
                onClose={() => setShowBulkPurchaseModal(false)}
                selectedIngredients={cart}
                onConfirm={handleConfirmBulkPurchase}
                suppliers={suppliers}

                theme="emerald"
            />

            {/* Desktop Parity Modals */}
            <StockReplenishmentModal
                isOpen={showReplenishModal}
                onClose={() => setShowReplenishModal(false)}
                ingredients={ingredients}
                suppliers={suppliers}
                onConfirm={handleConfirmReplenish}
            />

            <StockRuleModal
                isOpen={showRuleModal}
                onClose={() => setShowRuleModal(false)}
                allIngredients={ingredients}
                onSaveRule={handleSaveRule}
            />
        </div >
    );
};

export default GrimorioStock;
