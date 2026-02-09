/**
 * Firebase Configuration
 * 
 * SECURITY: All credentials loaded from environment variables.
 * Never hardcode API keys in source code.
 */

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
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
