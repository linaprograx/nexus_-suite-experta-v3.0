import React from 'react';
import { GlassCard } from '../../components/glass/GlassCard';
import { GlassAction } from '../../components/glass/GlassAction';
import { useProductNavigation } from '../../navigation/ProductRouter';
import { BTN_TEXT } from '../../narrative/text.tokens';

export const LoginScreen: React.FC = () => {
    const { login } = useProductNavigation();

    return (
        <div className="flex-1 flex flex-col items-center justify-center p-6 w-full animate-in fade-in duration-700">
            <GlassCard tone="neutral" className="w-full max-w-sm p-8 flex flex-col items-center text-center gap-6 shadow-2xl ring-1 ring-white/70">
                <div className="mb-2">
                    <h1 className="text-3xl font-light text-slate-900 tracking-wide">Nexus Glass</h1>
                    <p className="text-sm text-slate-500 font-medium tracking-widest uppercase mt-2 opacity-70">Mobile Edition</p>
                </div>

                <div className="w-16 h-1 bg-gradient-to-r from-violet-400 to-cyan-400 rounded-full opacity-50" />

                <div className="w-full space-y-4">
                    <GlassAction
                        onClick={login}
                        variant="primary"
                        tone="violet"
                        className="w-full shadow-lg"
                    >
                        Enter Nexus
                    </GlassAction>

                    <p className="text-xs text-slate-400">
                        By continuing, you accept the protocol.
                    </p>
                </div>
            </GlassCard>
        </div>
    );
};
