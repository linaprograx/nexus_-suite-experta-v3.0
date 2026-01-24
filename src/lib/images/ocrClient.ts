declare global {
    interface Window {
        Tesseract: any;
    }
}

const loadTesseract = async (): Promise<any> => {
    if (window.Tesseract) {
        return window.Tesseract;
    }

    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/tesseract.js@2.1.0/dist/tesseract.min.js';
        script.onload = () => {
            if (window.Tesseract) {
                resolve(window.Tesseract);
            } else {
                reject(new Error('Tesseract.js failed to load.'));
            }
        };
        script.onerror = () => reject(new Error('Failed to load Tesseract.js script.'));
        document.body.appendChild(script);
    });
};

/**
 * Extracts text from an image file using Tesseract.js OCR.
 * @param fileData The image file (e.g., from a file input or a Blob).
 * @returns A promise that resolves to the extracted text.
 */
export const extractTextFromImage = async (fileData: File | Blob): Promise<string> => {
    const Tesseract = await loadTesseract();
    const worker = Tesseract.createWorker({
        logger: (m: any) => console.log(m), // Optional: log progress
    });

    try {
        await worker.load();
        await worker.loadLanguage('eng+spa'); // Load English and Spanish
        await worker.initialize('eng+spa');
        const { data: { text } } = await worker.recognize(fileData);
        await worker.terminate();
        return text;
    } catch (error) {
        console.error('Error during OCR processing:', error);
        await worker.terminate();
        throw error;
    }
};
