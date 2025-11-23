import { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { recipeService } from './recipeService';
import { Recipe } from './recipeTypes';

export const useRecipes = () => {
  const { db, userId } = useApp();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecipes = useCallback(async () => {
    if (!db || !userId) return;
    setLoading(true);
    try {
      const data = await recipeService.fetchRecipes(db, userId);
      setRecipes(data);
      setError(null);
    } catch (err) {
      setError('Error al cargar recetas');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [db, userId]);

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  const addRecipe = async (recipe: Omit<Recipe, 'id'>) => {
    if (!db || !userId) return;
    try {
      const id = await recipeService.addRecipe(db, userId, recipe);
      await fetchRecipes();
      return id;
    } catch (err) {
      setError('Error al añadir receta');
      throw err;
    }
  };

  const updateRecipe = async (id: string, updates: Partial<Recipe>) => {
    if (!db || !userId) return;
    try {
      await recipeService.updateRecipe(db, userId, id, updates);
      await fetchRecipes();
    } catch (err) {
      setError('Error al actualizar receta');
      throw err;
    }
  };

  const deleteRecipe = async (id: string) => {
    if (!db || !userId) return;
    try {
      await recipeService.deleteRecipe(db, userId, id);
      setRecipes(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      setError('Error al eliminar receta');
      throw err;
    }
  };

  return {
    recipes,
    loading,
    error,
    addRecipe,
    updateRecipe,
    deleteRecipe,
    refreshRecipes: fetchRecipes
  };
};
