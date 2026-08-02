import { logger } from "../../../../utils/logger";

import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { pizarronStore } from '../../state/store';
import { useIngredients } from '../../../../hooks/useIngredients';
import { useRecipes } from '../../../../hooks/useRecipes';
import { LuX, LuApple, LuScrollText, LuSearch, LuCalculator } from 'react-icons/lu';

type ActiveTab = 'recipes' | 'ingredients' | 'escandallos';

interface EscandalloItem {
    id: string;
    recipeId: string;
    recipeName: string;
    costo: number;
    precioVenta: number;
    rentabilidad: number;
    margenBruto?: number;
    createdAt?: { seconds: number };
}

export const GrimorioPicker: React.FC = () => {
    // Selectors
    const pickerType = pizarronStore.useSelector(s => s.uiFlags.grimorioPickerOpen);

    // Local state
    const [activeTab, setActiveTab] = useState<ActiveTab>('recipes');
    const [searchQuery, setSearchQuery] = useState('');
    const [escandallos, setEscandallos] = useState<EscandalloItem[]>([]);
    const [escandallosLoading, setEscandallosLoading] = useState(false);

    // Hooks
    const { ingredients } = useIngredients();
    const { recipes } = useRecipes();

    // Reset search when switching tabs
    const handleTabChange = (tab: ActiveTab) => {
        setActiveTab(tab);
        setSearchQuery('');
    };

    // Subscribe to escandallo history when tab is active
    useEffect(() => {
        if (activeTab !== 'escandallos') return;

        const db = pizarronStore.getState().db;
        const userId = getAuth().currentUser?.uid;
        if (!db || !userId) return;

        setEscandallosLoading(true);
        const colPath = `users/${userId}/escandallo-history`;
        const q = query(collection(db, colPath), orderBy('createdAt', 'desc'), limit(50));

        const unsubscribe = onSnapshot(q, snapshot => {
            setEscandallos(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as EscandalloItem)));
            setEscandallosLoading(false);
        }, err => {
            logger.error('[GrimorioPicker] escandallo-history error:', err);
            setEscandallosLoading(false);
        });

        return () => unsubscribe();
    }, [activeTab]);

    if (!pickerType) return null;

    // Filtered lists
    const filteredRecipes = recipes.filter((r: any) =>
        r.nombre?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const filteredIngredients = ingredients.filter((i: any) =>
        i.nombre?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const filteredEscandallos = escandallos.filter(e =>
        e.recipeName?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSelect = (item: any) => {
        const state = pizarronStore.getState();
        const vp = state.viewport;

        const cx = (window.innerWidth / 2 - vp.x) / vp.zoom;
        const cy = (window.innerHeight / 2 - vp.y) / vp.zoom;

        const newNode: any = {
            id: crypto.randomUUID(),
            type: activeTab === 'ingredients' ? 'ingredient' : activeTab === 'recipes' ? 'recipe' : 'costing',
            x: cx - 150,
            y: cy - 100,
            w: activeTab === 'ingredients' ? 300 : 400,
            h: activeTab === 'ingredients' ? 150 : 350,
            zIndex: (state.order.length || 0) + 100,
            content: {
                borderRadius: 12,
                backgroundColor: '#ffffff',
                title: activeTab === 'escandallos' ? item.recipeName : item.nombre,
                cost: activeTab === 'ingredients'
                    ? (item.costo || item.precioCompra || 0)
                    : activeTab === 'recipes'
                        ? item.costoTotal
                        : item.costo,
                unit: activeTab === 'ingredients' ? item.unidad : undefined,
                margin: activeTab === 'recipes' ? item.margen : undefined,
                ingredientId: activeTab === 'ingredients' ? item.id : undefined,
                recipeId: activeTab === 'recipes' ? item.id : undefined,
                recipeIdForCosting: activeTab === 'escandallos' ? item.recipeId : undefined,
                salePriceOverride: activeTab === 'escandallos' ? item.precioVenta : undefined,
                snapshotData: item
            },
            createdAt: Date.now(),
            updatedAt: Date.now()
        };

        pizarronStore.addNode(newNode);
        pizarronStore.setUIFlag('grimorioPickerOpen', null);
    };

    const tabCount = activeTab === 'recipes'
        ? recipes.length
        : activeTab === 'ingredients'
            ? ingredients.length
            : escandallos.length;

    return (
        <div className="grimorio-picker absolute inset-0 z-50 flex items-center justify-center pointer-events-auto">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={() => pizarronStore.setUIFlag('grimorioPickerOpen', null)} />

            {/* Modal */}
            <div className="bg-white/95 backdrop-blur-xl border border-white/50 shadow-2xl rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden relative z-10 animate-in zoom-in-95 slide-in-from-bottom-5 duration-300 ring-1 ring-slate-900/5">

                {/* Header */}
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white/50">
                    <div className="flex items-center gap-3 text-slate-700">
                        <div className={`p-2 rounded-xl ${activeTab === 'ingredients' ? 'bg-green-100 text-green-600' : activeTab === 'recipes' ? 'bg-blue-100 text-blue-600' : 'bg-rose-100 text-rose-600'}`}>
                            {activeTab === 'ingredients' ? <LuApple size={20} /> : activeTab === 'recipes' ? <LuScrollText size={20} /> : <LuCalculator size={20} />}
                        </div>
                        <h3 className="font-semibold text-lg tracking-tight">Add from Grimorio</h3>
                    </div>
                    <button onClick={() => pizarronStore.setUIFlag('grimorioPickerOpen', null)}
                        className="p-1.5 hover:bg-slate-100 hover:text-red-500 rounded-full text-slate-400 transition-colors">
                        <LuX size={18} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-100 bg-slate-50/50">
                    <button
                        onClick={() => handleTabChange('recipes')}
                        className={`flex-1 px-4 py-3 text-sm font-semibold transition-all ${activeTab === 'recipes'
                            ? 'text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900 border-b-2 border-blue-600'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-800'
                        }`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <LuScrollText size={16} />
                            <span>Recipes ({recipes.length})</span>
                        </div>
                    </button>
                    <button
                        onClick={() => handleTabChange('ingredients')}
                        className={`flex-1 px-4 py-3 text-sm font-semibold transition-all ${activeTab === 'ingredients'
                            ? 'text-green-600 dark:text-green-400 bg-white dark:bg-slate-900 border-b-2 border-green-600'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-800'
                        }`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <LuApple size={16} />
                            <span>Ingredients ({ingredients.length})</span>
                        </div>
                    </button>
                    <button
                        onClick={() => handleTabChange('escandallos')}
                        className={`flex-1 px-4 py-3 text-sm font-semibold transition-all ${activeTab === 'escandallos'
                            ? 'text-rose-600 dark:text-rose-400 bg-white dark:bg-slate-900 border-b-2 border-rose-600'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-800'
                        }`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <LuCalculator size={16} />
                            <span>Escandallos ({escandallos.length})</span>
                        </div>
                    </button>
                </div>

                {/* Search */}
                <div className="p-3 border-b border-slate-50 bg-slate-50/50">
                    <div className="relative">
                        <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder={`Search ${activeTab}...`}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-600 text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500"
                        />
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">

                    {/* Recipes & Ingredients */}
                    {activeTab !== 'escandallos' && (() => {
                        const items = activeTab === 'ingredients' ? filteredIngredients : filteredRecipes;
                        return (
                            <>
                                {items.length === 0 && (
                                    <div className="p-8 text-center text-slate-400 italic">No items found</div>
                                )}
                                <div className="space-y-1">
                                    {items.map((item: any) => (
                                        <button key={item.id} onClick={() => handleSelect(item)}
                                            className="w-full text-left p-3 hover:bg-white hover:shadow-sm hover:ring-1 hover:ring-slate-100 rounded-xl flex justify-between items-center group transition-all duration-200 border border-transparent">
                                            <div>
                                                <span className="font-medium text-slate-700 group-hover:text-slate-900 block">{item.nombre}</span>
                                                <span className="text-xs text-slate-400 font-medium">
                                                    {activeTab === 'ingredients' ? (item.proveedores?.length || 0) + ' Providers' : (item.categorias?.join(', ') || 'General')}
                                                </span>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className="text-sm font-semibold text-slate-600 group-hover:text-amber-600 font-mono">
                                                    {activeTab === 'ingredients'
                                                        ? `$${(item.costo || item.precioCompra || 0).toFixed(2)}`
                                                        : `$${(item.costoTotal || 0).toFixed(2)}`}
                                                </span>
                                                <span className="text-[10px] uppercase tracking-wider text-slate-300">
                                                    {activeTab === 'ingredients' ? item.unidad : 'VAL'}
                                                </span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </>
                        );
                    })()}

                    {/* Escandallos */}
                    {activeTab === 'escandallos' && (
                        <>
                            {escandallosLoading && (
                                <div className="p-8 text-center text-slate-400 italic">Loading...</div>
                            )}
                            {!escandallosLoading && filteredEscandallos.length === 0 && (
                                <div className="p-8 text-center text-slate-400 italic">No items found</div>
                            )}
                            <div className="space-y-1">
                                {filteredEscandallos.map(item => (
                                    <button key={item.id} onClick={() => handleSelect(item)}
                                        className="w-full text-left p-3 hover:bg-white hover:shadow-sm hover:ring-1 hover:ring-slate-100 rounded-xl flex justify-between items-center group transition-all duration-200 border border-transparent">
                                        <div>
                                            <span className="font-medium text-slate-700 group-hover:text-slate-900 block">{item.recipeName}</span>
                                            <span className="text-xs text-slate-400 font-medium">
                                                Rentab. {(item.rentabilidad || 0).toFixed(0)}%
                                            </span>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-sm font-semibold text-slate-600 group-hover:text-rose-600 font-mono">
                                                ${(item.precioVenta || 0).toFixed(2)}
                                            </span>
                                            <span className="text-[10px] uppercase tracking-wider text-slate-300">PVP</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="p-3 border-t border-slate-100 bg-slate-50/80 text-center">
                    <span className="text-xs text-slate-400 font-medium">{tabCount} items available</span>
                </div>
            </div>
        </div>
    );
};
