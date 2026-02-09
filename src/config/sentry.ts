import * as Sentry from "@sentry/react";

/**
 * Initialize Sentry for error tracking and monitoring
 * 
 * IMPORTANT: Set VITE_SENTRY_DSN in your environment variables
 * Get your DSN from: https://sentry.io/settings/projects/
 */

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
const IS_PRODUCTION = import.meta.env.PROD;

if (SENTRY_DSN) {
    Sentry.init({
        dsn: SENTRY_DSN,

        // Set environment
        environment: IS_PRODUCTION ? 'production' : 'development',

        // Performance Monitoring
        integrations: [
            Sentry.browserTracingIntegration(),
            Sentry.replayIntegration({
                maskAllText: false,
                blockAllMedia: false,
            }),
        ],

        // Performance traces sample rate
        // 1.0 = 100% of transactions for performance monitoring
        // Lower in production to reduce quota usage
        tracesSampleRate: IS_PRODUCTION ? 0.1 : 1.0,

        // Session Replay sample rate
        // 0.1 = 10% of sessions will be recorded
        replaysSessionSampleRate: 0.1,

        // Replay on error sample rate
        // 1.0 = 100% of sessions with errors will be recorded
        replaysOnErrorSampleRate: 1.0,

        // Ignore specific errors
        ignoreErrors: [
            // Browser extensions
            'top.GLOBALS',
            // Random plugins/extensions
            'originalCreateNotification',
            'canvas.contentDocument',
            'MyApp_RemoveAllHighlights',
            // Facebook
            'fb_xd_fragment',
            // Network errors
            'NetworkError',
            'Non-Error promise rejection captured',
        ],

        // Before sending, filter out sensitive data
        beforeSend(event, hint) {
            // Don't send events in development unless explicitly enabled
            if (!IS_PRODUCTION && !import.meta.env.VITE_SENTRY_DEBUG) {
                console.error('Sentry Event (not sent in dev):', event, hint);
                return null;
            }

            // Filter out sensitive data from breadcrumbs
            if (event.breadcrumbs) {
                event.breadcrumbs = event.breadcrumbs.filter(breadcrumb => {
                    // Remove console logs that might contain sensitive data
                    if (breadcrumb.category === 'console' && breadcrumb.level === 'log') {
                        return false;
                    }
                    return true;
                });
            }

            return event;
        },
    });

    import('../utils/logger').then(({ logger }) => {
        logger.info('✅ Sentry initialized for error tracking');
    });
} else {
    // Sentry DSN not configured - this is OPTIONAL, no need to warn users
    // Error tracking is disabled but app functionality is 100% normal
    // Uncomment below if you want to show warnings:
    // import('../utils/logger').then(({ logger }) => {
    //     logger.warn('⚠️ Sentry DSN not configured. Error tracking disabled.');
    //     logger.warn('Set VITE_SENTRY_DSN in your .env.local file to enable Sentry.');
    // });
}

export { Sentry };
