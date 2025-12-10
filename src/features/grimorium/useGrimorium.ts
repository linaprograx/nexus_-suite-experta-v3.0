import { useState, useMemo } from 'react';
import { Recipe, Ingredient } from '../../types';
import { grimoriumService } from './grimoriumService';
import { Firestore } from 'firebase/firestore';

interface UseGrimoriumProps {
    db: Firestore;
    userId: string;
    allRecipes: Recipe[];
    allIngredients: Ingredient[];
}

export const useGrimorium = ({ db, userId, allRecipes, allIngredients }: UseGrimoriumProps) => {
    // --- State ---
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('Todas');
    const [selectedStatus, setSelectedStatus] = useState('Todas');
    const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);

    const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);

    // --- Filtering ---
    const filteredRecipes = useMemo(() => {
        // Safe check for allRecipes being defined
        const recipes = allRecipes || [];

        return recipes.filter(recipe => {
            const matchesSearch = recipe.nombre.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = selectedCategory === 'Todas' ||
                (recipe.categorias && recipe.categorias.includes(selectedCategory));
            const matchesStatus = selectedStatus === 'Todas' ||
                (recipe.categorias && recipe.categorias.includes(selectedStatus));
            return matchesSearch && matchesCategory && matchesStatus;
        });
    }, [allRecipes, searchQuery, selectedCategory, selectedStatus]);

    const stats = useMemo(() => {
        const totalRecipes = allRecipes.length;
        const totalCost = allRecipes.reduce((acc, r) => acc + (r.costoTotal || 0), 0);
        const avgMargin = totalRecipes > 0
            ? allRecipes.reduce((acc, r) => acc + (r.margen || 0), 0) / totalRecipes
            : 0;

        return { totalRecipes, totalCost, avgMargin };
    }, [allRecipes]);

    // --- Actions ---
    const handleOpenModal = (recipe: Recipe | null = null) => {
        setEditingRecipe(recipe);
        setIsRecipeModalOpen(true);
    };

    const handleCloseModal = () => {
        setEditingRecipe(null);
        setIsRecipeModalOpen(false);
    };

    const handleSaveRecipe = async (recipeData: Partial<Recipe>) => {
        try {
            if (editingRecipe) {
                await grimoriumService.updateRecipe(db, userId, editingRecipe.id, recipeData);
            } else {
                await grimoriumService.addRecipe(db, userId, recipeData);
            }
            handleCloseModal();
        } catch (error) {
            console.error("Error saving recipe:", error);
            // Optionally handle error state here
        }
    };

    const handleDeleteRecipe = async (recipeId: string) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar esta receta?')) {
            try {
                await grimoriumService.deleteRecipe(db, userId, recipeId);
                // If the deleted recipe was open/selected, clear selection logic if exists
                if (editingRecipe?.id === recipeId) {
                    handleCloseModal();
                }
            } catch (error) {
                console.error("Error deleting recipe:", error);
            }
        }
    };

    const handleDuplicateRecipe = async (recipe: Recipe) => {
        try {
            const { id, ...recipeData } = recipe;
            await grimoriumService.addRecipe(db, userId, {
                ...recipeData,
                nombre: `${recipeData.nombre} (Copia)`
            });
        } catch (error) {
            console.error("Error duplicating recipe:", error);
        }
    };

    return {
        // State
        searchQuery,
        setSearchQuery,
        selectedCategory,
        setSelectedCategory,
        selectedStatus,
        setSelectedStatus,
        isRecipeModalOpen,
        editingRecipe,

        // Data
        filteredRecipes,
        stats,

        // Actions
        handleOpenModal,
        handleCloseModal,
        handleSaveRecipe,
        handleDeleteRecipe,
        handleDuplicateRecipe // Added for convenience as it was likely in the view
    };
};
