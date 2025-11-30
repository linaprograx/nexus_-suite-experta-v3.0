import { extractTextFromImage } from './ocrClient';
import { createImageMap } from './imageNameResolver';
import { Recipe } from '../../../types';

interface PageImage {
    pageNumber: number;
    imageBase64: string | null;
}

/**
 * Creates a Blob from a base64 data URL.
 */
const dataURLtoBlob = (dataurl: string): Blob => {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], {type:mime});
}

/**
 * Processes PDF images with OCR and maps them to recipes.
 * @param pdfImages An array of images extracted from the PDF.
 * @param recipes An array of recipes parsed from the PDF text.
 * @returns A promise that resolves to a Map where keys are recipe names and values are image URLs.
 */
export const mapImagesToRecipesOCR = async (
    pdfImages: PageImage[],
    recipes: Partial<Recipe>[],
): Promise<Map<string, string>> => {
    
    const ocrPromises = pdfImages
        .filter(img => img.imageBase64)
        .map(async (img) => {
            try {
                const blob = dataURLtoBlob(img.imageBase64!);
                const text = await extractTextFromImage(blob);
                return { ocrText: text, imagePath: img.imageBase64! };
            } catch (error) {
                console.error(`OCR failed for page ${img.pageNumber}:`, error);
                return null;
            }
        });

    const ocrResults = (await Promise.all(ocrPromises)).filter(Boolean) as { ocrText: string, imagePath: string }[];

    return createImageMap(recipes, ocrResults);
};
