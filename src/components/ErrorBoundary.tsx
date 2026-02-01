import { Component, ErrorInfo, ReactNode } from 'react';
import { Sentry } from '../config/sentry';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
    hasError: boolean;
    error?: Error;
}

/**
 * Error Boundary Component
 * 
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors to Sentry, and displays a fallback UI.
 * 
 * Usage:
 * <ErrorBoundary>
 *   <YourApp />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): State {
        // Update state so the next render will show the fallback UI
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // Log error to Sentry
        Sentry.captureException(error, {
            contexts: {
                react: {
                    componentStack: errorInfo.componentStack,
                },
            },
        });

        // Call custom error handler if provided
        if (this.props.onError) {
            this.props.onError(error, errorInfo);
        }

        // Log to console in development
        if (import.meta.env.DEV) {
            console.error('Error Boundary caught an error:', error, errorInfo);
        }
    }

    handleReset = () => {
        this.setState({ hasError: false, error: undefined });
    };

    render() {
        if (this.state.hasError) {
            // Use custom fallback if provided
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Default fallback UI
            return (
                <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6">
                    <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 text-center">
                        {/* Error Icon */}
                        <div className="w-16 h-16 mx-auto mb-6 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                            <svg
                                className="w-8 h-8 text-red-600 dark:text-red-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                />
                            </svg>
                        </div>

                        {/* Error Message */}
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                            Algo salió mal
                        </h1>
                        <p className="text-slate-600 dark:text-slate-300 mb-6">
                            Hemos registrado el error y trabajaremos para resolverlo pronto.
                        </p>

                        {/* Error Details (Dev only) */}
                        {import.meta.env.DEV && this.state.error && (
                            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-left">
                                <p className="text-xs font-mono text-red-800 dark:text-red-200 break-all">
                                    {this.state.error.toString()}
                                </p>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={this.handleReset}
                                className="flex-1 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-xl transition-colors"
                            >
                                Intentar de nuevo
                            </button>
                            <button
                                onClick={() => window.location.href = '/'}
                                className="flex-1 px-6 py-3 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-white font-medium rounded-xl transition-colors"
                            >
                                Ir al inicio
                            </button>
                        </div>

                        {/* Support Link */}
                        <p className="mt-6 text-sm text-slate-500 dark:text-slate-400">
                            ¿Necesitas ayuda?{' '}
                            <a
                                href="mailto:support@nexussuite.com"
                                className="text-emerald-600 dark:text-emerald-400 hover:underline"
                            >
                                Contacta soporte
                            </a>
                        </p>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
