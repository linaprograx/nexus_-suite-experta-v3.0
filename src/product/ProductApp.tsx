import React from 'react';
import { GlassCard } from './components/glass/GlassCard';

export const ProductApp: React.FC = () => {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ background: '#f8fafc' }}>
            <GlassCard tone="cyan" halo className="max-w-sm w-full p-8 text-center">
                <h1 className="text-3xl font-light mb-4 text-slate-800 tracking-tight">NEXUS GLASS</h1>
                <div className="px-3 py-1 bg-white/50 text-slate-700 rounded-full inline-block text-sm font-medium mb-6 backdrop-blur-sm border border-white/20 shadow-sm">
                    Light Edition
                </div>
                <p className="text-slate-600 mb-6 leading-relaxed">
                    This is the placeholder shell for the new Product UI.
                    <br />
                    <span className="text-sm opacity-80">Designed for Mobile First.</span>
                </p>
                <div className="inline-block px-4 py-2 bg-slate-100 rounded-md">
                    <p className="text-xs text-slate-400 font-mono">mode: {import.meta.env.VITE_UI_MODE || 'legacy'}</p>
                </div>
            </GlassCard>
        </div>
    );
};

