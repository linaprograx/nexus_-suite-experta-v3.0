import React from 'react';

export class ErrorBoundary extends React.Component<{ children: React.ReactNode, fallback?: React.ReactNode }, { hasError: boolean, error: Error | null }> {
    constructor(props: any) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        console.error("ErrorBoundary caught error:", error, info);
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) return this.props.fallback;
            return (
                <div className="p-4 bg-red-100 border border-red-500 text-red-700 rounded-lg">
                    <h3 className="font-bold">Something went wrong.</h3>
                    <pre className="text-xs mt-2 overflow-auto">{this.state.error?.message}</pre>
                </div>
            );
        }
        return this.props.children;
    }
}
