import React, { useState } from 'react';
import { SafeImage } from '../../../../components/ui/SafeImage';
import GlassCard from '../../../components/GlassCard';
import { useChampionContext } from '../../../../../features/champion-mode/context/ChampionContext';

export const MobileChampionCreative: React.FC = () => {
    const { state, actions } = useChampionContext();
    const { proposal, isGenerating } = state;
    const [imageError, setImageError] = useState(false);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
            {/* Concept Input */}
            <div className="space-y-4">
                <div className="flex justify-between items-center px-2">
                    <h3 className="text-[10px] font-black text-emerald-900/60 uppercase tracking-[0.2em]">Visión Creativa</h3>
                    <span className="text-[9px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full uppercase">IA v3.0</span>
                </div>
                <div className="bg-white/40 backdrop-blur-md border border-emerald-900/10 rounded-3xl p-6 shadow-sm">
                    <textarea
                        value={state.concept}
                        onChange={(e) => actions.setConcept(e.target.value)}
                        placeholder="Describe la esencia de tu propuesta..."
                        className="w-full h-32 bg-transparent border-none text-sm font-bold text-emerald-950 placeholder-emerald-900/30 focus:ring-0 resize-none"
                    />

                    <div className="flex flex-wrap gap-2 mt-4">
                        {['Floral', 'Ahumado', 'Minimalista', 'Teatral', 'Cítrico'].map(tag => {
                            const isActive = state.tags.includes(tag);
                            return (
                                <button
                                    key={tag}
                                    onClick={() => actions.toggleVisualRef(tag)}
                                    className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${isActive
                                        ? 'bg-emerald-950 text-white shadow-md'
                                        : 'bg-white/40 text-emerald-950/40 border border-emerald-900/5'
                                        }`}
                                >
                                    {tag}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* AI Hint */}
            <div className="bg-emerald-950/5 border border-emerald-900/5 rounded-2xl p-4 flex gap-3 animate-pulse">
                <span className="material-symbols-outlined text-emerald-600 text-lg">auto_awesome</span>
                <p className="text-[10px] font-bold text-emerald-900/60 leading-relaxed italic">
                    "Usa notas de {briefToHint(state.brief.brand)} para potenciar la narrativa de {state.brief.brand}."
                </p>
            </div>

            {/* CTA Button */}
            <button
                onClick={() => actions.generateProposal()}
                disabled={isGenerating}
                className="w-full py-5 bg-emerald-950 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all disabled:opacity-50"
            >
                {isGenerating ? (
                    <>
                        <span className="material-symbols-outlined animate-spin">refresh</span>
                        Diseñando...
                    </>
                ) : (
                    <>
                        <span className="material-symbols-outlined">auto_fix_high</span>
                        Generar Propuesta
                    </>
                )}
            </button>

            {/* Proposal Results */}
            {proposal && (
                <div className="space-y-6 animate-in fade-in zoom-in-95 duration-700">
                    {/* Hero Display */}
                    <div className="relative group aspect-[4/5] w-full rounded-[3rem] shadow-2xl overflow-hidden bg-neutral-900">
                        {(!imageError) ? (
                            <img
                                src={proposal.imageUrl}
                                alt={proposal.title}
                                className="w-full h-full object-cover"
                                onError={() => setImageError(true)}
                            />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-emerald-900 to-black p-6 text-center">
                                <span className="material-symbols-outlined text-4xl text-emerald-500/50 mb-2">image_not_supported</span>
                                <p className="text-xs text-emerald-500/50 font-bold uppercase tracking-widest">Imagen no disponible</p>
                            </div>
                        )}

                        <div className="absolute inset-0 bg-gradient-to-t from-emerald-950 via-transparent to-transparent flex flex-col justify-end p-8 pointer-events-none">
                            <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2">Concepto Final</h4>
                            <h2 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">{proposal.title}</h2>
                        </div>
                    </div>

                    {/* Description */}
                    <GlassCard rounded="3xl" padding="lg" className="bg-white/40 border-emerald-900/10 italic text-sm text-emerald-950 leading-relaxed font-medium">
                        "{proposal.description}"
                    </GlassCard>

                    {/* Breakdown */}
                    <div className="grid grid-cols-2 gap-4">
                        <GlassCard rounded="2xl" padding="md" className="bg-emerald-950 text-emerald-100 text-center">
                            <span className="text-[8px] font-black uppercase opacity-60">Pecisión</span>
                            <span className="block text-xl font-black">98%</span>
                        </GlassCard>
                        <GlassCard rounded="2xl" padding="md" className="bg-white/30 text-emerald-950 text-center">
                            <span className="text-[8px] font-black uppercase opacity-60">Storytelling</span>
                            <span className="block text-xl font-black">Elite</span>
                        </GlassCard>
                    </div>

                    {/* Recipe & Prep */}
                    <div className="space-y-6">
                        <div className="space-y-4">
                            <div className="px-2">
                                <h3 className="text-[10px] font-black text-emerald-900/60 uppercase tracking-[0.2em]">Ingredientes</h3>
                            </div>
                            <div className="space-y-2">
                                {proposal.recipe.map((ing: any, idx: number) => (
                                    <div key={idx} className="flex justify-between items-center bg-white/40 p-4 rounded-2xl border border-emerald-900/5">
                                        <span className="text-xs font-bold text-emerald-950">{ing.ingredient}</span>
                                        <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">{ing.amount}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {proposal.preparation_steps && proposal.preparation_steps.length > 0 && (
                            <div className="space-y-4">
                                <div className="px-2">
                                    <h3 className="text-[10px] font-black text-emerald-900/60 uppercase tracking-[0.2em]">Preparación</h3>
                                </div>
                                <div className="space-y-3">
                                    {proposal.preparation_steps.map((step: string, idx: number) => (
                                        <div key={idx} className="flex gap-4 p-4 bg-emerald-950/5 rounded-2xl border border-emerald-900/5">
                                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-950 text-white text-[10px] font-black flex items-center justify-center">
                                                {idx + 1}
                                            </span>
                                            <p className="text-[11px] font-medium text-emerald-950 leading-relaxed">{step}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

function briefToHint(brand: string) {
    if (brand === 'Nexus Spirits') return 'fusión tecnológia';
    if (brand === 'Aether Gin') return 'botánicos etéreos';
    return 'características premium';
}
