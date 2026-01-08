import React from 'react';

export const MobileShell: React.FC = () => {
    return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6">
            <div className="space-y-4 text-center">
                <div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto ring-1 ring-indigo-500/50">
                    <span className="text-2xl">📱</span>
                </div>
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
                    Nexus Mobile
                </h1>
                <p className="text-slate-400 text-sm max-w-xs mx-auto">
                    Experimental mobile layer active.
                    <br />
                    Waiting for premium prototype assets.
                </p>
            </div>

            {/* Visual Debugger */}
            <div className="fixed bottom-4 left-4 right-4 bg-slate-900/80 backdrop-blur border border-slate-800 rounded-lg p-3 text-xs text-slate-500 font-mono text-center">
                VIEWPORT: &lt; 768px detected
            </div>
        </div>
    );
};
