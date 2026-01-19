import React, { useMemo, useState } from 'react';
import { PageName, UserProfile } from '../types';
import { GrimorioHeader } from '../components/GrimorioHeader';
import { useApp } from '../../../context/AppContext';
import { useIngredients } from '../../../hooks/useIngredients';
import { useOrders } from '../../../hooks/useOrders';
import { StockInventoryPanel } from '../../../components/escandallator/StockInventoryPanel';
import { StockItem, PurchaseEvent } from '../../../types';
import { IngredientFormModal } from '../../../components/grimorium/IngredientFormModal';
import { GrimorioToolbar } from '../components/GrimorioToolbar';

interface Props {
    onNavigate: (page: PageName) => void;
    user?: UserProfile;
}

const GrimorioStock: React.FC<Props> = ({ onNavigate }) => {
    const { db, userId, appId } = useApp();
    const { ingredients } = useIngredients();
    const { orders } = useOrders();

    const [selectedIngId, setSelectedIngId] = useState<string | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);

    // Toolbar State
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');

    // Derived Categories
    const categories = useMemo(() => {
        const cats = new Set(ingredients.map(i => i.categoria || 'General'));
        return Array.from(cats).sort();
    }, [ingredients]);

    // Map Ingredients to StockItems
    const stockItems: StockItem[] = useMemo(() => {
        return ingredients.map(ing => ({
            ingredientId: ing.id,
            ingredientName: ing.nombre,
            unit: ing.unidad,
            quantityAvailable: ing.stock || 0,
            totalValue: (ing.stock || 0) * (ing.costo || 0),
            averageUnitCost: ing.costo || 0,
            lastPurchaseDate: ing.createdAt ? new Date(ing.createdAt.seconds * 1000) : new Date(),
            providerName: 'N/A',
            lastPurchaseQuantity: 0
        }));
    }, [ingredients]);

    const purchaseEvents: PurchaseEvent[] = useMemo(() => {
        return orders.flatMap(order => order.items.map((item: any) => ({
            id: order.id,
            ingredientId: item.ingredientId,
            ingredientName: item.ingredientName || item.name || '',
            providerId: 'unknown',
            providerName: order.name ? (order.name.split('-')[1]?.trim() || 'Unknown') : 'Unknown', // SAFE CHECK
            unit: item.unit,
            quantity: item.quantity,
            unitPrice: item.estimatedCost || 0,
            totalCost: (item.estimatedCost || 0) * (item.quantity || 1),
            createdAt: order.createdAt || new Date(), // SAFE CHECK (Already Date)
            status: order.status === 'completed' ? 'completed' : 'pending' // MATCH LITERAL
        }) as PurchaseEvent));
    }, [orders]);

    const handleSelectIngredient = (id: string) => {
        setSelectedIngId(id);
        setShowEditModal(true);
    };

    const selectedIngredient = useMemo(() =>
        ingredients.find(i => i.id === selectedIngId) || null
        , [ingredients, selectedIngId]);

    return (
        <div className="bg-transparent relative overflow-hidden flex flex-col h-full text-zinc-800 dark:text-zinc-100">
            {/* FIXED GRADIENT LAYER - Removed to use Global MobileShell Gradient */}

            <div className="shrink-0 bg-transparent z-10">
                <GrimorioHeader
                    activeSection="stock"
                    pageTitle="Stock Alert"
                />
            </div>

            {/* Unified Toolbar */}
            <div className="shrink-0 z-20">
                <GrimorioToolbar
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    categories={categories}
                    selectedCategory={selectedCategory}
                    onCategoryChange={setSelectedCategory}
                    color="blue"
                    onAdd={() => {
                        setSelectedIngId(null);
                        setShowEditModal(true);
                    }}
                />
            </div>

            <div className="flex-1 overflow-hidden relative z-10">
                <StockInventoryPanel
                    stockItems={stockItems}
                    purchases={purchaseEvents}
                    allIngredients={ingredients}
                    onSelectIngredient={handleSelectIngredient}
                    // Inject External Controls (Hides internal toolbar)
                    externalSearchTerm={searchQuery}
                    externalCategory={selectedCategory}
                />
            </div>

            {showEditModal && db && userId && (
                <IngredientFormModal
                    isOpen={showEditModal}
                    onClose={() => {
                        setShowEditModal(false);
                        setSelectedIngId(null);
                    }}
                    editingIngredient={selectedIngredient || null} // CORRECT PROP
                    appId={appId} // CORRECT PROP
                    db={db}
                    userId={userId}
                    theme="blue" // Matching Theme
                />
            )}
        </div>
    );
};

export default GrimorioStock;
