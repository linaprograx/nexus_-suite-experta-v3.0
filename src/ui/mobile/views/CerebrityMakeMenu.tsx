import React, { useState } from 'react';
import { PageName, UserProfile } from '../types';
import GlassCard from '../components/GlassCard';
import PremiumButton from '../components/PremiumButton';

import { useRecipes } from '../../../hooks/useRecipes';
import { usePizarronData } from '../../../hooks/usePizarronData';
import { useApp } from '../../../context/AppContext';
import { useCerebrityOrchestrator } from '../../../hooks/useCerebrityOrchestrator';
import { makeMenuService, MenuDesignProposal } from '../../../services/makeMenuService';
import { Modal } from '../../../components/ui/Modal';
import { CerebrityResponseModal } from '../components/CerebrityResponseModal';

interface Props {
    onNavigate: (page: PageName) => void;
    user?: UserProfile;
}

const CerebrityMakeMenu: React.FC<Props> = ({ onNavigate }) => {
    const { db, appId } = useApp();
    const { recipes, isLoading: isLoadingRecipes } = useRecipes();
    const { tasks: allTasks, isLoading: isLoadingTasks } = usePizarronData();
    const { state, actions } = useCerebrityOrchestrator();

    const [selectedRecipeIds, setSelectedRecipeIds] = useState<string[]>([]);
    const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
    const [selectedStyle, setSelectedStyle] = useState<string>('Moderno');
    const [selectedColor, setSelectedColor] = useState<string>('#14b8a6');
    const [results, setResults] = useState<MenuDesignProposal[]>([]);
    const [isResultModalOpen, setIsResultModalOpen] = useState(false);
    const [activeResultIndex, setActiveResultIndex] = useState(0);
    const [alertConfig, setAlertConfig] = useState<{ isOpen: boolean, title: string, message: string, type?: 'success' | 'error' | 'info' | 'ai' } | null>(null);
    const [isGeneratingLocally, setIsGeneratingLocally] = useState(false);

    const colors = [
        { name: 'Dark', value: '#0f172a' },
        { name: 'Red', value: '#ef4444' },
        { name: 'Gold', value: '#eab308' },
        { name: 'Green', value: '#10b981' }
    ];

    const styles = ['Moderno', 'Rústico', 'Técnico', 'Narrativo', 'Minimalista'];

    const toggleRecipe = (id: string) => {
        setSelectedRecipeIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const toggleTask = (id: string) => {
        setSelectedTaskIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const handleGenerateMenu = async () => {
        if (selectedRecipeIds.length === 0) {
            setAlertConfig({
                isOpen: true,
                title: 'Selección Vacía',
                message: 'Por favor, selecciona al menos una receta para que la IA pueda diseñar el menú.',
                type: 'info'
            });
            return;
        }

        const selectedRecipes = recipes.filter(r => selectedRecipeIds.includes(r.id));
        const selectedTasks = allTasks.filter(t => selectedTaskIds.includes(t.id));

        // 🧠 Hard Logic: Validate coherence
        const coherence = actions.validateMenuCoherence(selectedRecipes);
        if (!coherence.valid) {
            setAlertConfig({
                isOpen: true,
                title: 'Aviso de Coherencia',
                message: `Se ha detectado una posible incoherencia: ${coherence.reason}. Puedes continuar, pero el resultado podría verse afectado.`,
                type: 'info'
            });
        }

        setIsGeneratingLocally(true);
        console.log("[MakeMenu] Starting generation for recipes:", selectedRecipeIds);

        try {
            const proposals = await makeMenuService.generateProposals(
                selectedRecipes,
                selectedTasks,
                ['Menú Principal'],
                'cocktails',
                selectedStyle,
                selectedColor
            );
            console.log("[MakeMenu] Generation successful, proposals count:", proposals.length);
            setResults(proposals);
            setActiveResultIndex(0);
            setIsResultModalOpen(true);
        } catch (e) {
            console.error("[MakeMenu] Generation failed:", e);
            setAlertConfig({
                isOpen: true,
                title: 'Error de IA',
                message: 'No pudimos generar las propuestas de menú en este momento. Revisa tu conexión e intenta de nuevo.',
                type: 'error'
            });
        } finally {
            setIsGeneratingLocally(false);
        }
    };

    const editorialStyle = actions.getMenuEditorialStyle();
    const coherence = actions.validateMenuCoherence(recipes.filter(r => selectedRecipeIds.includes(r.id)));

    // Group recipes by sections (mock for now - could be actual categories from recipes)
    const sections = [
        {
            name: 'Clásicos',
            recipes: recipes.filter(r => r.categorias?.includes('Clásico') || !r.categorias?.length).slice(0, 8),
            category: 'Tradicional'
        },
        {
            name: 'Signature',
            recipes: recipes.filter(r => r.categorias?.includes('Signature')).slice(0, 5),
            category: 'Especial de la Casa'
        },
        {
            name: 'Temporada',
            recipes: recipes.filter(r => r.categorias?.includes('Temporada')).slice(0, 6),
            category: 'Tiempo Limitado'
        },
    ];

    return (
        <div className="bg-transparent relative overflow-hidden flex flex-col h-full">

            {/* Header Removed (Hoisted to Layout) */}



            {/* 🧠 Hard Logic: Editorial Style & Coherence Alerts */}
            <div className="px-5 mb-2 space-y-2">
                {/* Personalization Grid */}
                <GlassCard rounded="2xl" padding="sm" className="bg-white/40 dark:!bg-white/5 border-white/30 dark:!border-white/10 backdrop-blur-xl">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex-1">
                            <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest block mb-0.5">Estilo</label>
                            <select
                                value={selectedStyle}
                                onChange={(e) => setSelectedStyle(e.target.value)}
                                className="w-full bg-transparent text-[10px] font-bold text-zinc-900 dark:text-white outline-none"
                            >
                                {styles.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div className="h-6 w-px bg-zinc-200" />
                        <div>
                            <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest block mb-0.5">Acento</label>
                            <div className="flex gap-1">
                                {colors.map(c => (
                                    <button
                                        key={c.value}
                                        onClick={() => setSelectedColor(c.value)}
                                        className={`w-3.5 h-3.5 rounded-full transition-all ${selectedColor === c.value ? 'scale-110 ring-1 ring-offset-1 ring-zinc-300' : 'opacity-60'}`}
                                        style={{ backgroundColor: c.value }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </GlassCard>

                {/* Coherence Warning */}
                {!coherence.valid && selectedRecipeIds.length > 0 && (
                    <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3 shadow-sm">
                        <span className="material-symbols-outlined text-amber-600 fill-1">warning</span>
                        <div className="flex-1">
                            <p className="text-[10px] font-black text-amber-900 uppercase tracking-wide mb-0.5">Conflicto de Coherencia</p>
                            <p className="text-[11px] text-amber-700 leading-tight font-medium">{coherence.reason}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto custom-scroll px-5 pb-32 space-y-4">

                {/* Generate Card */}
                <GlassCard rounded="3xl" padding="xl" className="bg-gradient-to-r from-yellow-50 to-transparent dark:!bg-white/5 dark:from-yellow-500/10 dark:to-transparent dark:!border-white/10">
                    <div className="flex items-center gap-5 mb-5">
                        <div className="w-16 h-16 rounded-2xl bg-yellow-500 flex items-center justify-center text-white shadow-xl" style={{ boxShadow: '0 0 20px rgba(255, 230, 0, 0.4)' }}>
                            <span className="material-symbols-outlined text-3xl fill-1">edit_note</span>
                        </div>
                        <div className="flex-1">
                            <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-1">Generar Menú</h3>
                            <p className="text-xs text-zinc-600 dark:text-zinc-400">
                                {selectedRecipeIds.length} recetas seleccionadas
                            </p>
                        </div>
                    </div>

                    <PremiumButton
                        customColor="#84cc16"
                        customGradient="linear-gradient(135deg, #84cc16 0%, #65a30d 100%)"
                        variant="gradient"
                        size="lg"
                        fullWidth
                        onClick={handleGenerateMenu}
                        loading={isGeneratingLocally || state.isGenerating}
                        disabled={selectedRecipeIds.length === 0 || isGeneratingLocally}
                        icon={<span className="material-symbols-outlined !text-base">auto_awesome</span>}
                        iconPosition="right"
                    >
                        {isGeneratingLocally || state.isGenerating ? 'GENERANDO...' : 'GENERAR MENÚ'}
                    </PremiumButton>
                </GlassCard>

                {/* Selection Area */}
                <div className="space-y-6">
                    {/* Recipes Selection */}
                    <div>
                        <h3 className="text-xs font-black text-zinc-900 dark:text-white uppercase tracking-wider mb-3 px-2">Selecciona Recetas</h3>
                        <div className="space-y-2">
                            {isLoadingRecipes ? (
                                <div className="p-10 text-center"><span className="material-symbols-outlined animate-spin text-yellow-500">sync</span></div>
                            ) : recipes.length === 0 ? (
                                <p className="text-center text-zinc-400 text-xs py-4 italic">No hay recetas disponibles.</p>
                            ) : (
                                recipes.slice(0, 10).map(recipe => (
                                    <button
                                        key={recipe.id}
                                        onClick={() => toggleRecipe(recipe.id)}
                                        className={`w-full flex items-center gap-3 p-3 rounded-2xl border transition-all ${selectedRecipeIds.includes(recipe.id)
                                            ? 'bg-yellow-50 dark:!bg-yellow-500/10 border-yellow-200 dark:!border-yellow-500/20 shadow-sm'
                                            : 'bg-white/40 dark:!bg-white/5 border-white/20 dark:!border-white/10'
                                            }`}
                                    >
                                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${selectedRecipeIds.includes(recipe.id) ? 'bg-yellow-500 border-yellow-500' : 'bg-transparent border-zinc-300 dark:!border-white/20'}`}>
                                            {selectedRecipeIds.includes(recipe.id) && <span className="material-symbols-outlined text-white text-[14px]">check</span>}
                                        </div>
                                        <span className="flex-1 text-left text-xs font-bold text-zinc-800 dark:text-zinc-200">{recipe.nombre}</span>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Pizarron Ideas Selection */}
                    <div>
                        <h3 className="text-xs font-black text-zinc-900 dark:text-white uppercase tracking-wider mb-3 px-2">Conceptos Aprobados</h3>
                        <div className="space-y-2">
                            {isLoadingTasks ? (
                                <div className="p-10 text-center"><span className="material-symbols-outlined animate-spin text-yellow-500">sync</span></div>
                            ) : allTasks.length === 0 ? (
                                <p className="text-center text-zinc-400 text-xs py-4 italic">No hay ideas aprobadas en el pizarrón.</p>
                            ) : (
                                allTasks.filter(t => t.status === 'aprobado' || t.status === 'Ideas').slice(0, 5).map(task => (
                                    <button
                                        key={task.id}
                                        onClick={() => toggleTask(task.id)}
                                        className={`w-full flex items-center gap-3 p-3 rounded-2xl border transition-all ${selectedTaskIds.includes(task.id)
                                            ? 'bg-yellow-50 dark:!bg-yellow-500/10 border-yellow-200 dark:!border-yellow-500/20 shadow-sm'
                                            : 'bg-white/40 dark:!bg-white/5 border-white/20 dark:!border-white/10'
                                            }`}
                                    >
                                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${selectedTaskIds.includes(task.id) ? 'bg-yellow-500 border-yellow-500' : 'bg-transparent border-zinc-300 dark:!border-white/20'}`}>
                                            {selectedTaskIds.includes(task.id) && <span className="material-symbols-outlined text-white text-[14px]">check</span>}
                                        </div>
                                        <div className="flex-1 text-left">
                                            <p className="text-[10px] leading-tight font-bold text-zinc-800 dark:text-zinc-200 line-clamp-1">{task.content}</p>
                                            <p className="text-[8px] text-zinc-400 uppercase tracking-widest font-black">Pizarrón Idea</p>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* Results Modal */}
            <Modal
                isOpen={isResultModalOpen}
                onClose={() => setIsResultModalOpen(false)}
                title="Propuestas de Diseño"
            >
                <div className="flex flex-col h-[70vh]">
                    {/* Tabs / Selector */}
                    <div className="flex gap-2 p-2 bg-zinc-100 rounded-xl mb-4">
                        {results.map((r, i) => (
                            <button
                                key={r.id}
                                onClick={() => setActiveResultIndex(i)}
                                className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-all ${activeResultIndex === i ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500'}`}
                            >
                                Variante {i + 1}
                            </button>
                        ))}
                    </div>

                    {/* Preview Area */}
                    <div className="flex-1 overflow-y-auto bg-white rounded-2xl border border-zinc-100 shadow-inner p-4">
                        {results[activeResultIndex] && (
                            <>
                                <h4 className="font-black text-xl text-zinc-900 mb-2">{results[activeResultIndex].themeName}</h4>
                                <p className="text-xs text-zinc-500 mb-6">{results[activeResultIndex].description}</p>

                                {/* Iframe or Div for HTML content */}
                                <div
                                    className="menu-preview-container border-t pt-6 text-zinc-900"
                                    style={{ minHeight: '300px' }}
                                    dangerouslySetInnerHTML={{ __html: results[activeResultIndex].htmlContent }}
                                />
                            </>
                        )}
                    </div>

                    <div className="pt-4 flex gap-3">
                        <PremiumButton
                            variant="secondary"
                            fullWidth
                            onClick={() => setIsResultModalOpen(false)}
                        >
                            Cerrar
                        </PremiumButton>
                        <PremiumButton
                            variant="gradient"
                            customColor="#FFE600"
                            fullWidth
                            onClick={() => {
                                if (db && appId) makeMenuService.saveProposal(db, appId, results[activeResultIndex]);
                                setAlertConfig({
                                    isOpen: true,
                                    title: 'Menú Guardado',
                                    message: 'El diseño del menú ha sido guardado exitosamente en tu historial de Nexus.',
                                    type: 'success'
                                });
                            }}
                        >
                            Guardar
                        </PremiumButton>
                    </div>
                </div>
            </Modal>

            {/* Premium Response Modal */}
            {alertConfig && (
                <CerebrityResponseModal
                    isOpen={alertConfig.isOpen}
                    onClose={() => setAlertConfig({ ...alertConfig, isOpen: false })}
                    title={alertConfig.title}
                    message={alertConfig.message}
                    type={alertConfig.type}
                />
            )}
        </div>
    );
};

export default CerebrityMakeMenu;
