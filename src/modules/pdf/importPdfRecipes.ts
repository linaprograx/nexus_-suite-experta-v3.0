import { Firestore, collection, doc, addDoc } from 'firebase/firestore';
import { FirebaseStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';
import { Ingredient, Recipe, IngredientLineItem } from '../../../types';
import { extractTextFromPdf } from './pdfTextExtractor';
import { extractImagesFromPdf } from './pdfImageExtractor';
import { parsePdfRecipeBlocks } from './parsePdfRecipeBlocks';
import { parseIngredient } from '../ingredients/ingredientParser';
import { findBestMatch } from '../ingredients/ingredientMatcher';
import { calculateRecipeCost } from '../costing/costCalculator';

const uploadImage = async (storage: FirebaseStorage, userId: string, imageBase64: string): Promise<string> => {
    const storageRef = ref(storage, `users/${userId}/recipe_images/${Date.now()}-${Math.random()}.jpg`);
    const snapshot = await uploadString(storageRef, imageBase64, 'data_url');
    return getDownloadURL(snapshot.ref);
};

export const importPdfRecipes = async (
    file: File,
    db: Firestore,
    storage: FirebaseStorage,
    userId: string,
    allIngredients: Ingredient[]
): Promise<Partial<Recipe>[]> => {

    console.log("Starting PDF import process with PRO ingredient matching...");

    const [pagesText, pagesImages] = await Promise.all([
        extractTextFromPdf(file),
        extractImagesFromPdf(file)
    ]);

    const parsedBlocks = pagesText.flatMap(pt => parsePdfRecipeBlocks(pt.text, pt.pageNumber));

    if (parsedBlocks.length === 0) {
        alert("No se encontraron recetas con el formato [Nombre] en el PDF.");
        return [];
    }

    const finalRecipes: Partial<Recipe>[] = [];
    let currentIngredients = [...allIngredients];
    
    for (const block of parsedBlocks) {
        const ingredientLines = block.ingredientesTexto.split('\n').filter(line => line.trim());
        const lineItems: IngredientLineItem[] = [];
        const ingredientsToCreate: Omit<Ingredient, 'id'>[] = [];
        const newIngredientsCache = new Map<string, Omit<Ingredient, 'id'>>();

        for (const line of ingredientLines) {
            const parsedIngredient = parseIngredient(line);
            const bestMatch = findBestMatch(parsedIngredient, currentIngredients);

            if (bestMatch) {
                lineItems.push({
                    ingredientId: bestMatch.id,
                    nombre: bestMatch.nombre,
                    cantidad: parsedIngredient.cantidad,
                    unidad: parsedIngredient.unidad,
                });
            } else {
                 lineItems.push({
                    ingredientId: null, // Placeholder
                    nombre: parsedIngredient.nombreBase,
                    cantidad: parsedIngredient.cantidad,
                    unidad: parsedIngredient.unidad,
                });
                
                if (!newIngredientsCache.has(parsedIngredient.nombreBase.toLowerCase())) {
                    const newIngredient: Omit<Ingredient, 'id'> = {
                        nombre: parsedIngredient.nombreBase,
                        categoria: 'Importado',
                        precioCompra: 0,
                        unidadCompra: parsedIngredient.unidad,
                        standardUnit: parsedIngredient.unidad as any,
                        standardQuantity: 1,
                        standardPrice: 0,
                    };
                    ingredientsToCreate.push(newIngredient);
                    newIngredientsCache.set(parsedIngredient.nombreBase.toLowerCase(), newIngredient);
                }
            }
        }

        if (ingredientsToCreate.length > 0) {
            const ingredientsCol = collection(db, `users/${userId}/grimorio-ingredients`);
            for (const newIng of ingredientsToCreate) {
                const docRef = await addDoc(ingredientsCol, newIng);
                const createdIngredient = { ...newIng, id: docRef.id };
                currentIngredients.push(createdIngredient);
                
                lineItems.forEach(item => {
                    if (item.nombre.toLowerCase() === createdIngredient.nombre.toLowerCase() && item.ingredientId === null) {
                        item.ingredientId = createdIngredient.id;
                    }
                });
            }
        }

        let imageUrl: string | null = null;
        const pageImage = pagesImages.find(pi => pi.pageNumber === block.pageNumber);
        if (pageImage && pageImage.imageBase64) {
            try {
                imageUrl = await uploadImage(storage, userId, pageImage.imageBase64);
            } catch (error) {
                console.error(`Failed to upload image for recipe "${block.nombre}":`, error);
            }
        }
        
        const finalRecipe: Partial<Recipe> = {
            nombre: block.nombre,
            categorias: block.categorias,
            ingredientes: lineItems,
            ingredientesTexto: block.ingredientesTexto,
            preparacion: block.preparacion,
            garnish: block.garnish,
            storytelling: block.storytelling,
            imageUrl,
        };

        // Auto-calculate cost upon import
        const { costoTotal } = calculateRecipeCost(finalRecipe, currentIngredients);
        finalRecipe.costoReceta = costoTotal;

        finalRecipes.push(finalRecipe);
    }

    console.log(`PDF processing complete. ${finalRecipes.length} recipes ready.`);
    return finalRecipes;
};
