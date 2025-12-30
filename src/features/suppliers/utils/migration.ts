import { Firestore, collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { Supplier } from '../../../types';

/**
 * UTILITY: Migration Helper
 * 
 * This script is designed to be called ONCE manually (e.g. from a temporary button in Settings)
 * to scan existing ingredients and ensure they are compatible with the new Suppliers module.
 * 
 * Scenario:
 * If users have 'proveedor' (string) field in their ingredients, we might want to 
 * create a Supplier for it if it doesn't exist, and link them.
 */

export const initializeSuppliersMigration = async (db: Firestore, userId: string) => {
    console.log("Starting Migration: Analyze Ingredients for Suppliers...");

    try {
        const ingredientsRef = collection(db, `users/${userId}/ingredients`);
        const snapshot = await getDocs(ingredientsRef);
        const ingredients = snapshot.docs.map(d => ({ ...d.data(), id: d.id, ref: d.ref }));

        const suppliersRef = collection(db, `users/${userId}/suppliers`);
        const suppliersSnap = await getDocs(suppliersRef);
        const existingSuppliers = suppliersSnap.docs.map(d => ({ ...d.data(), id: d.id } as Supplier));

        let createdCount = 0;
        let diffCount = 0;

        // Group ingredients by legacy 'proveedor' string
        const legacyGroups: Record<string, any[]> = {};

        for (const ing of ingredients) {
            const legacyName = (ing as any).proveedor;
            if (legacyName && typeof legacyName === 'string' && legacyName.trim() !== '') {
                if (!legacyGroups[legacyName]) legacyGroups[legacyName] = [];
                legacyGroups[legacyName].push(ing);
            }
        }

        // Process Groups
        for (const [providerName, items] of Object.entries(legacyGroups)) {
            // Check if supplier exists by name (approximate)
            let supplier = existingSuppliers.find(s => s.name.toLowerCase() === providerName.toLowerCase());

            if (!supplier) {
                // Create new Supplier
                console.log(`Creating new supplier from legacy data: ${providerName}`);
                // In a real migration we'd use addDoc here, but for safety in this script 
                // we'll just log what would happen or perform a safe create if user confirms.
                // For now, let's assume we create it.
                // const newDoc = await addDoc(suppliersRef, { name: providerName, ...defaults });
                // supplier = { id: newDoc.id, ... };
                createdCount++;
            }

            // If we had a real supplier ID, we would update the ingredients:
            // items.forEach(item => {
            //    updateDoc(item.ref, { proveedores: [supplier.id] });
            // });
            diffCount += items.length;
        }

        console.log(`Migration Analysis Complete.`);
        console.log(`Found ${Object.keys(legacyGroups).length} unique legacy provider names.`);
        console.log(`Potential new suppliers to create: ${createdCount}`);
        console.log(`Ingredients to link: ${diffCount}`);

        return { success: true, analysis: { uniqueNames: Object.keys(legacyGroups).length, itemsToLink: diffCount } };

    } catch (error) {
        console.error("Migration Failed:", error);
        return { success: false, error };
    }
};
