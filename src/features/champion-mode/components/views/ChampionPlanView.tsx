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
                accentColor="bg-orange-500"
                scrollable
            >
                <div className="p-6 space-y-4">

                    {/* Generar Checklist Button */}
                    {localChecklist.length === 0 && (
                        <button
                            onClick={() => actions.generateChecklist()}
                            disabled={state.statusMessage && state.statusMessage.includes('logística')}
                            className="mb-4 w-full py-3 bg-orange-50 border border-orange-100 text-orange-600 text-xs font-black uppercase tracking-wider rounded-xl hover:bg-orange-100 transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
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
                            <div key={item.id} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100 shadow-sm group hover:border-orange-200 transition-colors">
                                <div
                                    onClick={() => toggleCheck(item.id)}
                                    className={`w-5 h-5 rounded-md border-2 cursor-pointer flex items-center justify-center transition-colors ${item.checked ? 'bg-orange-500 border-orange-500' : 'border-slate-300'}`}
                                >
                                    {item.checked && <Icon svg={ICONS.check} className="w-3 h-3 text-white" />}
                                </div>
                                <div className="flex-1">
                                    <span className={`text-sm font-medium transition-colors block ${item.checked ? 'text-slate-400 line-through' : 'text-slate-600'}`}>
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
                accentColor="bg-blue-500"
                scrollable
            >
                <div className="p-6 h-full flex flex-col">
                    {/* Generar Preguntas Button if empty */}
                    {state.juryQuestions.length === 0 && (
                        <button
                            onClick={() => actions.generateQuestions()}
                            disabled={state.statusMessage && state.statusMessage.includes('preparando preg')}
                            className="mb-4 w-full py-2 bg-blue-50 text-blue-600 text-xs font-bold rounded-lg hover:bg-blue-100 flex items-center justify-center gap-2 disabled:opacity-50"
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
                        <div className="bg-white p-4 rounded-xl rounded-tl-none border border-slate-200 shadow-sm relative">
                            <div className="absolute -top-3 -left-3 w-8 h-8 bg-slate-200 rounded-full border-2 border-white flex items-center justify-center">
                                <Icon svg={ICONS.user} className="w-4 h-4 text-slate-500" />
                            </div>
                            <p className="text-xs text-slate-400 font-bold mb-1 uppercase tracking-wider ml-4">Juez Principal</p>
                            <p className="text-sm text-slate-700 italic">"{currentQuestion}"</p>
                        </div>

                        {/* User Answer Area */}
                        <div className="bg-blue-50/50 p-4 rounded-xl rounded-tr-none border border-blue-100 shadow-sm ml-auto max-w-[90%] relative">
                            <div className="absolute -top-3 -right-3 w-8 h-8 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center">
                                <Icon svg={ICONS.user} className="w-4 h-4 text-white" />
                            </div>
                            <p className="text-xs text-blue-400 font-bold mb-1 text-right uppercase tracking-wider mr-4">Tu Respuesta</p>
                            <textarea
                                className="w-full bg-transparent border-none p-0 text-sm text-blue-900 placeholder-blue-300 focus:ring-0 resize-none h-20"
                                placeholder="Escribe tu defensa aquí..."
                                value={userAnswer}
                                onChange={(e) => setUserAnswer(e.target.value)}
                            />
                        </div>

                        {/* Feedback Area */}
                        {state.qaFeedback && state.qaFeedback.question === currentQuestion && (
                            <div className="animate-in fade-in slide-in-from-bottom-2 p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-bold text-emerald-600 uppercase">Evaluación</span>
                                    <span className="text-lg font-black text-emerald-700">{state.qaFeedback.feedback.score}/100</span>
                                </div>
                                <p className="text-xs text-emerald-800 mb-2">"{state.qaFeedback.feedback.feedback}"</p>
                                <div className="text-[10px] text-emerald-600 bg-white/50 p-2 rounded">
                                    <strong>Tip:</strong> {state.qaFeedback.feedback.betterAnswer}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-2 mt-6">
                        <button
                            onClick={handleSubmitAnswer}
                            disabled={!userAnswer || !!(state.qaFeedback && state.qaFeedback.question === currentQuestion) || (state.statusMessage && state.statusMessage.includes('Evaluando'))}
                            className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-blue-500 transition-colors shadow-lg disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
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
                            className="px-4 py-3 bg-white border border-slate-200 text-slate-500 rounded-xl text-xs font-bold hover:border-blue-300 hover:text-blue-500 transition-colors shadow-sm"
                        >
                            <Icon svg={ICONS.refresh} className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </ChampionColumn>

            {/* COLUMN 3: LAUNCH PAD */}
            <ChampionColumn
                title="El Escenario"
                accentColor="bg-indigo-600"
                scrollable
            >
                <div className="h-full flex flex-col items-center justify-center p-8 text-center relative overflow-hidden min-h-[400px]">
                    {/* Background glow */}
                    <div className="absolute inset-0 bg-gradient-to-t from-indigo-500/5 to-transparent pointer-events-none" />

                    <div className="w-32 h-32 rounded-full bg-indigo-50 border-4 border-indigo-100 flex items-center justify-center mb-8 relative group cursor-pointer transition-transform hover:scale-105">
                        <div className="absolute inset-0 rounded-full border border-indigo-200 animate-[spin_10s_linear_infinite]" />
                        <Icon svg={ICONS.monitor} className="w-12 h-12 text-indigo-600 drop-shadow-md" />
                        <div className="absolute -bottom-2 px-3 py-1 bg-indigo-600 text-white text-[10px] font-bold rounded-full uppercase tracking-wider">
                            Ready
                        </div>
                    </div>

                    <h2 className="text-3xl font-black text-slate-800 uppercase tracking-widest mb-3">Showtime</h2>
                    <p className="text-sm text-slate-500 mb-10 max-w-[240px] leading-relaxed">
                        Tu propuesta está lista. Entra en modo presentación para impresionar al jurado.
                    </p>

                    <button
                        onClick={() => actions.setViewMode('PRESENTATION')}
                        className="px-8 py-4 bg-indigo-600 text-white rounded-full font-bold text-xs uppercase tracking-[0.25em] shadow-xl shadow-indigo-500/30 hover:scale-105 hover:bg-indigo-500 transition-all active:scale-95 z-20"
                    >
                        Iniciar Presentación
                    </button>
                </div>
            </ChampionColumn>
        </div>
    );
};
