/**
 * Environment Variable Validation
 * 
 * Validates that all required environment variables are present on app startup.
 * Fails fast with clear error messages rather than cryptic runtime failures.
 */

const requiredEnvVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_AI_GATEWAY_URL',
] as const;

const optionalEnvVars = [
    'VITE_GEMINI_API_KEY', // For legacy image generation
    'VITE_SENTRY_DSN', // Error tracking
] as const;

export const validateEnvironment = () => {
    const missing = requiredEnvVars.filter(key => !import.meta.env[key]);

    if (missing.length > 0) {
        const errorMessage = `
╔════════════════════════════════════════════════════════════╗
║  NEXUS SUITE - MISSING ENVIRONMENT VARIABLES               ║
╚════════════════════════════════════════════════════════════╝

The following REQUIRED environment variables are missing:

${missing.map(v => `  ❌ ${v}`).join('\n')}

Please ensure your .env file exists and contains all required values.

📄 Reference: .env.example

For local development, copy .env.example to .env and fill in the values.
For production, set these in your hosting platform's environment settings.
    `.trim();

        throw new Error(errorMessage);
    }

    // Warn about optional but recommended vars
    const missingOptional = optionalEnvVars.filter(key => !import.meta.env[key]);
    if (missingOptional.length > 0 && import.meta.env.DEV) {
        console.warn(
            '⚠️ Optional environment variables missing:\n' +
            missingOptional.map(v => `  - ${v}`).join('\n')
        );
    }

    // Success
    if (import.meta.env.DEV) {
        console.log('✅ Environment validation passed');
    }
};
