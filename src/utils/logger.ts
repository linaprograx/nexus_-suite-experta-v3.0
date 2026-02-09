/**
 * Production-Safe Logging Utility
 * 
 * Provides environment-aware logging that only outputs debug/info logs
 * in development mode while always showing warnings and errors.
 * 
 * This prevents 50+ console.log statements from appearing in production.
 */

const isDev = import.meta.env.DEV;

export const logger = {
    /**
     * Debug logs - only in development
     * Use for detailed debugging information
     */
    debug: (...args: any[]) => {
        if (isDev) {
            console.log('[DEBUG]', ...args);
        }
    },

    /**
     * Info logs - only in development
     * Use for general informational messages
     */
    info: (...args: any[]) => {
        if (isDev) {
            console.info('[INFO]', ...args);
        }
    },

    /**
     * Warning logs - always shown
     * Use for recoverable issues that should be investigated
     */
    warn: (...args: any[]) => {
        console.warn('[WARN]', ...args);
    },

    /**
     * Error logs - always shown
     * Use for actual errors and exceptions
     * Consider routing to Sentry in production
     */
    error: (...args: any[]) => {
        console.error('[ERROR]', ...args);

        // Optional: Send to Sentry in production
        // if (!isDev && window.Sentry) {
        //   window.Sentry.captureException(args[0]);
        // }
    },
};

/**
 * For backward compatibility during migration
 * @deprecated Use logger.debug() instead
 */
export const log = logger.debug;
