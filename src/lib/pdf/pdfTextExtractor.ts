// Asynchronously loads the pdf.js library from a CDN.
const loadPdfJs = async () => {
  if ((window as any).pdfjsLib) {
    return (window as any).pdfjsLib;
  }

  const script = document.createElement('script');
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js';
  document.body.appendChild(script);

  return new Promise((resolve) => {
    script.onload = () => {
      (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
      resolve((window as any).pdfjsLib);
    };
  });
};

interface PageText {
  pageNumber: number;
  text: string;
}

/**
 * Extracts text content from each page of a PDF file.
 *
 * @param file The PDF file to process.
 * @returns A promise that resolves to an array of objects, each containing the page number and its text content.
 */
export const extractTextFromPdf = async (file: File): Promise<PageText[]> => {
  const pdfjsLib = await loadPdfJs();
  const fileReader = new FileReader();

  return new Promise((resolve, reject) => {
    fileReader.onload = async (event) => {
      try {
        const typedArray = new Uint8Array(event.target?.result as ArrayBuffer);
        const pdf = await pdfjsLib.getDocument(typedArray).promise;
        const pageTexts: PageText[] = [];

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item: any) => item.str).join(' ');
          pageTexts.push({ pageNumber: i, text: pageText });
        }
        resolve(pageTexts);
      } catch (error) {
        reject(error);
      }
    };
    fileReader.onerror = reject;
    fileReader.readAsArrayBuffer(file);
  });
};
