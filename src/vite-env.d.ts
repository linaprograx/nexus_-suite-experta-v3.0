/// <reference types="vite/client" />

/**
 * Vite Environment Variables Type Definitions
 * Provides autocomplete and type safety for import.meta.env
 */

interface ImportMetaEnv {
    // Firebase
    readonly VITE_FIREBASE_API_KEY: string;
    readonly VITE_FIREBASE_AUTH_DOMAIN: string;
    readonly VITE_FIREBASE_PROJECT_ID: string;
    readonly VITE_FIREBASE_STORAGE_BUCKET: string;
    readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string;
    readonly VITE_FIREBASE_APP_ID: string;

    // AI Services
    readonly VITE_AI_GATEWAY_URL: string;
    readonly VITE_GEMINI_API_KEY?: string; // Optional, for legacy image generation

    // Monitoring
    readonly VITE_SENTRY_DSN?: string;
    readonly VITE_SENTRY_DEBUG?: string;

    // Standard Vite vars
    readonly DEV: boolean;
    readonly PROD: boolean;
    readonly MODE: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
