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
import { Recipe } from './recipeTypes';

export const recipeService = {
  async fetchRecipes(db: Firestore, userId: string): Promise<Recipe[]> {
    try {
      if (!userId) throw new Error('User ID is required');
      
      const q = query(collection(db, `users/${userId}/grimorio`));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Recipe));
    } catch (error) {
      console.error('Error fetching recipes:', error);
      throw error;
    }
  },

  async addRecipe(db: Firestore, userId: string, recipeData: Omit<Recipe, 'id'>): Promise<string> {
    try {
      if (!userId) throw new Error('User ID is required');

      const docRef = await addDoc(collection(db, `users/${userId}/grimorio`), {
        ...recipeData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding recipe:', error);
      throw error;
    }
  },

  async updateRecipe(db: Firestore, userId: string, recipeId: string, updates: Partial<Recipe>): Promise<void> {
    try {
      if (!userId) throw new Error('User ID is required');

      const recipeRef = doc(db, `users/${userId}/grimorio`, recipeId);
      
      await updateDoc(recipeRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating recipe:', error);
      throw error;
    }
  },

  async deleteRecipe(db: Firestore, userId: string, recipeId: string): Promise<void> {
    try {
        if (!userId) throw new Error('User ID is required');
        await deleteDoc(doc(db, `users/${userId}/grimorio`, recipeId));
    } catch (error) {
      console.error('Error deleting recipe:', error);
      throw error;
    }
  }
};
