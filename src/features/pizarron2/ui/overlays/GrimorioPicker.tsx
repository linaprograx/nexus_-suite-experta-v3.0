import React, { useState } from 'react';
import { pizarronStore } from '../../state/store';
import { useIngredients } from '../../../../hooks/useIngredients';
import { useRecipes } from '../../../../hooks/useRecipes';
import { LuX, LuApple, LuScrollText, LuSearch } from 'react-icons/lu';

export const GrimorioPicker: React.FC = () => {
    // Selectors
    const pickerType = pizarronStore.useSelector(s => s.uiFlags.grimorioPickerOpen);

    // Local state for tab switching
    const [activeTab, setActiveTab] = useState<'recipes' | 'ingredients'>('recipes');

    // Hooks
    const { ingredients } = useIngredients();
    const { recipes } = useRecipes();

    if (!pickerType) return null;

    const items = activeTab === 'ingredients' ? ingredients : recipes;
    const title = 'Add from Grimorio';
    const Icon = activeTab === 'ingredients' ? LuApple : LuScrollText;

    const handleSelect = (item: any) => {
        const state = pizarronStore.getState();
        const vp = state.viewport;

        // Calculate Center Position
        const cx = (window.innerWidth / 2 - vp.x) / vp.zoom;
        const cy = (window.innerHeight / 2 - vp.y) / vp.zoom;

        const newNode: any = {
            id: crypto.randomUUID(),
            type: activeTab === 'ingredients' ? 'ingredient' : 'recipe',
            x: cx - 150,
            y: cy - 100,
            w: activeTab === 'ingredients' ? 300 : 400,
            h: activeTab === 'ingredients' ? 150 : 350,
            zIndex: (state.order.length || 0) + 100,
            content: {
                borderRadius: 12,
                backgroundColor: '#ffffff',
                title: item.nombre,
                cost: activeTab === 'ingredients' ? (item.costo || item.precioCompra || 0) : item.costoTotal,
                unit: activeTab === 'ingredients' ? item.unidad : undefined,
                margin: activeTab === 'recipes' ? item.margen : undefined,
                snapshotData: item
            },
            ingredientId: activeTab === 'ingredients' ? item.id : undefined,
            recipeId: activeTab === 'recipes' ? item.id : undefined,
            createdAt: Date.now(),
            updatedAt: Date.now()
        };

        pizarronStore.addNode(newNode);
        pizarronStore.setUIFlag('grimorioPickerOpen', null);
    };

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
                        <div className={`p-2 rounded-xl ${activeTab === 'ingredients' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                            <Icon size={20} />
                        </div>
                        <h3 className="font-semibold text-lg tracking-tight">{title}</h3>
                    </div>
                    <button onClick={() => pizarronStore.setUIFlag('grimorioPickerOpen', null)}
                        className="p-1.5 hover:bg-slate-100 hover:text-red-500 rounded-full text-slate-400 transition-colors">
                        <LuX size={18} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-100 bg-slate-50/50">
                    <button
                        onClick={() => setActiveTab('recipes')}
                        className={`flex-1 px-4 py-3 text-sm font-semibold transition-all ${activeTab === 'recipes'
                                ? 'text-blue-600 bg-white border-b-2 border-blue-600'
                                : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                            }`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <LuScrollText size={16} />
                            <span>Recipes ({recipes.length})</span>
                        </div>
                    </button>
                    <button
                        onClick={() => setActiveTab('ingredients')}
                        className={`flex-1 px-4 py-3 text-sm font-semibold transition-all ${activeTab === 'ingredients'
                                ? 'text-green-600 bg-white border-b-2 border-green-600'
                                : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                            }`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <LuApple size={16} />
                            <span>Ingredients ({ingredients.length})</span>
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
                            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-200 text-slate-700 placeholder-slate-400"
                        />
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
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
                </div>

                {/* Footer */}
                <div className="p-3 border-t border-slate-100 bg-slate-50/80 text-center">
                    <span className="text-xs text-slate-400 font-medium">{items.length} items available</span>
                </div>
            </div>
        </div>
    );
};
