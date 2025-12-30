/**
 * FontLoader.ts
 * Manages dynamic loading of fonts from Google Fonts and other sources.
 */

// We can use the Google Fonts API to construct URLs.
// For now, we'll manually construct correct CSS links.

export interface FontDefinition {
    family: string;
    category: 'sans-serif' | 'serif' | 'display' | 'handwriting' | 'monospace';
    weights: number[];
    source: 'google' | 'custom';
    url?: string; // If custom
}

const LOADED_FONTS = new Set<string>();

export const FontLoader = {
    /**
     * Loads a font family if it hasn't been loaded yet.
     */
    loadFont: (font: FontDefinition): Promise<void> => {
        if (LOADED_FONTS.has(font.family)) {
            return Promise.resolve();
        }

        return new Promise((resolve, reject) => {
            let href = '';

            if (font.source === 'google') {
                const weights = font.weights.join(';');
                // Example: https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap
                const familyName = font.family.replace(/ /g, '+');
                href = `https://fonts.googleapis.com/css2?family=${familyName}:wght@${weights}&display=swap`;
            } else if (font.source === 'custom' && font.url) {
                href = font.url;
            } else {
                resolve(); // Basic system font
                return;
            }

            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = href;
            link.onload = () => {
                LOADED_FONTS.add(font.family);
                // Force a check document fonts (optional, but good for canvas)
                document.fonts.ready.then(() => resolve());
            };
            link.onerror = () => {
                console.warn(`Failed to load font: ${font.family}`);
                // Resolve anyway to not block UI, but font won't show
                resolve();
            };
            document.head.appendChild(link);
        });
    },

    /**
     * Checks if a font is currently available in the document.
     */
    isFontAvailable: (family: string): boolean => {
        return document.fonts.check(`12px "${family}"`);
    }
};
