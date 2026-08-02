import React, { useState } from 'react';
import { ChampionColumn } from '../shared/ChampionColumn';
import { useChampionContext } from '../../context/ChampionContext';
import { Icon } from '../../../../components/ui/Icon';
import { ICONS } from '../../../../components/ui/icons';

export const ChampionPlanView: React.FC = () => {
    const { state, actions } = useChampionContext(); // Use State!
    const [localChecklist, setLocalChecklist] = useState<any[]>([]);

    // Sync with AI checklist when it arrives
    React.useEffect(() => {
        if (state.checklist && state.checklist.length > 0) {
            setLocalChecklist(state.checklist.map((item, i) => ({ id: i, text: item.item, checked: false, priority: item.priority })));
        }
    }, [state.checklist]);

    const [newItem, setNewItem] = useState('');

    // Q&A Simulation State
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [userAnswer, setUserAnswer] = useState('');

    // Use AI questions if generated, otherwise defaults
    const questions = state.juryQuestions.length > 0
        ? state.juryQuestions
        : [
            "¿Por qué elegiste esta técnica de dilución?",
            "¿Cómo aseguras el 'Wow Factor' en el servicio?",
            "¿Qué harías si se rompe tu mixing glass en pleno turno?"
        ];

    const currentQuestion = questions[currentQuestionIndex];

    const toggleCheck = (id: number) => {
        setLocalChecklist(prev => prev.map(item => item.id === id ? { ...item, checked: !item.checked } : item));
    };

    const addCheckItem = () => {
        if (!newItem.trim()) return;
        setLocalChecklist([...localChecklist, { id: Date.now(), text: newItem, checked: false, priority: 'NORMAL' }]);
        setNewItem('');
    };

    const handleNextQuestion = () => {
        setCurrentQuestionIndex((prev) => (prev + 1) % questions.length);
        setUserAnswer('');
        // We might want to clear feedback too if we store it per question, 
        // but for now state.qaFeedback is global latest. 
        // Ideally we'd reset it here if we had an action for it, 
        // but simply staring a new question implies new context.
    };

    const handleSubmitAnswer = () => {
        if (!userAnswer.trim()) return;
        actions.validateAnswer(currentQuestion, userAnswer);
    };

    return (
        <div className="h-full w-full grid grid-cols-1 grid-rows-3 xl:grid-cols-3 xl:grid-rows-1 gap-8 overflow-hidden">
            {/* COLUMN 1: OPTIMIZATION CHECKLIST */}
            <ChampionColumn
                title="Checklist Final"
                accentColor="bg-violet-500/60 text-violet-200"
                scrollable
            >
                <div className="p-6 space-y-4">

                    {/* Generar Checklist Button */}
                    {localChecklist.length === 0 && (
                        <button
                            onClick={() => actions.generateChecklist()}
                            disabled={!!!!(state.statusMessage && state.statusMessage.includes('logística'))}
                            className="mb-4 w-full py-3 bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-black uppercase tracking-wider rounded-xl hover:bg-violet-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {state.statusMessage && state.statusMessage.includes('logística') ? (
                                <>
                                    <Icon svg={ICONS.refresh} className="w-4 h-4 animate-spin" />
                                    Optimizando...
                                </>
                            ) : (
                                <>
                                    <Icon svg={ICONS.box} className="w-4 h-4" />
                                    Generar Mise-en-place con IA
                                </>
                            )}
                        </button>
                    )}

                    <div className="space-y-2">
                        {localChecklist.map((item) => (
                            <div key={item.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10 group hover:border-violet-500/30 transition-colors">
                                <div
                                    onClick={() => toggleCheck(item.id)}
                                    className={`w-5 h-5 rounded-md border-2 cursor-pointer flex items-center justify-center transition-colors flex-shrink-0 ${item.checked ? 'bg-violet-600 border-violet-600' : 'border-slate-600 hover:border-violet-400'}`}
                                >
                                    {item.checked && <Icon svg={ICONS.check} className="w-3 h-3 text-white" />}
                                </div>
                                <div className="flex-1">
                                    <span className={`text-sm font-medium transition-colors block ${item.checked ? 'text-slate-600 line-through' : 'text-slate-300'}`}>
                                        {item.text}
                                    </span>
                                    {item.priority === 'CRITICAL' && !item.checked && (
                                        <span className="text-[9px] font-bold text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded ml-auto inline-block mt-1">
                                            CRÍTICO
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newItem}
                                onChange={(e) => setNewItem(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && addCheckItem()}
                                placeholder="Nuevo ítem..."
                                className="flex-1 text-xs px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                            />
                            <button
                                onClick={addCheckItem}
                                className="p-2 bg-orange-50 rounded-lg text-orange-500 hover:bg-orange-100 transition-colors"
                            >
                                <Icon svg={ICONS.plus} className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </ChampionColumn>

            {/* COLUMN 2: Q&A SIMULATOR */}
            <ChampionColumn
                title="Simulación de Preguntas"
                accentColor="bg-violet-400/60 text-violet-200"
                scrollable
            >
                <div className="p-6 h-full flex flex-col">
                    {/* Generar Preguntas Button if empty */}
                    {state.juryQuestions.length === 0 && (
                        <button
                            onClick={() => actions.generateQuestions()}
                            disabled={!!!!(state.statusMessage && state.statusMessage.includes('preparando preg'))}
                            className="mb-4 w-full py-2 bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-bold rounded-xl hover:bg-violet-500/20 flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
                        >
                            {state.statusMessage && state.statusMessage.includes('preparando preg') ? (
                                <>
                                    <Icon svg={ICONS.refresh} className="w-3 h-3 animate-spin" />
                                    Generando...
                                </>
                            ) : (
                                "Generar Preguntas con IA"
                            )}
                        </button>
                    )}

                    <div className="space-y-6 flex-1">
                        {/* Question Card */}
                        <div className="bg-white/5 p-4 rounded-xl rounded-tl-none border border-white/10 relative">
                            <div className="absolute -top-3 -left-3 w-8 h-8 bg-slate-700 rounded-full border-2 border-slate-900 flex items-center justify-center">
                                <Icon svg={ICONS.user} className="w-4 h-4 text-slate-300" />
                            </div>
                            <p className="text-xs text-slate-500 font-bold mb-1 uppercase tracking-wider ml-4">Juez Principal</p>
                            <p className="text-sm text-slate-200 italic">"{currentQuestion}"</p>
                        </div>

                        {/* User Answer Area */}
                        <div className="bg-violet-500/10 p-4 rounded-xl rounded-tr-none border border-violet-500/20 ml-auto max-w-[90%] relative">
                            <div className="absolute -top-3 -right-3 w-8 h-8 bg-violet-600 rounded-full border-2 border-slate-900 flex items-center justify-center">
                                <Icon svg={ICONS.user} className="w-4 h-4 text-white" />
                            </div>
                            <p className="text-xs text-violet-400 font-bold mb-1 text-right uppercase tracking-wider mr-4">Tu Respuesta</p>
                            <textarea
                                className="w-full bg-transparent border-none p-0 text-sm text-violet-100 placeholder-violet-600 focus:ring-0 resize-none h-20"
                                placeholder="Escribe tu defensa aquí..."
                                value={userAnswer}
                                onChange={(e) => setUserAnswer(e.target.value)}
                            />
                        </div>

                        {/* Feedback Area */}
                        {state.qaFeedback && state.qaFeedback.question === currentQuestion && (
                            <div className="animate-in fade-in slide-in-from-bottom-2 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-bold text-emerald-400 uppercase">Evaluación</span>
                                    <span className="text-lg font-black text-emerald-300">{state.qaFeedback.feedback.score}/100</span>
                                </div>
                                <p className="text-xs text-emerald-200 mb-2">"{state.qaFeedback.feedback.feedback}"</p>
                                <div className="text-[10px] text-emerald-400 bg-white/5 p-2 rounded border border-emerald-500/20">
                                    <strong>Tip:</strong> {state.qaFeedback.feedback.betterAnswer}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-2 mt-6">
                        <button
                            onClick={handleSubmitAnswer}
                            disabled={!userAnswer || !!(state.qaFeedback && state.qaFeedback.question === currentQuestion) || !!state.statusMessage?.includes('Evaluando')}
                            className="flex-1 py-3 bg-violet-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-violet-500 transition-colors shadow-lg shadow-violet-900/30 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
                        >
                            {state.statusMessage && state.statusMessage.includes('Evaluando') ? (
                                <>
                                    <Icon svg={ICONS.refresh} className="w-4 h-4 animate-spin" />
                                    Evaluando...
                                </>
                            ) : (
                                "Validar Respuesta"
                            )}
                        </button>
                        <button
                            onClick={handleNextQuestion}
                            className="px-4 py-3 bg-white/5 border border-white/10 text-slate-400 rounded-xl text-xs font-bold hover:border-violet-500/40 hover:text-violet-300 transition-colors"
                        >
                            <Icon svg={ICONS.refresh} className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </ChampionColumn>

            {/* COLUMN 3: LAUNCH PAD */}
            <ChampionColumn
                title="El Escenario"
                accentColor="bg-violet-600"
                scrollable
            >
                <div className="h-full flex flex-col items-center justify-center p-6 text-center relative overflow-hidden min-h-[400px] gap-4">
                    <div className="absolute inset-0 bg-gradient-to-t from-violet-500/5 to-transparent pointer-events-none" />

                    {/* Icon */}
                    <div className="w-24 h-24 rounded-full bg-violet-500/10 border-2 border-violet-500/30 flex items-center justify-center relative">
                        <div className="absolute inset-0 rounded-full border border-violet-400/20 animate-[spin_12s_linear_infinite]" />
                        <span className="text-4xl">🏆</span>
                        <div className="absolute -bottom-2 px-3 py-0.5 bg-violet-600 text-white text-[9px] font-bold rounded-full uppercase tracking-wider">
                            Ready
                        </div>
                    </div>

                    <div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-widest mb-1">Showtime</h2>
                        <p className="text-xs text-slate-400 max-w-[200px] leading-relaxed mx-auto">
                            Presenta, exporta y guarda tu propuesta ganadora.
                        </p>
                    </div>

                    {/* Real action buttons */}
                    <div className="w-full space-y-2 z-10">
                        <button
                            onClick={() => actions.setViewMode('PRESENTATION')}
                            className="w-full py-3.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-violet-900/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                        >
                            🎬 Iniciar Presentación
                        </button>
                        <button
                            onClick={() => actions.saveToGrimorium()}
                            disabled={!!!state.proposal}
                            className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-violet-500/40 text-slate-300 hover:text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            📖 Guardar en Grimorium
                        </button>
                        <button
                            onClick={() => actions.createTrainingPlan()}
                            disabled={!!!state.proposal}
                            className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-violet-500/40 text-slate-300 hover:text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            📋 Crear Plan en Pizarrón
                        </button>
                    </div>

                    {/* Status message */}
                    {state.statusMessage && (
                        <p className="text-[10px] text-violet-300 animate-pulse">{state.statusMessage}</p>
                    )}
                </div>
            </ChampionColumn>
        </div>
    );
};
