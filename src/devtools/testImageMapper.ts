import { createImageMap } from '../modules/images/imageNameResolver';
import { Recipe } from '../../types';

const mockRecipes: Partial<Recipe>[] = [
    { nombre: 'Cacao – Milk Punch de Maracuyá' },
    { nombre: 'Daiquiri Clásico' },
];

const mockOcrResults = [
    { ocrText: 'Cacao-Milk Punch\nDE MARACUYA', imagePath: 'path/to/image1.jpg' },
    { ocrText: 'Classic Daiquiri', imagePath: 'path/to/image2.jpg' },
    { ocrText: 'Old Fashioned', imagePath: 'path/to/image3.jpg' },
];

export const runImageMapperTest = () => {
    console.log("--- INICIANDO TEST DE IMAGE MAPPER ---");
    console.log("Recetas de entrada:", mockRecipes.map(r => r.nombre));
    console.log("Resultados de OCR de entrada:", mockOcrResults.map(o => o.ocrText));

    try {
        const imageMap = createImageMap(mockRecipes, mockOcrResults);

        console.log("\n--- RESULTADO DEL MAPEADO ---");
        if (imageMap.size > 0) {
            imageMap.forEach((imagePath, recipeName) => {
                console.log(`Receta: "${recipeName}" -> Imagen: "${imagePath}"`);
            });
        } else {
            console.warn("No se pudo mapear ninguna imagen.");
        }
    } catch (error) {
        console.error("Ha ocurrido un error durante el test:", error);
    } finally {
        console.log("\n--- TEST DE IMAGE MAPPER FINALIZADO ---");
    }
};

if (process.env.NODE_ENV === 'development') {
    (window as any).runImageMapperTest = runImageMapperTest;
}
