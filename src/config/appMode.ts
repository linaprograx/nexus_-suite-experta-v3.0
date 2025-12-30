/**
 * Configuration for Application Mode (Full vs Beta/Mobile)
 * @module config/appMode
 */

export type AppMode = 'full' | 'beta';

// Accessing VITE_APP_MODE. Defaulting to 'full' is handled here as a runtime fallback 
// as well as in vite.config.ts as a build-time fallback.
export const APP_MODE: AppMode = (import.meta.env.VITE_APP_MODE as AppMode) || 'full';

export const isBeta = (): boolean => APP_MODE === 'beta';
export const isFull = (): boolean => APP_MODE === 'full';

// Debug check
if (import.meta.env.DEV) {
    console.log(`[AppConfig] App Mode: ${APP_MODE}`);
}
