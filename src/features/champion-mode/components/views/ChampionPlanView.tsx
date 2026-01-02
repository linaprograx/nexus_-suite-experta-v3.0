import React, { useState } from 'react';
import { ChampionColumn } from '../shared/ChampionColumn';
import { useChampionContext } from '../../context/ChampionContext';
import { Icon } from '../../../../components/ui/Icon';
import { ICONS } from '../../../../components/ui/icons';

export const ChampionPlanView: React.FC = () => {
    const { actions } = useChampionContext();
    const [checklist, setChecklist] = useState([
        { id: 1, text: 'Temperatura de Servicio (-18°C)', checked: false },
        { id: 2, text: 'Cristalería Pulida', checked: false },
        { id: 3, text: 'Garnish Fresco', checked: false },
        { id: 4, text: 'Historia Memorizada', checked: false },
        { id: 5, text: 'Mise en Place Completo', checked: false },
        { id: 6, text: 'Playlists Seleccionadas', checked: true }
    ]);
    const [newItem, setNewItem] = useState('');

    // Q&A Simulation State
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const questions = [
        "¿Por qué elegiste esta técnica de dilución para un perfil de sabor tan delicado?",
        "¿Cómo justifica el uso de este ingrediente en una competencia de 'Signature Serve'?",
        "¿Qué historia comunica la guarnición seleccionada?",
        "¿Cómo manejarías un fallo en la máquina de hielo durante tu turno?"
    ];

    const toggleCheck = (id: number) => {
        setChecklist(prev => prev.map(item => item.id === id ? { ...item, checked: !item.checked } : item));
    };

    const addCheckItem = () => {
        if (!newItem.trim()) return;
        setChecklist([...checklist, { id: Date.now(), text: newItem, checked: false }]);
        setNewItem('');
    };

    const handleNextQuestion = () => {
        setCurrentQuestionIndex((prev) => (prev + 1) % questions.length);
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
                    <div className="space-y-2">
                        {checklist.map((item) => (
                            <div key={item.id} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100 shadow-sm group hover:border-orange-200 transition-colors">
                                <div
                                    onClick={() => toggleCheck(item.id)}
                                    className={`w-5 h-5 rounded-md border-2 cursor-pointer flex items-center justify-center transition-colors ${item.checked ? 'bg-orange-500 border-orange-500' : 'border-slate-300'}`}
                                >
                                    {item.checked && <Icon svg={ICONS.check} className="w-3 h-3 text-white" />}
                                </div>
                                <span className={`text-sm font-medium transition-colors ${item.checked ? 'text-slate-400 line-through' : 'text-slate-600'}`}>
                                    {item.text}
                                </span>
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
                    <div className="space-y-6 flex-1">
                        <div className="bg-white p-4 rounded-xl rounded-tl-none border border-slate-200 shadow-sm relative">
                            <div className="absolute -top-3 -left-3 w-8 h-8 bg-slate-200 rounded-full border-2 border-white flex items-center justify-center">
                                <Icon svg={ICONS.user} className="w-4 h-4 text-slate-500" />
                            </div>
                            <p className="text-xs text-slate-400 font-bold mb-1 uppercase tracking-wider ml-4">Juez Principal</p>
                            <p className="text-sm text-slate-700 italic">"{questions[currentQuestionIndex]}"</p>
                        </div>

                        <div className="bg-blue-50/50 p-4 rounded-xl rounded-tr-none border border-blue-100 shadow-sm ml-auto max-w-[90%] relative">
                            <div className="absolute -top-3 -right-3 w-8 h-8 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center">
                                <Icon svg={ICONS.user} className="w-4 h-4 text-white" />
                            </div>
                            <p className="text-xs text-blue-400 font-bold mb-1 text-right uppercase tracking-wider mr-4">Tu Respuesta</p>
                            <textarea
                                className="w-full bg-transparent border-none p-0 text-sm text-blue-900 placeholder-blue-300 focus:ring-0 resize-none h-20"
                                placeholder="Escribe tu defensa aquí..."
                                defaultValue=""
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleNextQuestion}
                        className="w-full py-3 mt-6 bg-white border border-slate-200 text-slate-500 rounded-xl text-xs font-bold uppercase tracking-wider hover:border-blue-300 hover:text-blue-500 transition-colors shadow-sm flex items-center justify-center gap-2"
                    >
                        <Icon svg={ICONS.refresh} className="w-3 h-3" />
                        Simular Otra Pregunta
                    </button>
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
