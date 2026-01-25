import { useEffect, useRef } from 'react';
import { Icon } from '../../../components/ui/Icon';
import { ICONS } from '../../../components/ui/icons';
import { useChampionContext } from '../context/ChampionContext';
import { soundEngine } from '../../avatar/soundEngine';

export const ChampionCreativePanel: React.FC = () => {
    const { state, actions } = useChampionContext();
    const prevProposalRef = useRef(state.proposal);

    useEffect(() => {
        if (!prevProposalRef.current && state.proposal) {
            soundEngine.playSuccessSoft();
        }
        prevProposalRef.current = state.proposal;
    }, [state.proposal]);

    return (
        <div className="flex flex-col gap-6 relative font-sans text-slate-800 max-w-2xl mx-auto w-full pb-8">

            {/* Inspiration Input Card */}
            <div className="relative bg-white p-8 rounded-[30px] border border-white shadow-[0px_4px_30px_rgba(0,0,0,0.03)] shrink-0 transition-all hover:shadow-[0px_10px_40px_rgba(0,0,0,0.06)] hover:-translate-y-1 duration-500">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xs font-black text-violet-500 uppercase tracking-[0.2em] flex items-center gap-2">
                        <Icon svg={ICONS.sparkles} className="w-4 h-4" />
                        Motor Creativo
                    </h2>
                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">v3.0 AI</span>
                </div>

                <div className="space-y-6">
                    <div>
                        <textarea
                            value={state.concept}
                            onChange={(e) => actions.setConcept(e.target.value)}
                            placeholder="Describe tu visión (ej: Un martini inspirado en la lluvia de Tokio...)"
                            className="w-full h-32 bg-slate-50 border border-slate-200 rounded-[20px] p-5 text-sm font-medium text-slate-700 placeholder-slate-400 focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 outline-none resize-none transition-all shadow-inner focus:shadow-md"
                        />
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Estilo / Mood</label>
                            <span className="text-[9px] text-fuchsia-400 font-bold animate-pulse">
                                {state.tags.length > 0 ? `${state.tags.length} Selección` : 'Selecciona Tags'}
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {['Floral', 'Ahumado', 'Minimalista', 'Teatral', 'Cítrico', 'Especiado'].map(tag => {
                                const isActive = state.tags.includes(tag);
                                return (
                                    <button
                                        key={tag}
                                        onClick={() => {
                                            actions.toggleVisualRef(tag);
                                            soundEngine.playClickSoft();
                                        }}
                                        className={`
                                            px-5 py-2 rounded-full text-[11px] font-bold transition-all transform hover:scale-105 active:scale-95 border
                                            ${isActive
                                                ? 'bg-violet-600 border-violet-600 text-white shadow-lg shadow-violet-500/30'
                                                : 'bg-white border-slate-200 text-slate-500 hover:border-violet-300 hover:text-violet-600'}
                                        `}
                                    >
                                        {tag}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Dynamic Story Prompt (AI Hint) */}
                        <div className="mt-4 p-3 bg-violet-50/50 rounded-xl border border-violet-100 flex gap-3 animate-in fade-in duration-500">
                            <div className="bg-white p-1.5 rounded-lg shadow-sm h-fit">
                                <Icon svg={ICONS.sparkles} className="w-3 h-3 text-fuchsia-500" />
                            </div>
                            <p className="text-[10px] font-medium text-violet-800 leading-relaxed opacity-80">
                                {state.brief.brand === 'Nexus Spirits'
                                    ? `Nexus Spirits busca innovación tecnológica en cada sorbo. ¿Cómo integra ${state.brief.competitionType} la ciencia?`
                                    : state.brief.brand === 'Aether Gin'
                                        ? "Aether Gin prioriza los botánicos etéreos. Mantén el perfil floral y ligero."
                                        : state.brief.brand === 'Solaris Rum'
                                            ? "Solaris es pura energía solar. Busca notas cálidas, especiadas y vibrantes."
                                            : state.brief.brand === 'Vortex Vodka'
                                                ? "Vortex exige pureza absoluta y frialdad extrema. El minimalismo es clave."
                                                : "Combina la narrativa de la marca con tu estilo personal."
                                }
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Button - Centered Strong CTA */}
            <button
                onClick={() => {
                    if (!state.isGenerating) soundEngine.playClickSoft();
                    actions.generateProposal();
                }}
                disabled={state.isGenerating}
                className="w-full py-5 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-black tracking-widest rounded-[24px] shadow-xl shadow-violet-500/20 transition-all flex items-center justify-center gap-3 transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed group z-20 hover:-translate-y-1"
            >
                <Icon svg={ICONS.wand} className={`w-5 h-5 ${state.isGenerating ? 'animate-spin' : 'group-hover:rotate-12 transition-transform'}`} />
                {state.isGenerating ? 'DISEÑANDO EXPERIENCIA...' : 'GENERAR PROPUESTA'}
            </button>

            {/* Proposed Result - Premium Card with Glow */}
            {(state.proposal || state.isGenerating) && (
                <div className="relative bg-white p-0 rounded-[30px] border border-white shadow-[0px_20px_50px_rgba(124,58,237,0.15)] flex flex-col z-10 overflow-hidden min-h-[400px] animate-in slide-in-from-bottom-8 fade-in duration-1000">

                    {/* LOADING OVERLAY - MAGIC EFFECT */}
                    {state.isGenerating && (
                        <div className="absolute inset-0 z-50 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center text-center animate-in fade-in duration-300">
                            <div className="relative mb-6">
                                <div className="absolute inset-0 bg-violet-500 blur-2xl opacity-20 animate-pulse" />
                                <Icon svg={ICONS.sparkles} className="w-16 h-16 text-violet-600 animate-[spin_3s_linear_infinite]" />
                                <Icon svg={ICONS.wand} className="w-8 h-8 text-fuchsia-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-bounce" />
                            </div>
                            <h3 className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-fuchsia-600 uppercase tracking-widest mb-2 animate-pulse">
                                Creando Magia...
                            </h3>
                            <p className="text-xs text-slate-400 font-medium max-w-[200px] leading-relaxed">
                                La IA está diseñando tu experiencia World Class.
                            </p>
                        </div>
                    )}

                    {/* Glow Pulse Background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-fuchsia-500/5 pointer-events-none" />
                    <div className="absolute -top-20 -right-20 w-64 h-64 bg-violet-500/10 blur-[80px] rounded-full animate-pulse" />

                    <div className="p-8 pb-4 border-b border-slate-100 flex justify-between items-start relative z-10">
                        <div>
                            <span className="inline-block text-[10px] font-black uppercase px-3 py-1.5 rounded-full mb-4 shadow-sm bg-emerald-50 text-emerald-600">
                                Propuesta Finalizada
                            </span>
                            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-600 via-fuchsia-600 to-indigo-600 leading-tight drop-shadow-sm mb-2">
                                {state.proposal ? state.proposal.title : '...'}
                            </h1>
                            {state.proposal && (state.proposal.shortIntro || state.proposal.description) && (
                                <p className="text-sm font-medium text-slate-400 italic font-serif">
                                    "{state.proposal.shortIntro || state.proposal.description.split('.')[0]}"
                                </p>
                            )}
                        </div>
                        <button
                            onClick={() => {
                                soundEngine.playClickSoft();
                                actions.generateProposal();
                            }}
                            className="p-3 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-400 hover:text-violet-500 transition-colors"
                        >
                            <Icon svg={ICONS.refresh} className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="p-8 pt-6 flex-1 relative z-10">
                        {state.proposal ? (
                            <div className="animate-in fade-in duration-500 space-y-8">
                                <p className="text-base font-medium text-slate-500 italic leading-relaxed border-l-4 border-violet-200 pl-6">
                                    "{state.proposal.description}"
                                </p>

                                {/* GENERATED IMAGE HERO (Moved Up) */}
                                <div className="relative w-full aspect-square rounded-[24px] overflow-hidden shadow-xl group cursor-pointer mb-8 animate-in fade-in zoom-in-95 duration-700">
                                    <img
                                        key={state.proposal.imageUrl}
                                        src={state.proposal.imageUrl}
                                        alt={state.proposal.title}
                                        className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                                        onError={(e) => {
                                            e.currentTarget.onerror = null;
                                            // Fallback to abstract dark fluid art so it looks intentional, not "broken" or "generic cocktail"
                                            e.currentTarget.src = "https://pollinations.ai/p/dark_abstract_liquid_gold_and_purple_smoke_4k_cinematic?width=800&height=800&model=turbo&seed=999";
                                        }}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                                        <p className="text-white text-xs font-medium italic">
                                            "{state.proposal.imagePrompt.slice(0, 100)}..."
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-4">Composición</h4>
                                    <div className="space-y-4">
                                        {state.proposal.recipe.map((item, idx) => (
                                            <div
                                                key={idx}
                                                className="flex justify-between items-center p-4 bg-slate-50 rounded-[16px] border border-slate-100 hover:bg-white hover:shadow-sm transition-all duration-300"
                                                style={{ animationDelay: `${idx * 100}ms` }}
                                            >
                                                <span className="text-sm font-bold text-slate-700">{item.ingredient}</span>
                                                <span className="font-mono font-bold text-violet-600 bg-white px-3 py-1 rounded shadow-sm text-xs border border-violet-100">{item.amount}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* METHOD (New Central) */}
                                <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-700 bg-slate-50 p-6 rounded-[20px] border border-slate-100">
                                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Método de Elaboración</h4>
                                    <p className="text-sm text-slate-600 leading-relaxed font-medium">
                                        {state.proposal.method || "Método estándar."}
                                    </p>
                                </div>

                                {/* COMPLEX PREPS (New Central) */}
                                {state.proposal.complexPreparations && state.proposal.complexPreparations.length > 0 && (
                                    <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
                                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <Icon svg={ICONS.layers} className="w-3 h-3" />
                                            Mise-en-place Avanzado
                                        </h4>
                                        <div className="space-y-4">
                                            {state.proposal.complexPreparations.map((prep: any, idx: number) => (
                                                <div key={idx} className="bg-white p-5 rounded-[20px] border border-slate-100 shadow-sm hover:border-violet-200 transition-colors">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="text-xs font-black text-violet-600 uppercase tracking-wide">{prep.name}</span>
                                                        <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded-full">{prep.yield || "1 batch"}</span>
                                                    </div>
                                                    <p className="text-[11px] text-slate-500 mb-2"><span className="font-bold text-slate-700">Ingredientes:</span> {prep.ingredients}</p>
                                                    <p className="text-[11px] text-slate-600 italic border-l-2 border-violet-100 pl-3 leading-relaxed">{prep.method}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* FLAVOR PROFILE (New Central) */}
                                <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
                                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Perfil de Sabor</h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        {typeof state.proposal.flavorProfile === 'object' && state.proposal.flavorProfile ? (
                                            Object.entries(state.proposal.flavorProfile).map(([key, val]) => (
                                                <div key={key} className="bg-white p-4 rounded-[16px] border border-slate-100 shadow-sm">
                                                    <span className="block text-[9px] font-bold text-slate-400 uppercase mb-1">{key}</span>
                                                    <span className="text-xs font-bold text-slate-700">{val as string}</span>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="col-span-2 text-xs text-slate-500 italic">"{state.proposal.flavorProfile as string}"</p>
                                        )}
                                    </div>
                                </div>

                                {/* IMAGE PROMPT HIDDEN - VISUAL IS HERO */}
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-300 opacity-50 min-h-[200px]">
                                <Icon svg={ICONS.flask} className="w-12 h-12 mb-4" />
                                <p className="text-xs uppercase tracking-widest font-bold">Esperando inspiración...</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
