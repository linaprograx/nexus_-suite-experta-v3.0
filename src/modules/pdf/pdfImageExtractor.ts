// This function assumes pdf.js is loaded globally by another module (e.g., pdfTextExtractor)
const getPdfJs = () => {
  if (!(window as any).pdfjsLib) {
    throw new Error("pdf.js is not loaded. Make sure to load it before calling this function.");
  }
  return (window as any).pdfjsLib;
};

interface PageImage {
  pageNumber: number;
  imageBase64: string | null;
}

const MAX_WIDTH = 1200; // Max width for the rendered image

/**
 * Extracts an image from each page of a PDF file.
 * It renders the page onto a canvas and converts it to a JPG base64 string.
 *
 * @param file The PDF file to process.
 * @returns A promise that resolves to an array of objects, each containing the page number and its image as a base64 string.
 */
export const extractImagesFromPdf = async (file: File): Promise<PageImage[]> => {
  const pdfjsLib = getPdfJs();
  const fileReader = new FileReader();

  return new Promise((resolve, reject) => {
    fileReader.onload = async (event) => {
      try {
        const typedArray = new Uint8Array(event.target?.result as ArrayBuffer);
        const pdf = await pdfjsLib.getDocument(typedArray).promise;
        const pageImages: PageImage[] = [];
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        if (!context) {
          return reject(new Error("Could not get canvas context."));
        }

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 1.5 });
          
          const scale = MAX_WIDTH / viewport.width;
          const scaledViewport = page.getViewport({ scale: viewport.scale * scale });
          
          canvas.height = scaledViewport.height;
          canvas.width = scaledViewport.width;

          await page.render({ canvasContext: context, viewport: scaledViewport }).promise;
          
          // Check if canvas is mostly blank to avoid saving empty images
          const pixelData = context.getImageData(0, 0, canvas.width, canvas.height).data;
          const isBlank = pixelData.every(channel => channel === 255);

          if (isBlank) {
            pageImages.push({ pageNumber: i, imageBase64: null });
          } else {
            pageImages.push({ pageNumber: i, imageBase64: canvas.toDataURL('image/jpeg', 0.85) });
          }
        }
        
        canvas.remove(); // Clean up the canvas element
        resolve(pageImages);

      } catch (error) {
        reject(error);
      }
    };
    fileReader.onerror = reject;
    fileReader.readAsArrayBuffer(file);
  });
};
