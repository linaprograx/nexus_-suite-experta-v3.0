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
    // Phase 5.3: Context Persistence
    // Hydrate from sessionStorage or default
    const getInitialState = <T extends string>(key: string, defaultVal: T): T => {
        try {
            const saved = sessionStorage.getItem(`grimorium_${key}`);
            return (saved as T) || defaultVal;
        } catch {
            return defaultVal;
        }
    };

    const [activeItem, setActiveItem] = useState<GrimoriumItem | null>(null);
    const [viewMode, setViewModeState] = useState<GrimoriumViewMode>(() => getInitialState('viewMode', 'recipes'));
    const [activeLayer, setActiveLayerState] = useState<GrimoriumLayer>(() => getInitialState('activeLayer', 'composition'));

    // Persistence Wrappers
    const setViewMode = (mode: GrimoriumViewMode) => {
        setViewModeState(mode);
        sessionStorage.setItem('grimorium_viewMode', mode);
    };

    const setActiveLayer = (layer: GrimoriumLayer) => {
        setActiveLayerState(layer);
        sessionStorage.setItem('grimorium_activeLayer', layer);
    };

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

    // Initial Sync (Override persistence if explicit prop provided, but usually initialTab is just default)
    useEffect(() => {
        // Only override if initialTab suggests a specific entry point different from default, 
        // but we prioritize persistence for "Suite Coherence". 
        // However, if the user DIRECTLY links to a sub-route (if we had them), we'd use that.
        // For now, we trust persistence unless it's a fresh session (handled by session storage).
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

    const value = React.useMemo(() => ({
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
    }), [activeItem, viewMode, activeLayer, activeTab]);

    return (
        <ItemContext.Provider value={value}>
            {children}
        </ItemContext.Provider>
    );
};
