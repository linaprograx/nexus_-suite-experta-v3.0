import React, { useState } from 'react';
import { PageName, UserProfile } from '../types';
import { Recipe } from '../../../types';
import GlassCard from '../components/GlassCard';
import PremiumButton from '../components/PremiumButton';
import { GrimorioHeader } from '../components/GrimorioHeader';
import { useRecipes } from '../../../hooks/useRecipes';
import { useIngredients } from '../../../hooks/useIngredients';
import { useApp } from '../../../context/AppContext';
import { RecipeFormModal } from '../../../components/grimorium/RecipeFormModal';
import { RecipeBatcherModal } from '../../../components/grimorium/RecipeBatcherModal';
import { writeBatch, collection, doc } from 'firebase/firestore';

interface Props {
    onNavigate: (page: PageName) => void;
    user?: UserProfile;
}

const GrimorioRecipes: React.FC<Props> = ({ onNavigate }) => {
    const { db, userId } = useApp();
    const { recipes, isLoading } = useRecipes();
    const { ingredients: allIngredients } = useIngredients();

    const [showRecipeModal, setShowRecipeModal] = useState(false);
    const [showBatcherModal, setShowBatcherModal] = useState(false);
    const [recipeToEdit, setRecipeToEdit] = useState<Partial<Recipe> | null>(null);
    const [recipeForBatch, setRecipeForBatch] = useState<Recipe | null>(null);
    const [activeFilter, setActiveFilter] = useState<'active' | 'drafts' | 'archived'>('active');
    const [isMigrating, setIsMigrating] = useState(false);

    const FILTER_LABELS = {
        active: 'Activas',
        drafts: 'Borradores',
        archived: 'Archivadas'
    };

    const handleRecipeClick = (recipe: Recipe) => {
        setRecipeToEdit(recipe);
        setShowRecipeModal(true);
    };

    const handleNewRecipe = () => {
        setRecipeToEdit(null);
        setShowRecipeModal(true);
    };

    const handleMigrateDrafts = async () => {
        const drafts = recipes.filter(r => {
            const status = r.categorias?.find(c => ['Idea', 'En pruebas'].includes(c)) || 'Idea';
            return ['Idea', 'En pruebas'].includes(status);
        });

        if (drafts.length === 0) {
            alert('No hay borradores para migrar');
            return;
        }

        if (!window.confirm(`¿Migrar ${drafts.length} recetas a Activas?`)) return;

        if (!db || !userId) {
            alert('Error de autenticación. Reintenta en unos segundos.');
            return;
        }

        setIsMigrating(true);
        try {
            const batch = writeBatch(db);
            drafts.forEach(recipe => {
                const recipeRef = doc(db, `users/${userId}/grimorio`, recipe.id);
                // Replace 'Idea' or 'En pruebas' with 'Terminado'
                const newCategories = (recipe.categorias || []).filter(c => !['Idea', 'En pruebas'].includes(c));
                newCategories.push('Terminado');
                batch.update(recipeRef, { categorias: newCategories });
            });
            await batch.commit();
            alert('Recetas migradas correctamente');
        } catch (error) {
            console.error(error);
            alert('Error al migrar recetas: ' + (error as any).message);
        } finally {
            setIsMigrating(false);
        }
    };

    // Filter recipes based on active filter (mock data - adjust based on actual Recipe schema)
    // Filter recipes based on active filter
    const filteredRecipes = recipes.filter(r => {
        const STATUS_CATEGORIES = ['Idea', 'En pruebas', 'Terminado', 'Archivada'];
        const status = r.categorias?.find(c => STATUS_CATEGORIES.includes(c)) || 'Idea';

        if (activeFilter === 'archived') return status === 'Archivada';
        if (activeFilter === 'drafts') return ['Idea', 'En pruebas'].includes(status);
        if (activeFilter === 'active') return status === 'Terminado' || (!['Idea', 'En pruebas', 'Archivada'].includes(status)); // Terminado or other/none (fallback to active if not explicit draft/archived?) Actually better to be strict? Let's say Active is Terminado or if it has NO status but clearly exists? No, default is Idea. So Active = Terminado.
        return false;
    });

    return (
        <div className="bg-transparent relative overflow-hidden flex flex-col h-full">

            {/* Shared Grimorio Header */}
            <GrimorioHeader
                activeSection="recipes"
                pageTitle="Recetas"
            />

            {/* Status Pills */}
            <div className="px-5 pb-4">
                <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
                    {(['active', 'drafts', 'archived'] as const).map(filter => (
                        <button
                            key={filter}
                            onClick={() => setActiveFilter(filter)}
                            className={`px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest whitespace-nowrap transition-all
                                ${activeFilter === filter
                                    ? 'bg-white text-orange-600 shadow-sm'
                                    : 'bg-white/10 backdrop-blur-md border border-white/20 text-white/80'
                                }`}
                        >
                            {FILTER_LABELS[filter]}
                        </button>
                    ))}
                </div>
                {activeFilter === 'drafts' && filteredRecipes.length > 0 && (
                    <button
                        onClick={handleMigrateDrafts}
                        disabled={isMigrating}
                        className="mt-3 w-full py-2.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500/20 transition-all flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-outlined !text-sm">auto_fix_high</span>
                        {isMigrating ? 'MIGRANDO...' : 'MIGRAR TODO A ACTIVAS'}
                    </button>
                )}
            </div>

            {/* Add Button - Floating */}
            <button
                onClick={handleNewRecipe}
                className="fixed top-6 right-6 z-20 bg-white/20 backdrop-blur-2xl border border-white/30 rounded-full p-3 shadow-xl hover:bg-white/30 transition-all"
            >
                <span className="material-symbols-outlined text-white fill-1">add</span>
            </button>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto custom-scroll px-5 pb-32 space-y-4">

                {isLoading ? (
                    <div className="flex justify-center py-10">
                        <span className="material-symbols-outlined animate-spin text-orange-500">sync</span>
                    </div>
                ) : filteredRecipes.length > 0 ? filteredRecipes.map((recipe, i) => {
                    const cost = recipe.costoReceta || recipe.costoTotal || 0;
                    const margin = recipe.margen || 0;
                    const efficiency = Math.min(95, 70 + (i * 5)); // Mock efficiency data

                    return (
                        <GlassCard
                            key={recipe.id}
                            rounded="3xl"
                            padding="none"
                            className="relative group transition-all cursor-pointer active:scale-[0.98] overflow-hidden min-h-[280px]"
                            onClick={() => handleRecipeClick(recipe)}
                        >
                            {/* Large Creative Image - Top Right Quarter */}
                            {recipe.imageUrl ? (
                                <div className="absolute top-0 right-0 w-[45%] h-[40%] rounded-bl-[2.5rem] overflow-hidden z-0 shadow-sm">
                                    <img src={recipe.imageUrl} alt={recipe.nombre} className="w-full h-full object-cover" />
                                </div>
                            ) : (
                                <div className="absolute top-0 right-0 w-[45%] h-[40%] rounded-bl-[2.5rem] bg-orange-100 flex items-center justify-center text-orange-300 z-0">
                                    <span className="material-symbols-outlined text-6xl opacity-50">lunch_dining</span>
                                </div>
                            )}

                            {/* Content Wrapper */}
                            <div className="relative z-10 p-6 flex flex-col h-full justify-between">
                                {/* Header Section (Restricted Width to avoid image overlap) */}
                                <div className="w-[55%] mb-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="px-2 py-0.5 bg-orange-100/80 backdrop-blur-sm text-orange-700 rounded-md text-[8px] font-black uppercase tracking-wider">
                                            {recipe.categorias?.[0] || 'Lógica'}
                                        </span>
                                    </div>
                                    <h2 className="text-2xl font-black text-zinc-900 mb-1 uppercase tracking-tight leading-none">
                                        {recipe.nombre || 'Receta Sin Nombre'}
                                    </h2>
                                    <p className="text-[10px] text-zinc-500 font-medium leading-tight">
                                        {recipe.storytelling?.slice(0, 50) || 'Receta clásica con ingredientes premium'}...
                                    </p>
                                </div>

                                {/* Bottom Section (Full Width) */}
                                <div className="mt-auto pt-4">
                                    {/* Efficiency Bar */}
                                    <div className="mb-4">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Eficiencia</span>
                                            <span className="text-xs font-black text-orange-600">{efficiency}%</span>
                                        </div>
                                        <div className="w-full bg-zinc-100 rounded-full h-1.5 overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-orange-500 to-orange-600 rounded-full transition-all"
                                                style={{ width: `${efficiency}%` }}
                                            ></div>
                                        </div>
                                    </div>

                                    {/* Metrics */}
                                    <div className="grid grid-cols-3 gap-2 mb-4">
                                        <div>
                                            <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider mb-0.5">Costo</p>
                                            <p className="text-sm font-black text-zinc-900">${cost > 0 ? cost.toFixed(2) : '0.00'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider mb-0.5">Margen</p>
                                            <p className="text-sm font-black text-emerald-600">{margin > 0 ? `${margin}%` : '0%'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider mb-0.5">Tiempo</p>
                                            <p className="text-sm font-black text-zinc-900">~{recipe.preparacion ? '10m' : '5m'}</p>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleRecipeClick(recipe); }}
                                            className="flex-[0.4] py-3 rounded-xl text-[10px] font-bold text-zinc-600 bg-zinc-100 border border-zinc-200 uppercase tracking-wider hover:bg-zinc-200 transition-colors"
                                        >
                                            Editar
                                        </button>
                                        <PremiumButton
                                            module="grimorioRecipes"
                                            variant="gradient"
                                            size="sm"
                                            icon={<span className="material-symbols-outlined !text-sm">bolt</span>}
                                            iconPosition="right"
                                            className="flex-1 !py-3 !text-[10px]"
                                            onClick={() => {
                                                setRecipeForBatch(recipe);
                                                setShowBatcherModal(true);
                                            }}
                                        >
                                            EJECUTAR LOTE
                                        </PremiumButton>
                                    </div>
                                </div>
                            </div>
                        </GlassCard>
                    );
                }) : (
                    <GlassCard rounded="3xl" padding="xl" className="text-center">
                        <span className="material-symbols-outlined text-6xl text-orange-300 mb-3 block">book_2</span>
                        <h3 className="text-lg font-bold text-zinc-900 mb-2">No hay recetas</h3>
                        <p className="text-sm text-zinc-500 mb-5">Comienza creando tu primera receta</p>
                        <PremiumButton
                            module="grimorioRecipes"
                            variant="gradient"
                            size="md"
                            onClick={handleNewRecipe}
                        >
                            CREAR RECETA
                        </PremiumButton>
                    </GlassCard>
                )}
            </main>

            {/* Recipe Modal */}
            {showRecipeModal && db && userId && (
                <RecipeFormModal
                    isOpen={showRecipeModal}
                    onClose={() => {
                        setShowRecipeModal(false);
                        setRecipeToEdit(null);
                    }}
                    initialData={recipeToEdit}
                    db={db}
                    userId={userId}
                    allIngredients={allIngredients}
                />
            )}

            {showBatcherModal && recipeForBatch && (
                <RecipeBatcherModal
                    isOpen={showBatcherModal}
                    onClose={() => {
                        setShowBatcherModal(false);
                        setRecipeForBatch(null);
                    }}
                    recipe={recipeForBatch}
                />
            )}
        </div>
    );
};

export default GrimorioRecipes;
