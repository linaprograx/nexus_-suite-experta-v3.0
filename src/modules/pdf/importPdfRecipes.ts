import { Firestore, collection, doc, addDoc } from 'firebase/firestore';
import { FirebaseStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';
import { Ingredient, Recipe, IngredientLineItem } from '../../../types';
import { extractTextFromPdf } from './pdfTextExtractor';
import { extractImagesFromPdf } from './pdfImageExtractor';
import { parsePdfRecipeBlocks } from './parsePdfRecipeBlocks';
import { parseIngredient } from '../ingredients/ingredientParser';
import { findBestMatch } from '../ingredients/ingredientMatcher';
import { calculateRecipeCost } from '../costing/costCalculator';
import { classifyIngredient } from '../ingredients/families';
import { mapImagesToRecipesOCR } from '../images/pdfImageMapper';

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
    allIngredients: Ingredient[],
    useOCR: boolean = false
): Promise<Partial<Recipe>[]> => {

    console.log(`Starting PDF import process (OCR mode: ${useOCR})...`);

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
        // Auto-creation removed per user request.

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
                // User requested: Do NOT create new ingredients for unmatched items.
                // Append note to preparation.
                const missingNote = `[Falta Ingrediente: ${parsedIngredient.nombreBase} (${parsedIngredient.cantidad} ${parsedIngredient.unidad})]`;

                if (!block.preparacion.includes(missingNote)) {
                    block.preparacion = `${missingNote}\n${block.preparacion}`;
                }
            }
        }

        let imageUrl: string | null = null;
        let imageBase64: string | null = null;

        // Page-based image matching (default)
        const pageImage = pagesImages.find(pi => pi.pageNumber === block.pageNumber);
        if (pageImage && pageImage.imageBase64) {
            imageBase64 = pageImage.imageBase64;
        }

        if (imageBase64) {
            try {
                imageUrl = await uploadImage(storage, userId, imageBase64);
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
