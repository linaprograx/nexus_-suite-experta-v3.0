import React, { useState } from 'react';
import { deleteDoc, doc } from 'firebase/firestore'; // Import deleteDoc
import { PageName, UserProfile } from '../types';
import { Ingredient } from '../../../types';
import GlassCard from '../components/GlassCard';
import PremiumButton from '../components/PremiumButton';
import { GrimorioHeader } from '../components/GrimorioHeader';
import { useSuppliers } from '../../../features/suppliers/hooks/useSuppliers';
import { useApp } from '../../../context/AppContext';
import { useIngredients } from '../../../hooks/useIngredients';
import { PurchaseModal } from '../../../components/grimorium/PurchaseModal'; // Import PurchaseModal
import { useOrders } from '../../../hooks/useOrders';
import { StockReplenishmentModal } from '../../../components/grimorium/StockReplenishmentModal';
import { Supplier } from '../../../types';

interface Props {
    onNavigate: (page: PageName) => void;
    user?: UserProfile;
}

const GrimorioMarket: React.FC<Props> = ({ onNavigate }) => {
    const { db, userId, appId } = useApp(); // Add appId
    const { suppliers, loading: loadingSuppliers } = useSuppliers({ db, userId });
    const { ingredients, isLoading: loadingIngredients } = useIngredients();
    const { createOrder } = useOrders();
    const [activeCategory, setActiveCategory] = useState<'destacado' | 'productos' | 'proveedores'>('destacado');

    // Selection & Modal State
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [purchasingIngredient, setPurchasingIngredient] = useState<Ingredient | null>(null);
    const [showPurchaseModal, setShowPurchaseModal] = useState(false);
    const [showReplenishModal, setShowReplenishModal] = useState(false);
    const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
    const [supplierSearch, setSupplierSearch] = useState('');

    // Derived Market Products (Ingredients with Suppliers)
    const marketProducts = ingredients.filter(ing => {
        const hasSupplier = (ing.proveedores && ing.proveedores.length > 0) || ing.proveedor;
        if (!hasSupplier) return false;

        if (supplierSearch) {
            const sName = suppliers.find(s => s.id === ing.proveedor)?.name || ing.proveedor || '';
            return sName.toLowerCase().includes(supplierSearch.toLowerCase());
        }
        return true;
    });

    const getPrice = (ing: any): number => {
        const candidates = [
            ing.precioCompra,
            ing.costo,
            ing.costo,
            ing.price,
            ing.unitPrice,
            ing.lastPrice,
            ing.cost,
            ing.standardPrice,
            ing.averageUnitCost
        ];

        if (ing.supplierData) {
            const first = Object.values(ing.supplierData)[0] as any;
            if (first?.price) candidates.push(first.price);
        }

        for (let val of candidates) {
            if (val !== undefined && val !== null && val !== '') {
                const asString = String(val).replace(',', '.');
                const num = parseFloat(asString);
                if (!isNaN(num) && num > 0) return num;
            }
        }
        return 0;
    };

    const handleToggleSelection = (id: string) => {
        const newSelected = new Set(selectedItems);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedItems(newSelected);
        if (newSelected.size === 0) setIsSelectionMode(false);
    };

    const handleLongPress = (id: string) => {
        setIsSelectionMode(true);
        handleToggleSelection(id);
    };

    const handleItemClick = (product: Ingredient) => {
        if (isSelectionMode) {
            handleToggleSelection(product.id);
        } else {
            setPurchasingIngredient(product);
            setShowPurchaseModal(true);
        }
    };

    const handleDeleteSelected = async () => {
        if (!db || !userId || !appId) return;

        if (window.confirm(`¿Eliminar ${selectedItems.size} productos del mercado?`)) {
            try {
                await Promise.all(
                    Array.from(selectedItems).map(id =>
                        deleteDoc(doc(db, `artifacts/${appId}/users/${userId}/grimorio-ingredients`, id))
                    )
                );

                alert('Productos eliminados correctamente');
                setSelectedItems(new Set());
                setIsSelectionMode(false);
            } catch (error) {
                console.error("Error deleting:", error);
                alert("Error al eliminar");
            }
        }
    };

    const handleBulkPurchase = async () => {
        if (!db || !userId || !selectedItems.size) return;

        const selectedProducts = ingredients.filter(i => selectedItems.has(i.id));

        if (window.confirm(`¿Comprar ${selectedProducts.length} productos?`)) {
            try {
                const orderItems = selectedProducts.map(ing => ({
                    ingredientId: ing.id,
                    ingredientName: ing.nombre,
                    quantity: 1,
                    unit: ing.unidad,
                    estimatedCost: getPrice(ing)
                }));

                await createOrder(orderItems, `Compra Mercado ${new Date().toLocaleDateString()}`);

                alert('Pedido realizado con éxito');
                setSelectedItems(new Set());
                setIsSelectionMode(false);
            } catch (e) {
                console.error(e);
                alert('Error al comprar');
            }
        }
    };

    const handleConfirmPurchase = async (data: { quantity: number; totalCost: number; unit: string }) => {
        // Here we just close the modal for now, or implement actual purchase logic if needed similarly to Stock
        // Usually Market purchase adds to pending orders or drafts.
        // For parity with Stock Alerts 'Add to Cart', this could check if we want to add to Cart or buy immediately.
        // Reusing the modal's 'pending' status logic implicitly via whatever PurchaseModal calls? 
        // PurchaseModal usually takes an `onConfirm` prop.
        setShowPurchaseModal(false);
        setPurchasingIngredient(null);
        alert('Pedido realizado (Simulado)');
        // Note: Real implementation would call addPurchase here.
    };

    const handleConfirmReplenish = async (orders: { providerId: string; providerName: string; items: any[] }[]) => {
        try {
            const promises = orders.map(order =>
                createOrder(order.items, `Pedido ${order.providerName} - ${new Date().toLocaleDateString()}`)
            );
            await Promise.all(promises);
            alert('Pedidos generados correctamente');
            setShowReplenishModal(false);
        } catch (error) {
            console.error(error);
            alert('Error al generar pedidos');
        }
    };

    const handleSupplierAction = (supplier: Supplier, action: 'catalog' | 'order') => {
        if (action === 'catalog') {
            setSupplierSearch(supplier.name);
            setActiveCategory('productos');
        } else {
            setSelectedSupplierId(supplier.id);
            setShowReplenishModal(true);
        }
    };

    const CATEGORY_LABELS = {
        destacado: 'Destacado',
        productos: 'Productos', // Now shows ALL market products
        proveedores: 'Proveedores'
    };

    // Mock featured equipment items
    const featuredEquipment = [
        {
            id: 1,
            name: 'Set Premium de Coctelería',
            category: 'equipment',
            price: 89.99,
            rating: 4.8,
            reviews: 234,
            inStock: true,
            specs: ['Acero Inoxidable', 'Capacidad 24oz', 'A Prueba de Fugas'],
        },
        {
            id: 2,
            name: 'Colador Profesional',
            category: 'equipment',
            price: 34.99,
            rating: 4.7,
            reviews: 189,
            inStock: false,
            specs: ['Estilo Hawthorne', 'Resorte Espiral', 'Profesional'],
        },
    ];

    return (
        <div className="bg-transparent relative overflow-hidden flex flex-col h-full">

            {/* Shared Grimorio Header */}
            <GrimorioHeader
                activeSection="market"
                pageTitle={selectedItems.size > 0 ? `${selectedItems.size} Seleccionados` : "Market"}
            />

            {/* Category Pills */}
            <div className="px-5 pb-4">
                <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
                    {(['destacado', 'productos', 'proveedores'] as const).map(category => (
                        <button
                            key={category}
                            onClick={() => setActiveCategory(category)}
                            className={`px-5 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all
                                ${activeCategory === category
                                    ? 'bg-white text-emerald-600 shadow-md'
                                    : 'bg-white/20 backdrop-blur-md border border-white/30 text-white hover:bg-white/30'
                                }`}
                        >
                            {CATEGORY_LABELS[category]}
                        </button>
                    ))}
                </div>
            </div>

            {supplierSearch && (
                <div className="px-5 pb-4 flex justify-between items-center bg-zinc-50 border-y border-zinc-100 py-3 mb-2 animate-in fade-in slide-in-from-top-2">
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Filtrando por Proveedor</span>
                        <span className="text-xs font-black text-zinc-900">{supplierSearch}</span>
                    </div>
                    <button
                        onClick={() => setSupplierSearch('')}
                        className="p-2 rounded-full bg-zinc-200 text-zinc-600 hover:bg-zinc-300 transition-colors flex items-center justify-center"
                    >
                        <span className="material-symbols-outlined !text-sm">close</span>
                    </button>
                </div>
            )}

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto custom-scroll px-5 pb-32 space-y-4">

                {/* PROVEEDORES SECTION */}
                {activeCategory === 'proveedores' && (
                    <>
                        {loadingSuppliers ? (
                            <div className="flex justify-center py-10">
                                <span className="material-symbols-outlined animate-spin text-emerald-500">sync</span>
                            </div>
                        ) : suppliers.length > 0 ? suppliers.map((supplier) => {
                            // Count products from this supplier
                            const supplierProducts = ingredients.filter(ing =>
                                ing.proveedores?.includes(supplier.id) || ing.proveedor === supplier.id
                            );

                            return (
                                <GlassCard
                                    key={supplier.id}
                                    rounded="3xl"
                                    padding="md"
                                    className="relative group transition-all cursor-pointer active:scale-[0.98]"
                                >
                                    <div className="flex gap-4 mb-4">
                                        {/* Supplier Icon */}
                                        <div className="w-20 h-20 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center flex-shrink-0">
                                            <span className="material-symbols-outlined text-3xl text-emerald-600 fill-1">store</span>
                                        </div>

                                        {/* Supplier Info */}
                                        <div className="flex-1">
                                            <h2 className="text-xl font-bold text-zinc-900 mb-1">{supplier.name}</h2>
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[8px] font-black uppercase">
                                                    {supplier.category}
                                                </span>
                                                <span className="text-[10px] text-zinc-500">
                                                    {supplierProducts.length} productos
                                                </span>
                                            </div>
                                            {supplier.contactName && (
                                                <p className="text-xs text-zinc-600 mb-1">
                                                    <span className="material-symbols-outlined !text-xs align-middle mr-1">person</span>
                                                    {supplier.contactName}
                                                </p>
                                            )}
                                            {supplier.phone && (
                                                <p className="text-xs text-zinc-600">
                                                    <span className="material-symbols-outlined !text-xs align-middle mr-1">call</span>
                                                    {supplier.phone}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Type: Details */}
                                    <div className="grid grid-cols-2 gap-2 mb-4">
                                        <div className="bg-zinc-50 px-3 py-2 rounded-xl">
                                            <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Entrega</p>
                                            <p className="text-xs font-black text-zinc-900">{supplier.leadTimeDays || 0} días</p>
                                        </div>
                                        <div className="bg-zinc-50 px-3 py-2 rounded-xl">
                                            <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Pago</p>
                                            <p className="text-xs font-black text-zinc-900">{supplier.paymentTerms || 'Contado'}</p>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleSupplierAction(supplier, 'catalog')}
                                            className="flex-[0.4] py-3.5 rounded-2xl text-[10px] font-black text-zinc-500 bg-zinc-100 border border-zinc-200 uppercase tracking-wider hover:bg-zinc-200 transition-colors"
                                        >
                                            Catálogo
                                        </button>
                                        <PremiumButton
                                            module="grimorioMarket"
                                            variant="gradient"
                                            size="md"
                                            icon={<span className="material-symbols-outlined !text-sm">shopping_bag</span>}
                                            iconPosition="right"
                                            className="flex-1"
                                            onClick={() => handleSupplierAction(supplier, 'order')}
                                        >
                                            HACER PEDIDO
                                        </PremiumButton>
                                    </div>
                                </GlassCard>
                            );
                        }) : (
                            <GlassCard rounded="3xl" padding="xl" className="text-center">
                                <span className="material-symbols-outlined text-6xl text-zinc-300 mb-3 block">store</span>
                                <h3 className="text-lg font-bold text-zinc-900 mb-2">No hay proveedores</h3>
                                <p className="text-sm text-zinc-500 mb-5">Agrega proveedores desde la versión Desktop</p>
                            </GlassCard>
                        )}
                    </>
                )}

                {/* DESTACADO SECTION */}
                {activeCategory === 'destacado' && featuredEquipment.map((item, i) => (
                    <GlassCard
                        key={item.id}
                        rounded="3xl"
                        padding="md"
                        className="relative group transition-all"
                    >
                        {i === 0 && (
                            <div className="absolute top-4 right-4 z-10 bg-emerald-500 text-white px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-wider shadow-lg">
                                Destacado
                            </div>
                        )}

                        <div className="flex gap-4 mb-4">
                            <div className="w-24 h-24 rounded-2xl bg-zinc-100 border border-zinc-200 flex items-center justify-center flex-shrink-0">
                                <span className="material-symbols-outlined text-4xl text-emerald-600 fill-1">liquor</span>
                            </div>

                            <div className="flex-1">
                                <h2 className="text-lg font-bold text-zinc-900 mb-1.5">{item.name}</h2>
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="flex items-center gap-1">
                                        <span className="material-symbols-outlined text-xs text-yellow-500 fill-1">star</span>
                                        <span className="text-xs font-bold text-zinc-700">{item.rating}</span>
                                    </div>
                                    <span className="text-[10px] text-zinc-400">({item.reviews} reseñas)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl font-black text-emerald-600">${item.price}</span>
                                    {item.inStock ? (
                                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[8px] font-black uppercase">En Stock</span>
                                    ) : (
                                        <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-[8px] font-black uppercase">Pre-Orden</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2 mb-4">
                            {item.specs.map((spec, index) => (
                                <span key={index} className="text-[9px] font-bold text-zinc-500 bg-zinc-100 px-2 py-1 rounded-lg uppercase tracking-wide">
                                    {spec}
                                </span>
                            ))}
                        </div>

                        <div className="flex gap-2">
                            <button className="flex-[0.4] py-3.5 rounded-2xl text-[10px] font-black text-zinc-500 bg-zinc-100 border border-zinc-200 uppercase tracking-wider hover:bg-zinc-200 transition-colors">
                                Detalles
                            </button>
                            <PremiumButton
                                module="grimorioMarket"
                                variant="gradient"
                                size="md"
                                icon={<span className="material-symbols-outlined !text-sm">{item.inStock ? 'shopping_bag' : 'schedule'}</span>}
                                iconPosition="right"
                                className="flex-1"
                            >
                                {item.inStock ? 'COMPRAR' : 'PRE-ORDENAR'}
                            </PremiumButton>
                        </div>
                    </GlassCard>
                ))}

                {/* PRODUCTOS SECTION */}
                {activeCategory === 'productos' && (
                    <div className="grid grid-cols-1 gap-4">
                        {marketProducts.map((product) => {
                            const isSelected = selectedItems.has(product.id);

                            return (
                                <GlassCard
                                    key={product.id}
                                    rounded="3xl"
                                    padding="md"
                                    className={`relative group transition-all ${isSelected ? 'ring-2 ring-emerald-500 bg-emerald-50/50' : ''}`}
                                    onClick={() => handleItemClick(product)}
                                >
                                    {/* Selection Checkbox */}
                                    {(isSelectionMode || isSelected) && (
                                        <div className="absolute top-4 right-4 z-10 text-emerald-600 bg-white rounded-full p-1 shadow-sm">
                                            <span className="material-symbols-outlined">
                                                {isSelected ? 'check_circle' : 'radio_button_unchecked'}
                                            </span>
                                        </div>
                                    )}

                                    <div className="flex gap-4 mb-4">
                                        <div className="w-20 h-20 rounded-2xl bg-zinc-100 border border-zinc-200 flex items-center justify-center flex-shrink-0 text-3xl">
                                            {product.emoji || '📦'}
                                        </div>

                                        <div className="flex-1">
                                            <h2 className="text-lg font-bold text-zinc-900 mb-1">{product.nombre}</h2>
                                            <p className="text-xs text-zinc-500 mb-1">{product.proveedor || 'Proveedor General'}</p>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xl font-black text-emerald-600">€{getPrice(product)}</span>
                                                <span className="text-[10px] text-zinc-400">/ {product.unidad}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {!isSelectionMode && (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={(e: React.MouseEvent) => { e.stopPropagation(); setIsSelectionMode(true); handleToggleSelection(product.id); }}
                                                className="px-4 py-2 bg-zinc-100 rounded-xl text-zinc-500 font-bold text-[10px] uppercase"
                                            >
                                                Seleccionar
                                            </button>
                                            <PremiumButton
                                                module="grimorioMarket"
                                                variant="gradient"
                                                size="sm"
                                                className="flex-1"
                                                onClick={() => {
                                                    setPurchasingIngredient(product);
                                                    setShowPurchaseModal(true);
                                                }}
                                            >
                                                PEDIR
                                            </PremiumButton>
                                        </div>
                                    )}
                                </GlassCard>
                            );
                        })}
                        {marketProducts.length === 0 && (
                            <div className="text-center py-10 opacity-50">
                                <p>No hay productos en el mercado (Asigna proveedores a tus ingredientes)</p>
                            </div>
                        )}
                    </div>
                )}
            </main>

            {selectedItems.size > 0 && (
                <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex gap-3 animate-in slide-in-from-bottom duration-300 w-full max-w-sm px-5 justify-center">
                    <button
                        onClick={() => handleDeleteSelected()}
                        className="bg-red-500 text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-2 font-bold hover:scale-105 transition-transform flex-1 justify-center"
                    >
                        <span className="material-symbols-outlined">delete</span>
                        Eliminar
                    </button>
                    <button
                        onClick={() => handleBulkPurchase()}
                        className="bg-emerald-500 text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-2 font-bold hover:scale-105 transition-transform flex-1 justify-center"
                    >
                        <span className="material-symbols-outlined">shopping_cart</span>
                        Comprar ({selectedItems.size})
                    </button>
                </div>
            )}



            {/* Purchase Modal */}
            {purchasingIngredient && (
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
            )}

            {showReplenishModal && (
                <StockReplenishmentModal
                    isOpen={showReplenishModal}
                    onClose={() => {
                        setShowReplenishModal(false);
                        setSelectedSupplierId(null);
                    }}
                    ingredients={ingredients}
                    suppliers={suppliers}
                    onConfirm={handleConfirmReplenish}
                    filterSupplierId={selectedSupplierId}
                />
            )}
        </div>
    );
};

export default GrimorioMarket;
