import React, { useEffect } from 'react';
import { Icon } from '../../../components/ui/Icon';
import { ICONS } from '../../../components/ui/icons';
import { useChampionContext } from '../context/ChampionContext';

export const ChampionPresentationView: React.FC = () => {
    const { state, actions } = useChampionContext();
    const { proposal } = state;

    useEffect(() => {
        // Auto-scroll to top or entering animation could go here
    }, []);

    if (!proposal) {
        return (
            <div className="flex h-full items-center justify-center text-slate-400 bg-slate-900 rounded-[24px] relative overflow-hidden group">
                {/* Stage Spotlight Effect */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-full bg-gradient-to-b from-indigo-500/10 via-transparent to-transparent blur-3xl pointer-events-none" />

                <div className="text-center relative z-10 transition-transform duration-500 group-hover:scale-105">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-slate-800/50 flex items-center justify-center border border-white/5 shadow-[0_0_30px_rgba(99,102,241,0.1)]">
                        <Icon svg={ICONS.flask} className="w-8 h-8 text-indigo-500 opacity-80" />
                    </div>
                    <h2 className="text-2xl font-black uppercase tracking-[0.2em] text-white mb-2">El Escenario Espera</h2>
                    <p className="text-xs font-medium text-slate-500 max-w-xs mx-auto mb-8 leading-relaxed">
                        Completa tu diseño en el Motor Creativo para desbloquear el modo presentación.
                    </p>
                    <button
                        onClick={() => actions.setViewMode('DESIGN')}
                        className="px-8 py-3 bg-white text-slate-900 rounded-full font-bold text-[10px] tracking-widest hover:bg-indigo-50 transition-all hover:scale-105 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                    >
                        VOLVER AL DISEÑO
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto custom-scrollbar bg-slate-900 rounded-[24px] relative">
            <div className="absolute top-0 right-0 p-6 z-50 opacity-0 hover:opacity-100 transition-opacity duration-500">
                <button
                    onClick={() => {
                        soundEngine.playSlide();
                        actions.setViewMode('DESIGN');
                    }}
                    className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-all group border border-white/10 shadow-lg"
                    title="Salir del modo presentación"
                >
                    <Icon svg={ICONS.x} className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                </button>
            </div>

            <div className="max-w-4xl mx-auto p-12 pb-24 text-center">
                {/* Header */}
                <div className="mb-16 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                    <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-[6px] mb-4">Nexus Competition Entry</h3>
                    <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-200 to-slate-400 mb-6 font-serif">
                        {proposal.title}
                    </h1>
                    <p className="text-xl text-slate-400 font-light italic max-w-2xl mx-auto leading-relaxed">
                        "{proposal.description}"
                    </p>
                </div>

                {/* Recipe Card */}
                <div className="grid md:grid-cols-2 gap-12 text-left mb-20 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
                    <div className="p-8 bg-white/5 border border-white/10 rounded-[32px] backdrop-blur-sm">
                        <h4 className="text-xs font-bold text-white/50 uppercase tracking-widest mb-8 border-b border-white/10 pb-4">La Fórmula</h4>
                        <ul className="space-y-6">
                            {proposal.recipe.map((item, i) => (
                                <li key={i} className="flex justify-between items-end group">
                                    <span className="text-xl font-serif text-slate-200 group-hover:text-white transition-colors">
                                        {item.ingredient}
                                    </span>
                                    <span className="text-lg font-mono text-indigo-400 font-bold border-b border-white/10 w-32 text-right pb-1">
                                        {item.amount}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="flex flex-col justify-center space-y-8">
                        <div>
                            <h4 className="text-xs font-bold text-white/50 uppercase tracking-widest mb-4">Storytelling</h4>
                            <p className="text-slate-300 leading-loose">
                                Inspirado en el concepto <span className="text-indigo-400 font-bold">{state.concept || 'Original'}</span>, esta propuesta busca desafiar los límites de la percepción sensorial. Cada ingrediente ha sido seleccionado no solo por su sabor, sino por la emoción que evoca.
                            </p>
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-white/50 uppercase tracking-widest mb-4">Técnica & Servicio</h4>
                            <p className="text-slate-300 leading-loose">
                                Construido directamente en vaso mezclador enfriado a -18°C. Servicio sobre bloque de hielo tallado a mano. Garnish minimalista para potenciar el aroma sin interferir en el trago.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer / Branding */}
                <div className="border-t border-white/10 pt-12 flex justify-between items-center text-slate-500 animate-in fade-in duration-1000 delay-500">
                    <div className="text-xs font-bold uppercase tracking-widest">
                        Powered by Nexus Suite
                    </div>
                    <div className="text-xs font-mono">
                        ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}
                    </div>
                </div>
            </div>
        </div>
    );
};
