import React, { useState } from 'react';
import { pizarronStore } from '../../state/store';
import { useRecipes } from '../../../../hooks/useRecipes';
import { makeMenuService } from '../../../../services/makeMenuService';
import { LuMenu, LuSearch, LuCheck, LuX, LuLoader } from 'react-icons/lu';

export const MenuGeneratorModal: React.FC = () => {
    const show = pizarronStore.useSelector(s => s.uiFlags.showMenuGenerator);
    const { recipes: allRecipes } = useRecipes();

    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [search, setSearch] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    if (!show) return null;

    const filteredRecipes = allRecipes.filter(r =>
        r.nombre.toLowerCase().includes(search.toLowerCase())
    );

    const toggleRecipe = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleGenerate = async () => {
        if (selectedIds.length === 0) return;

        setIsGenerating(true);
        try {
            const recipes = allRecipes.filter(r => selectedIds.includes(r.id));
            // In Phase 6.4, Pizarrón items/sections could be extracted from canvas logic if needed,
            // but for now we follow the same logical selection as Make Menu.
            const proposals = await makeMenuService.generateProposals(recipes, [], [], 'cocktails');

            pizarronStore.injectMenuProposals(proposals, recipes);
            pizarronStore.setUIFlag('showMenuGenerator', false);
        } catch (e) {
            console.error("Failed to generate in-canvas menu", e);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[80vh]">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <LuMenu className="text-rose-500" />
                            Diseñador de Menú
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">Selecciona las recetas para generar propuestas automáticas</p>
                    </div>
                    <button
                        onClick={() => pizarronStore.setUIFlag('showMenuGenerator', false)}
                        className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"
                    >
                        <LuX className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                {/* Search */}
                <div className="p-4 px-6">
                    <div className="relative">
                        <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Buscar recetas..."
                            className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-rose-500/20 transition-all"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-2 custom-scrollbar">
                    {filteredRecipes.map(r => (
                        <div
                            key={r.id}
                            onClick={() => toggleRecipe(r.id)}
                            className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer border transition-all ${selectedIds.includes(r.id)
                                ? 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30'
                                : 'bg-slate-50 dark:bg-slate-800/50 border-transparent hover:border-slate-200 dark:hover:border-slate-700'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${selectedIds.includes(r.id) ? 'bg-rose-500 text-white' : 'bg-white dark:bg-slate-700 text-slate-400'
                                    }`}>
                                    {r.nombre.charAt(0)}
                                </div>
                                <div>
                                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{r.nombre}</div>
                                    <div className="text-xs text-slate-500">${r.precioVenta || 0}</div>
                                </div>
                            </div>
                            {selectedIds.includes(r.id) && <LuCheck className="text-rose-500 w-5 h-5" />}
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
                    <div className="text-sm font-medium text-slate-500">
                        {selectedIds.length} recetas seleccionadas
                    </div>
                    <button
                        disabled={selectedIds.length === 0 || isGenerating}
                        onClick={handleGenerate}
                        className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white rounded-xl font-bold shadow-lg shadow-rose-500/20 transition-all flex items-center gap-2"
                    >
                        {isGenerating ? <LuLoader className="w-4 h-4 animate-spin" /> : <LuMenu className="w-4 h-4" />}
                        Generar 3 Propuestas
                    </button>
                </div>
            </div>
        </div>
    );
};
