import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '../../../components/GlassCard';
import { useChampionContext } from '../../../../../features/champion-mode/context/ChampionContext';

export const MobileChampionPlan: React.FC = () => {
    const { state, actions } = useChampionContext();
    const [localChecklist, setLocalChecklist] = useState<any[]>([]);
    const [userAnswer, setUserAnswer] = useState('');
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

    useEffect(() => {
        if (state.checklist && state.checklist.length > 0) {
            setLocalChecklist(state.checklist.map((item: any, i: number) => ({ id: i, text: item.item, checked: false, priority: item.priority })));
        }
    }, [state.checklist]);

    const questions = state.juryQuestions.length > 0 ? state.juryQuestions : ["¿Por qué elegiste esta técnica?", "¿Cómo aseguras el Wow Factor?"];
    const currentQuestion = questions[currentQuestionIndex];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
            {/* Checklist Section */}
            <div className="space-y-4">
                <div className="flex justify-between items-center px-2">
                    <h3 className="text-[10px] font-black text-emerald-950/60 uppercase tracking-[0.2em]">Misión Crítica</h3>
                    <button
                        onClick={() => actions.generateChecklist()}
                        className="text-[9px] font-black text-emerald-600 bg-emerald-100 px-3 py-1 rounded-full uppercase"
                    >
                        Generar IA
                    </button>
                </div>
                <div className="space-y-2">
                    {localChecklist.map((item: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-4 bg-white/40 backdrop-blur-md p-4 rounded-2xl border border-emerald-900/5 shadow-sm">
                            <button
                                onClick={() => setLocalChecklist(prev => prev.map((i: any) => i.id === item.id ? { ...i, checked: !i.checked } : i))}
                                className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${item.checked ? 'bg-emerald-600 border-emerald-600' : 'border-emerald-950/10 bg-white/50'
                                    }`}
                            >
                                {item.checked && <span className="material-symbols-outlined text-white text-[16px]">check</span>}
                            </button>
                            <div className="flex-1">
                                <p className={`text-xs font-bold leading-tight ${item.checked ? 'text-emerald-950/30 line-through' : 'text-emerald-950'}`}>
                                    {item.text}
                                </p>
                                {item.priority === 'CRITICAL' && (
                                    <span className="text-[8px] font-black text-rose-500 uppercase mt-1 block">Prioridad Alta</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Q&A Simulation */}
            <div className="space-y-4">
                <h3 className="text-[10px] font-black text-emerald-950/60 uppercase tracking-[0.2em] px-2">Defensa del Jurado</h3>
                <GlassCard rounded="3xl" padding="lg" className="bg-emerald-950 text-white shadow-xl">
                    <div className="space-y-6">
                        <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined text-emerald-400">person_search</span>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">Pregunta del Juez</span>
                                <p className="text-xs font-bold italic opacity-90 leading-relaxed">"{currentQuestion}"</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest px-1">Tu Respuesta</span>
                            <textarea
                                value={userAnswer}
                                onChange={(e) => setUserAnswer(e.target.value)}
                                placeholder="Escribe tu argumento de victoria..."
                                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xs font-medium text-white placeholder-white/20 focus:ring-1 focus:ring-emerald-400 focus:border-emerald-400 outline-none h-24 resize-none transition-all"
                            />
                        </div>

                        <button
                            onClick={() => {
                                if (userAnswer.trim()) {
                                    actions.validateAnswer(currentQuestion, userAnswer);
                                }
                            }}
                            className="w-full py-4 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all"
                        >
                            Validar Defensa
                        </button>
                    </div>
                </GlassCard>

                {state.qaFeedback && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="animate-in fade-in slide-in-from-top-2"
                    >
                        <GlassCard rounded="2xl" padding="lg" className="bg-white/60 border-emerald-900/10 border-l-4 border-l-emerald-600">
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black text-emerald-600 uppercase">Resultado: {state.qaFeedback.feedback.score}%</span>
                                </div>
                                <p className="text-[11px] font-bold text-emerald-950 leading-relaxed italic">"{state.qaFeedback.feedback.feedback}"</p>
                                <div className="bg-emerald-950/5 p-3 rounded-xl border border-emerald-900/5">
                                    <span className="text-[8px] font-black text-emerald-900/40 uppercase block mb-1">Respuesta Ideal</span>
                                    <p className="text-[10px] font-medium text-emerald-900/70">{state.qaFeedback.feedback.betterAnswer}</p>
                                </div>
                            </div>
                        </GlassCard>
                    </motion.div>
                )}
            </div>

            {/* Showtime Launchpad */}
            <div className="py-10 text-center space-y-6 flex flex-col items-center">
                <div className="w-24 h-24 rounded-full bg-emerald-950 flex items-center justify-center shadow-[0_0_40px_rgba(5,150,105,0.3)] animate-pulse">
                    <span className="material-symbols-outlined text-white text-4xl">rocket_launch</span>
                </div>
                <div>
                    <h2 className="text-2xl font-black text-emerald-950 uppercase tracking-tighter italic">Showtime</h2>
                    <p className="text-[10px] text-emerald-950/40 font-bold uppercase tracking-widest mt-2 px-14">Estás listo para la gloria. Entra en modo presentación.</p>
                </div>
                <button
                    onClick={() => actions.setViewMode('PRESENTATION')}
                    className="w-full py-6 bg-emerald-950 text-white rounded-[2rem] font-black text-[12px] uppercase tracking-[0.4em] shadow-2xl active:scale-95 transition-all"
                >
                    Iniciar Presentación
                </button>
            </div>
        </div>
    );
};
