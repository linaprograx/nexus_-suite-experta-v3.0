/**
 * Firebase Configuration
 * 
 * SECURITY: All credentials loaded from environment variables.
 * Never hardcode API keys in source code.
 */

/**
 * Se recorta el espacio en blanco de cada valor.
 *
 * No es cosmética: `appId` no solo identifica la app, además forma parte de
 * rutas de Firestore (`artifacts/${appId}/users/...`). Un salto de línea al
 * pegar la variable en el panel de despliegue se cuela dentro de la ruta y
 * apunta a una colección que no existe. Firestore no da error —una colección
 * inexistente es simplemente una colección vacía—, así que el fallo se
 * manifiesta como "no hay datos" en Mercado, en el catálogo y en el selector de
 * ingredientes, mientras las colecciones que no usan `appId` (recetas, compras)
 * siguen funcionando. Ocurrió en producción y costó tres diagnósticos.
 */
const limpio = (valor: unknown): string => String(valor ?? '').trim();

export const firebaseConfig = {
  apiKey: limpio(import.meta.env.VITE_FIREBASE_API_KEY),
  authDomain: limpio(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN),
  projectId: limpio(import.meta.env.VITE_FIREBASE_PROJECT_ID),
  storageBucket: limpio(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: limpio(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID),
  appId: limpio(import.meta.env.VITE_FIREBASE_APP_ID)
};

// Validation: Fail fast on startup if critical config missing
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  throw new Error(
    'CRITICAL: Firebase configuration incomplete.\n\n' +
    'Required environment variables:\n' +
    '- VITE_FIREBASE_API_KEY\n' +
    '- VITE_FIREBASE_AUTH_DOMAIN\n' +
    '- VITE_FIREBASE_PROJECT_ID\n' +
    '- VITE_FIREBASE_STORAGE_BUCKET\n' +
    '- VITE_FIREBASE_MESSAGING_SENDER_ID\n' +
    '- VITE_FIREBASE_APP_ID\n\n' +
    'Please check your .env file matches .env.example'
  );
}
