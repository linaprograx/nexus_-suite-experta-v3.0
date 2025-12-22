import React, { createContext, useContext, useState, useEffect } from 'react';
import { Recipe, Ingredient } from '../../types';

// --- Conceptual Definitions ---

export type GrimoriumItem = Recipe | Ingredient;

// REFINED ONTOLOGY:
// - Recipes: The creations.
// - Stock: What we HAVE (Inventory).
// - Market: What EXISTS (Global Catalog/Ingredients).
export type GrimoriumViewMode = 'recipes' | 'stock' | 'market';

export type GrimoriumLayer =
    | 'composition'    // Default Layer (Standard Details)
    | 'cost'           // Escandallator Tool
    | 'optimization'   // Zero Waste Tool
    | 'history';       // History Tool
// Note: 'Stock' is no longer a tool/layer. It is a main View Mode.

export interface ItemContextType {
    // Core State
    activeItem: GrimoriumItem | null;
    viewMode: GrimoriumViewMode;      // What list is showing in the center?
    activeLayer: GrimoriumLayer;      // What tool is active in the side panel?

    // Legacy Compatibility
    activeTab: string; // Kept for sync, though usage should decrease.

    // Actions
    selectItem: (item: GrimoriumItem | null) => void;
    setViewMode: (mode: GrimoriumViewMode) => void;
    setLayer: (layer: GrimoriumLayer) => void;
    toggleLayer: (layer: GrimoriumLayer) => void; // Smart toggle

    // Helper to check item type
    isRecipe: (item: GrimoriumItem) => item is Recipe;
    isIngredient: (item: GrimoriumItem) => item is Ingredient;
}

const ItemContext = createContext<ItemContextType | undefined>(undefined);

export const useItemContext = () => {
    const context = useContext(ItemContext);
    if (!context) {
        throw new Error('useItemContext must be used within an ItemProvider (GrimoriumShell)');
    }
    return context;
};

interface ItemProviderProps {
    children: React.ReactNode;
    initialTab?: string;
}

export const ItemProvider: React.FC<ItemProviderProps> = ({ children, initialTab = 'recipes' }) => {
    const [activeItem, setActiveItem] = useState<GrimoriumItem | null>(null);
    const [viewMode, setViewMode] = useState<GrimoriumViewMode>('recipes');
    const [activeLayer, setActiveLayer] = useState<GrimoriumLayer>('composition');

    // Derived legacy 'activeTab' for backward compatibility
    const activeTab = React.useMemo(() => {
        // 1. If a Layer (Tool) is active that overrides the main view context conceptually for legacy tabs:
        if (activeLayer === 'cost') return 'escandallator';
        if (activeLayer === 'optimization') return 'zerowaste';

        // 2. Otherwise/Default (Composition Layer), map ViewMode to Legacy Tab
        if (viewMode === 'recipes') return 'recipes';
        if (viewMode === 'market') return 'ingredients'; // Market replaces Ingredients
        if (viewMode === 'stock') return 'stock'; // Stock View maps to Stock Tab

        return 'recipes';
    }, [activeLayer, viewMode]);

    // Initial Sync
    useEffect(() => {
        if (initialTab === 'ingredients') setViewMode('market');
        else if (initialTab === 'stock') setViewMode('stock');
        else if (initialTab === 'recipes') setViewMode('recipes');
    }, []);

    const selectItem = (item: GrimoriumItem | null) => {
        setActiveItem(item);
    };

    const toggleLayer = (layer: GrimoriumLayer) => {
        if (activeLayer === layer) {
            // Toggle off -> go back to composition
            setActiveLayer('composition');
        } else {
            setActiveLayer(layer);
        }
    };

    const isRecipe = (item: GrimoriumItem): item is Recipe => {
        return (item as Recipe).ingredientes !== undefined;
    };

    const isIngredient = (item: GrimoriumItem): item is Ingredient => {
        return (item as Ingredient).precioCompra !== undefined;
    };

    const value = {
        activeItem,
        viewMode,
        activeLayer,
        activeTab,
        selectItem,
        setViewMode,
        setLayer: setActiveLayer,
        toggleLayer,
        isRecipe,
        isIngredient
    };

    return (
        <ItemContext.Provider value={value}>
            {children}
        </ItemContext.Provider>
    );
};
