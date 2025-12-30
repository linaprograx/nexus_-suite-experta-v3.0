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
                                            actions.toggleTag(tag);
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
                                {state.tags.includes('Minimalista')
                                    ? "El minimalismo requiere ingredientes de altísima calidad. Considera cristaleria Nude."
                                    : state.tags.includes('Teatral')
                                        ? "Para un efecto teatral, enfócate en el garnish o en el ritual de servicio."
                                        : "Combina descriptores emocionales con ingredientes técnicos para mejores resultados."}
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
                    {/* Glow Pulse Background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-fuchsia-500/5 pointer-events-none" />
                    <div className="absolute -top-20 -right-20 w-64 h-64 bg-violet-500/10 blur-[80px] rounded-full animate-pulse" />

                    <div className="p-8 pb-4 border-b border-slate-100 flex justify-between items-start relative z-10">
                        <div>
                            <span className={`inline-block text-[10px] font-black uppercase px-3 py-1.5 rounded-full mb-4 shadow-sm ${state.isGenerating ? 'bg-violet-50 text-violet-600 animate-pulse' : 'bg-emerald-50 text-emerald-600'}`}>
                                {state.isGenerating ? 'Neuro-Generación Activa' : 'Propuesta Finalizada'}
                            </span>
                            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-600 via-fuchsia-600 to-indigo-600 leading-tight drop-shadow-sm">
                                {state.proposal ? state.proposal.title : 'Creando...'}
                            </h1>
                        </div>
                        <button
                            onClick={() => {
                                soundEngine.playClickSoft();
                                actions.generateProposal();
                            }}
                            className="p-3 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-400 hover:text-violet-500 transition-colors"
                        >
                            <Icon svg={ICONS.refresh} className={`w-4 h-4 ${state.isGenerating ? 'animate-spin' : ''}`} />
                        </button>
                    </div>

                    <div className="p-8 pt-6 flex-1 relative z-10">
                        {state.proposal ? (
                            <div className="animate-in fade-in duration-500 space-y-8">
                                <p className="text-base font-medium text-slate-500 italic leading-relaxed border-l-4 border-violet-200 pl-6">
                                    "{state.proposal.description}"
                                </p>

                                <div>
                                    <h4 className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-4">Composición</h4>
                                    <div className="space-y-3">
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
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-300 opacity-50 min-h-[200px]">
                                <Icon svg={ICONS.flask} className="w-12 h-12 mb-4 animate-bounce duration-[2000ms]" />
                                <p className="text-xs uppercase tracking-widest font-bold">Generando...</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
