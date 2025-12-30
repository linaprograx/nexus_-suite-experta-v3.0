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
            <div className="flex h-full items-center justify-center text-slate-400">
                <div className="text-center">
                    <Icon svg={ICONS.flask} className="w-12 h-12 mx-auto mb-4 text-slate-600" />
                    <h2 className="text-xl font-bold uppercase tracking-widest">Sin Propuesta para Presentar</h2>
                    <button
                        onClick={() => actions.setViewMode('DESIGN')}
                        className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-full font-bold text-sm hover:bg-indigo-500 transition-colors"
                    >
                        Volver al Diseño
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
