import React, { useState, useMemo } from 'react';
import { PageName, UserProfile } from '../types';
import { Recipe } from '../../../types';
import { GrimorioHeader } from '../components/GrimorioHeader';
import { useRecipes } from '../../../hooks/useRecipes';
import { useIngredients } from '../../../hooks/useIngredients';
import { RecipeList } from '../../../components/grimorium/RecipeList';
import { useApp } from '../../../context/AppContext';
import { RecipeFormModal } from '../../../components/grimorium/RecipeFormModal';

const GrimorioRecipes: React.FC<Props> = ({ onNavigate }) => {
    const { db, userId } = useApp();
    const { recipes } = useRecipes();
    const { ingredients } = useIngredients();

    // -- STATE FOR RECIPELIST --
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [selectedRecipeIds, setSelectedRecipeIds] = useState<string[]>([]);
    const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
    const [showRecipeModal, setShowRecipeModal] = useState(false);

    // Derived
    const availableCategories = useMemo(() => {
        return Array.from(new Set(recipes.flatMap(r => r.categorias || ['General']))).sort();
    }, [recipes]);

    const selectedRecipe = useMemo(() =>
        recipes.find(r => r.id === selectedRecipeId) || null
        , [recipes, selectedRecipeId]);

    // -- DELETE LOGIC --
    const deleteRecipe = async (id: string) => {
        if (!db || !userId) return;
        try {
            await deleteDoc(doc(db, `users/${userId}/grimorio`, id));
        } catch (e) {
            console.error("Error deleting recipe", e);
        }
    };

    // -- HANDLERS --
    const handleSelectRecipe = (recipe: Recipe) => {
        setSelectedRecipeId(recipe.id);
        setShowRecipeModal(true);
    };

    const handleAddRecipe = () => {
        setSelectedRecipeId(null);
        setShowRecipeModal(true);
    };

    const handleToggleSelection = (id: string, multi?: boolean) => {
        // Basic multi-select logic
        setSelectedRecipeIds(prev => {
            if (prev.includes(id)) return prev.filter(p => p !== id);
            return [...prev, id];
        });
    };

    const handleSelectAll = (select: boolean) => {
        if (select) setSelectedRecipeIds(recipes.map(r => r.id));
        else setSelectedRecipeIds([]);
    };

    const handleDeleteSelected = async () => {
        if (confirm(`Delete ${selectedRecipeIds.length} recipes?`)) {
            for (const id of selectedRecipeIds) {
                await deleteRecipe(id);
            }
            setSelectedRecipeIds([]);
        }
    };

    return (
        <div className="bg-transparent relative overflow-hidden flex flex-col h-full text-zinc-800 dark:text-zinc-100">
            {/* FIXED GRADIENT LAYER - Removed to use Global MobileShell Gradient */}

            <div className="shrink-0 bg-transparent z-10">
                <GrimorioHeader
                    activeSection="recipes"
                    pageTitle="Recetario Maestro"
                />
            </div>

            <div className="flex-1 overflow-hidden relative z-10 w-full px-5 pb-5">
                {/* Reusing Desktop RecipeList which contains the Standard Toolbar */}
                <RecipeList
                    recipes={recipes}
                    allIngredients={ingredients}
                    // -- PROPS INJECTION --
                    selectedRecipeId={selectedRecipeId}
                    onSelectRecipe={handleSelectRecipe}
                    onAddRecipe={handleAddRecipe}
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    selectedCategory={selectedCategory}
                    onCategoryChange={setSelectedCategory}
                    availableCategories={availableCategories}
                    selectedStatus={selectedStatus}
                    onStatusChange={setSelectedStatus}
                    onDelete={() => { }} // Single delete unused usually
                    selectedRecipeIds={selectedRecipeIds}
                    onToggleSelection={handleToggleSelection}
                    onSelectAll={handleSelectAll}
                    onDeleteSelected={handleDeleteSelected}
                    onImport={() => console.log("Import not implemented on mobile")}
                    isLoading={false}
                />
            </div>

            {showRecipeModal && db && userId && (
                <RecipeFormModal
                    isOpen={showRecipeModal}
                    onClose={() => {
                        setShowRecipeModal(false);
                        setSelectedRecipeId(null);
                    }}
                    db={db}
                    userId={userId}
                    initialData={selectedRecipe}
                    allIngredients={ingredients}
                />
            )}
        </div>
    );
};

export default GrimorioRecipes;
