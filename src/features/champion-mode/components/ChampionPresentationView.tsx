import React, { useEffect, useState } from 'react';
import { Icon } from '../../../components/ui/Icon';
import { ICONS } from '../../../components/ui/icons';
import { useChampionContext } from '../context/ChampionContext';
import { soundEngine } from '../../avatar/soundEngine';

export const ChampionPresentationView: React.FC = () => {
    const { state, actions } = useChampionContext();
    const { proposal, aiEvaluation } = state;
    const [showVerdict, setShowVerdict] = useState(false);

    useEffect(() => {
        // Simple entrance animation
        setTimeout(() => setShowVerdict(true), 1500);
    }, []);

    if (!proposal) {
        return (
            <div className="flex h-full items-center justify-center text-slate-400 bg-slate-900 rounded-[24px]">
                <p>No hay propuesta activa.</p>
                <button onClick={() => actions.setViewMode('DESIGN')}>Volver</button>
            </div>
        );
    }

    // Determine Status Color based on Verdict
    const verdictColor = aiEvaluation?.verdict?.includes('FINALIST') ? 'text-amber-400'
        : aiEvaluation?.verdict?.includes('COMPETITIVE') ? 'text-emerald-400'
            : 'text-slate-400';

    return (
        <div className="h-full overflow-y-auto custom-scrollbar bg-slate-950 rounded-[24px] relative text-slate-200 font-sans selection:bg-indigo-500/30">
            {/* Close Button */}
            <div className="absolute top-6 right-6 z-50">
                <button
                    onClick={() => {
                        soundEngine.playClickSoft();
                        actions.setViewMode('DESIGN');
                    }}
                    className="p-3 bg-white/5 hover:bg-white/10 text-white rounded-full backdrop-blur-md transition-all border border-white/10 hover:border-white/20 group"
                >
                    <Icon svg={ICONS.x} className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                </button>
            </div>

            {/* HERO SECTION */}
            <div className="relative min-h-[60vh] flex flex-col items-center justify-center p-12 text-center overflow-hidden">
                {/* Background Image / Gradient */}
                <div className="absolute inset-0 z-0">
                    {proposal.imageUrl ? (
                        <>
                            <img
                                key={proposal.imageUrl}
                                src={proposal.imageUrl}
                                alt="Cocktail"
                                className="w-full h-full object-cover object-[center_30%] opacity-60 hover:opacity-100 transition-opacity duration-1000 scale-105"
                                onError={(e) => {
                                    e.currentTarget.onerror = null;
                                    e.currentTarget.src = "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80";
                                }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-b from-slate-950/90 via-slate-950/40 to-slate-950" />
                        </>
                    ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-slate-900 to-black opacity-50" />
                    )}
                </div>

                {/* Content */}
                <div className="relative z-10 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-1000">
                    <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-[0.3em] mb-4 border border-indigo-500/30 inline-block px-4 py-1 rounded-full backdrop-blur-sm">
                        {state.brief.brand} • {state.brief.competitionType}
                    </h3>
                    <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white via-slate-200 to-slate-500 mb-6 drop-shadow-lg font-serif tracking-tight leading-none">
                        {proposal.title}
                    </h1>
                    <p className="text-xl md:text-2xl text-slate-300 font-light italic max-w-2xl mx-auto leading-relaxed drop-shadow-md">
                        "{proposal.description}"
                    </p>
                </div>
            </div>

            {/* MAIN CONTENT GRID */}
            <div className="max-w-[90rem] mx-auto p-8 md:p-12 pt-0 grid grid-cols-1 lg:grid-cols-12 gap-12 relative z-20 -mt-20">

                {/* LEFT: SPECS & FLAVOR (4 Cols) */}
                <div className="lg:col-span-4 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100">
                    {/* Flavor Profile Card */}
                    <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 p-8 rounded-[32px] hover:border-indigo-500/30 transition-colors">
                        <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-6 flex items-center gap-2">
                            <Icon svg={ICONS.chart} className="w-4 h-4" />
                            Perfil Sensorial
                        </h4>
                        <div className="space-y-4">
                            {typeof proposal.flavorProfile === 'object' && proposal.flavorProfile ? (
                                Object.entries(proposal.flavorProfile).map(([key, val]) => (
                                    <div key={key} className="flex justify-between items-center pb-2 border-b border-white/5">
                                        <span className="text-[10px] font-bold text-indigo-400 uppercase">{key}</span>
                                        <span className="text-sm font-medium text-slate-200">{val as string}</span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-slate-400 italic">"{proposal.flavorProfile as string}"</p>
                            )}
                        </div>
                    </div>

                    {/* Glassware & Garnish */}
                    <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 p-8 rounded-[32px] hover:border-indigo-500/30 transition-colors">
                        <div className="mb-6">
                            <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Cristalería</h4>
                            <p className="text-lg font-serif text-white">{proposal.glassware || "N/A"}</p>
                        </div>
                        <div>
                            <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Garnish</h4>
                            <p className="text-lg font-serif text-white mb-1">
                                {typeof proposal.garnish === 'object' ? proposal.garnish.name : proposal.garnish}
                            </p>
                            {typeof proposal.garnish === 'object' && (
                                <p className="text-xs text-slate-400 italic leading-relaxed">
                                    "{proposal.garnish.description}"
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* CENTER: RECIPE & TECHNIQUE (5 Cols) */}
                <div className="lg:col-span-5 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 md:p-10 rounded-[32px] relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-32 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />

                        <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-8 text-center">La Fórmula Maestra</h4>

                        {/* Ingredients */}
                        <ul className="space-y-4 mb-10 relative z-10">
                            {proposal.recipe.map((item, i) => (
                                <li key={i} className="flex justify-between items-baseline group border-b border-white/5 pb-3 last:border-0 hover:bg-white/5 px-2 rounded-lg transition-colors">
                                    <span className="text-xl md:text-2xl font-serif text-slate-200 group-hover:text-white transition-colors">
                                        {item.ingredient}
                                    </span>
                                    <span className="text-md font-mono font-bold text-indigo-400">
                                        {item.amount}
                                    </span>
                                </li>
                            ))}
                        </ul>

                        {/* Complex Preparations (Sub-recipes) */}
                        {proposal.complexPreparations && proposal.complexPreparations.length > 0 && (
                            <div className="mb-10 relative z-10 bg-black/20 p-6 rounded-2xl border border-white/5">
                                <h5 className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider mb-4 border-b border-white/5 pb-2">
                                    Elaboraciones Complejas
                                </h5>
                                <div className="space-y-6">
                                    {proposal.complexPreparations.map((prep: any, idx: number) => (
                                        <div key={idx}>
                                            <div className="flex justify-between mb-1">
                                                <span className="text-sm font-bold text-white">{prep.name}</span>
                                                <span className="text-[10px] text-slate-400 font-mono bg-white/5 px-2 py-0.5 rounded">{prep.yield}</span>
                                            </div>
                                            <p className="text-xs text-slate-400 leading-relaxed italic">
                                                {prep.method}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Method */}
                        <div className="relative z-10">
                            <h5 className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-3">Método</h5>
                            <p className="text-sm text-slate-300 leading-relaxed font-medium">
                                {proposal.method}
                            </p>
                        </div>
                    </div>
                </div>

                {/* RIGHT: STORY & RITUAL (3 Cols) */}
                <div className="lg:col-span-3 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
                    {/* Ritual Card */}
                    <div className="bg-slate-900 border border-slate-800 p-8 rounded-[32px] relative overflow-hidden group h-full">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 to-indigo-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                        <h4 className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-4 relative z-10">Ritual de Servicio</h4>
                        <p className="text-sm text-slate-300 leading-loose relative z-10 italic">
                            "{proposal.ritual}"
                        </p>
                    </div>
                </div>

            </div>

            {/* JURY VERDICT (Full Width Bottom) */}
            {aiEvaluation && (
                <div className="max-w-[90rem] mx-auto p-8 md:p-12 pt-0 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500">
                    <div className="bg-gradient-to-r from-indigo-950/80 to-slate-900/80 backdrop-blur-xl border border-indigo-500/20 p-10 rounded-[40px] relative overflow-hidden shadow-2xl">
                        {/* Background Glow */}
                        <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-indigo-600/20 blur-[100px] rounded-full pointer-events-none" />

                        <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
                            {/* Score & Verdict */}
                            <div className="text-center md:text-left shrink-0">
                                <h4 className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest mb-2">Veredicto Oficial</h4>
                                <div className="flex items-center gap-4 justify-center md:justify-start mb-2">
                                    <span className="text-6xl font-black text-white tracking-tighter">{aiEvaluation.overallScore}</span>
                                    <div className="flex flex-col text-left">
                                        <span className="text-[10px] text-slate-400 uppercase font-bold">Puntaje</span>
                                        <span className="text-[10px] text-slate-400 uppercase font-bold">Total</span>
                                    </div>
                                </div>
                                <h2 className={`text-3xl font-black uppercase tracking-tight ${verdictColor}`}>
                                    {aiEvaluation.verdict}
                                </h2>
                            </div>

                            {/* Divider */}
                            <div className="hidden md:block w-px h-32 bg-gradient-to-b from-transparent via-white/10 to-transparent" />

                            {/* Feedback Grid */}
                            <div className="flex-1 w-full">
                                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 text-center md:text-left">Análisis del Jurado</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {aiEvaluation.feedback && aiEvaluation.feedback.slice(0, 3).map((f: string, i: number) => (
                                        <div key={i} className="bg-white/5 border border-white/5 p-4 rounded-2xl flex gap-3 items-start">
                                            <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0 mt-0.5">
                                                <span className="text-[10px] font-bold text-indigo-300">{i + 1}</span>
                                            </div>
                                            <p className="text-xs text-slate-300 leading-relaxed">
                                                {f}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="text-center py-12 text-[10px] text-slate-600 font-mono uppercase tracking-widest opacity-50">
                Nexus Suite v3.0 • World Class Engine
            </div>
        </div>
    );
};
