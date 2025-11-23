import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where,
  serverTimestamp,
  Firestore
} from 'firebase/firestore';
import { Ingredient } from './ingredientsTypes';
import { calculateIngredientPrice } from '../../utils/costCalculator';

const COLLECTION_NAME = 'ingredients';

export const ingredientsService = {
  async fetchIngredients(db: Firestore, userId: string): Promise<Ingredient[]> {
    try {
      if (!userId) throw new Error('User ID is required');
      
      const q = query(collection(db, COLLECTION_NAME), where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Ingredient));
    } catch (error) {
      console.error('Error fetching ingredients:', error);
      throw error;
    }
  },

  async addIngredient(db: Firestore, userId: string, ingredientData: Omit<Ingredient, 'id'>): Promise<string> {
    try {
      if (!userId) throw new Error('User ID is required');

      // Calculate standardPrice before saving
      const standardPrice = calculateIngredientPrice(
        ingredientData.precioCompra,
        ingredientData.standardQuantity,
        ingredientData.wastePercentage || 0
      );

      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...ingredientData,
        standardPrice,
        userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding ingredient:', error);
      throw error;
    }
  },

  async updateIngredient(db: Firestore, userId: string, ingredientId: string, updates: Partial<Ingredient>): Promise<void> {
    try {
      if (!userId) throw new Error('User ID is required');

      const ingredientRef = doc(db, COLLECTION_NAME, ingredientId);
      
      // If price related fields are updated, recalculate standardPrice
      let finalUpdates = { ...updates };
      
      if (
        updates.precioCompra !== undefined || 
        updates.standardQuantity !== undefined || 
        updates.wastePercentage !== undefined
      ) {
         if (
           updates.precioCompra !== undefined && 
           updates.standardQuantity !== undefined
         ) {
           const standardPrice = calculateIngredientPrice(
             updates.precioCompra,
             updates.standardQuantity,
             updates.wastePercentage || 0
           );
           finalUpdates.standardPrice = standardPrice;
         }
      }

      await updateDoc(ingredientRef, {
        ...finalUpdates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating ingredient:', error);
      throw error;
    }
  },

  async deleteIngredient(db: Firestore, userId: string, ingredientId: string): Promise<void> {
    try {
        if (!userId) throw new Error('User ID is required');
        await deleteDoc(doc(db, COLLECTION_NAME, ingredientId));
    } catch (error) {
      console.error('Error deleting ingredient:', error);
      throw error;
    }
  }
};
