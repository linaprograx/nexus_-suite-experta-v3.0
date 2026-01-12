import React, { useState } from 'react';
import { PageName, UserProfile } from '../types';
import { Recipe } from '../../../types';
import GlassCard from '../components/GlassCard';
import PremiumButton from '../components/PremiumButton';
import { useRecipes } from '../../../hooks/useRecipes';
import { useIngredients } from '../../../hooks/useIngredients';
import { useApp } from '../../../context/AppContext';
import { RecipeFormModal } from '../../../components/grimorium/RecipeFormModal';

interface Props {
    onNavigate: (page: PageName) => void;
    user?: UserProfile;
}

const GrimorioRecipes: React.FC<Props> = ({ onNavigate }) => {
    const { db, userId } = useApp();
    const { recipes, isLoading } = useRecipes();
    const { ingredients: allIngredients } = useIngredients();

    const [showRecipeModal, setShowRecipeModal] = useState(false);
    const [recipeToEdit, setRecipeToEdit] = useState<Partial<Recipe> | null>(null);
    const [activeSection, setActiveSection] = useState<'recipes' | 'logic' | 'inventory'>('recipes');
    const [activeFilter, setActiveFilter] = useState<'active' | 'drafts' | 'archived'>('active');

    const SECTION_LABELS = {
        recipes: 'Recetas',
        logic: 'Lógica',
        inventory: 'Inventario'
    };

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

    // Filter recipes based on active filter (mock data - adjust based on actual Recipe schema)
    const filteredRecipes = recipes.filter(r => {
        // Add filtering logic based on your Recipe schema
        return true; // For now, show all
    });

    return (
        <div className="bg-transparent relative overflow-hidden flex flex-col h-full">

            {/* Header */}
            <header className="pt-4 pb-4 px-5 z-10 relative">
                <div className="flex justify-between items-center mb-6 px-2">
                    <h1 className="text-6xl font-black text-white italic tracking-tighter leading-[0.9]" style={{ fontFamily: 'Georgia, serif' }}>
                        Grimorio
                    </h1>
                    <div
                        className="bg-white/20 backdrop-blur-2xl border border-white/30 rounded-full p-3 shadow-xl cursor-pointer hover:bg-white/30 transition-all"
                        onClick={handleNewRecipe}
                    >
                        <span className="material-symbols-outlined text-white fill-1">add</span>
                    </div>
                </div>

                {/* Tab Pills */}
                <div className="flex gap-2 mb-5 overflow-x-auto scrollbar-hide">
                    <button
                        onClick={() => setActiveSection('recipes')}
                        className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-md whitespace-nowrap transition-all ${activeSection === 'recipes'
                                ? 'bg-white text-orange-600'
                                : 'bg-white/20 backdrop-blur-md border border-white/30 text-white hover:bg-white/30'
                            }`}
                    >
                        Recetas
                    </button>
                    <button
                        onClick={() => setActiveSection('logic')}
                        className={`px-5 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all ${activeSection === 'logic'
                                ? 'bg-white text-orange-600 shadow-md'
                                : 'bg-white/20 backdrop-blur-md border border-white/30 text-white hover:bg-white/30'
                            }`}
                    >
                        Lógica
                    </button>
                    <button
                        onClick={() => {
                            setActiveSection('inventory');
                            onNavigate(PageName.GrimorioStock);
                        }}
                        className={`px-5 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all ${activeSection === 'inventory'
                                ? 'bg-white text-orange-600 shadow-md'
                                : 'bg-white/20 backdrop-blur-md border border-white/30 text-white hover:bg-white/30'
                            }`}
                    >
                        Inventario
                    </button>
                </div>

                {/* Status Pills */}
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
            </header>

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
                            padding="md"
                            className="relative group transition-all cursor-pointer active:scale-[0.98]"
                            onClick={() => handleRecipeClick(recipe)}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-md text-[8px] font-black uppercase tracking-wider">
                                            Lógica
                                        </span>
                                    </div>
                                    <h2 className="text-2xl font-black text-zinc-900 mb-1 uppercase tracking-tight">{recipe.nombre || 'Receta Sin Nombre'}</h2>
                                    <p className="text-xs text-zinc-500 font-medium">Receta clásica con ingredientes premium</p>
                                </div>
                                <div className="w-14 h-14 rounded-2xl bg-orange-500 flex items-center justify-center text-white shadow-xl">
                                    <span className="material-symbols-outlined text-2xl fill-1">science</span>
                                </div>
                            </div>

                            {/* Efficiency Bar */}
                            <div className="mb-4">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Eficiencia</span>
                                    <span className="text-xs font-black text-orange-600">{efficiency}%</span>
                                </div>
                                <div className="w-full bg-zinc-100 rounded-full h-2 overflow-hidden">
                                    <div
                                        className="h-2 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full transition-all"
                                        style={{ width: `${efficiency}%` }}
                                    ></div>
                                </div>
                            </div>

                            {/* Metrics */}
                            <div className="grid grid-cols-3 gap-4 mb-4">
                                <div>
                                    <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Costo</p>
                                    <p className="text-sm font-black text-zinc-900">${cost > 0 ? cost.toFixed(2) : '1.40'}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Margen</p>
                                    <p className="text-sm font-black text-emerald-600">{margin > 0 ? `${margin}%` : '0%'}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Tiempo</p>
                                    <p className="text-sm font-black text-zinc-900">~5m</p>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2">
                                <button className="flex-[0.4] py-3.5 rounded-2xl text-[10px] font-black text-zinc-500 bg-zinc-100 border border-zinc-200 uppercase tracking-wider hover:bg-zinc-200 transition-colors">
                                    Editar
                                </button>
                                <PremiumButton
                                    module="grimorioRecipes"
                                    variant="gradient"
                                    size="md"
                                    icon={<span className="material-symbols-outlined !text-sm">bolt</span>}
                                    iconPosition="right"
                                    className="flex-1"
                                >
                                    EJECUTAR LOTE
                                </PremiumButton>
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
                    recipeToEdit={recipeToEdit}
                    db={db}
                    userId={userId}
                    allIngredients={allIngredients}
                />
            )}
        </div>
    );
};

export default GrimorioRecipes;
