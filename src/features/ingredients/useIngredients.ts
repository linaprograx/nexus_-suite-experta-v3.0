import { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { ingredientsService } from './ingredientsService';
import { Ingredient } from './ingredientsTypes';

export const useIngredients = () => {
  const { db, userId } = useApp();
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIngredients = useCallback(async () => {
    if (!db || !userId) return;
    setLoading(true);
    try {
      const data = await ingredientsService.fetchIngredients(db, userId);
      setIngredients(data);
      setError(null);
    } catch (err) {
      setError('Error al cargar ingredientes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [db, userId]);

  useEffect(() => {
    fetchIngredients();
  }, [fetchIngredients]);

  const addIngredient = async (ingredient: Omit<Ingredient, 'id'>) => {
    if (!db || !userId) return;
    try {
      const id = await ingredientsService.addIngredient(db, userId, ingredient);
      // Optimistic update or refetch
      // For simplicity, let's refetch or manually add to state. 
      // Ideally standardPrice is calculated in backend/service, so if we add manually we need to calculate it too.
      // But service returns ID.
      // Let's refetch for consistency.
      await fetchIngredients();
      return id;
    } catch (err) {
      setError('Error al añadir ingrediente');
      throw err;
    }
  };

  const updateIngredient = async (id: string, updates: Partial<Ingredient>) => {
    if (!db || !userId) return;
    try {
      await ingredientsService.updateIngredient(db, userId, id, updates);
      await fetchIngredients();
    } catch (err) {
      setError('Error al actualizar ingrediente');
      throw err;
    }
  };

  const deleteIngredient = async (id: string) => {
    if (!db || !userId) return;
    try {
      await ingredientsService.deleteIngredient(db, userId, id);
      setIngredients(prev => prev.filter(ing => ing.id !== id));
    } catch (err) {
      setError('Error al eliminar ingrediente');
      throw err;
    }
  };

  return {
    ingredients,
    loading,
    error,
    addIngredient,
    updateIngredient,
    deleteIngredient,
    refreshIngredients: fetchIngredients
  };
};
