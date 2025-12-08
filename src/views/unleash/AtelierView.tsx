import React from 'react';
import { Ingredient } from '../../types';

interface AtelierViewProps {
    allIngredients: Ingredient[];
}

const UnleashColumn = ({ title, children }: { title: string, children?: React.ReactNode }) => (
    <div className="h-full min-h-0 flex flex-col rounded-2xl border border-cyan-200/50 overflow-hidden bg-white/40 backdrop-blur-md shadow-sm">
        <div className="p-4 border-b border-cyan-100 bg-white/50">
            <h3 className="font-bold text-cyan-900 tracking-wide text-sm uppercase">{title}</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-4">
            {children}
        </div>
    </div>
);

const SectionBlock = ({ title, children }: { title: string, children?: React.ReactNode }) => (
    <div className="bg-white/60 p-4 rounded-xl border border-cyan-100 shadow-sm">
        <h4 className="text-cyan-700 font-bold mb-3 text-xs uppercase tracking-wider">{title}</h4>
        {children}
    </div>
);

const AtelierView: React.FC<AtelierViewProps> = ({ allIngredients }) => {
    const [techResult, setTechResult] = React.useState<{
        technique: string;
        steps: string[];
        params: { label: string; value: string }[];
        safety: string[];
    } | null>(null);

    const handleGenerate = () => {
        setTechResult({
            technique: "Clarificación por Milk Punch",
            steps: [
                "Mezclar el 'batch' de espirituosas y cítricos en un recipiente.",
                "Calentar la leche entera a 60°C (sin hervir) para facilitar el cuajado.",
                "Verter el 'batch' SOBRE la leche (nunca al revés) realizando un movimiento circular.",
                "Dejar reposar 24 horas en frío para que los sólidos se separen completamente.",
                "Filtrar con filtro de café o superbag de 100 micras.",
                "Repetir el filtrado usando los primeros cuajos como filtro natural."
            ],
            params: [
                { label: "Tiempo Reposo", value: "24 Horas" },
                { label: "Temperatura", value: "4°C - 60°C" },
                { label: "Rendimiento", value: "85%" },
                { label: "Shelf Life", value: "12 Meses" }
            ],
            safety: [
                "Controlar cadena de frío durante el reposo (max 5°C).",
                "Verificar alérgenos: Contiene Caseína (Lácteos)."
            ]
        });
    };

    return (
        <div className="h-full grid grid-cols-1 lg:grid-cols-[320px,minmax(0,1fr),320px] gap-6">
            {/* Column 1: Selector Técnico */}
            <UnleashColumn title="Selección Técnica">
                <SectionBlock title="Tipo de Técnica">
                    <select className="w-full bg-white border border-cyan-200 rounded-lg p-2 text-slate-800 text-sm focus:ring-2 focus:ring-cyan-500 outline-none">
                        <option>Espuma / Aire</option>
                        <option>Clarificado (Milk Punch)</option>
                        <option>Esferificación</option>
                        <option>Fat Wash</option>
                        <option>Infusión Sous-Vide</option>
                    </select>
                </SectionBlock>

                <SectionBlock title="Ingrediente Principal">
                    <select className="w-full bg-white border border-cyan-200 rounded-lg p-2 text-slate-800 text-sm focus:ring-2 focus:ring-cyan-500 outline-none">
                        <option value="">Seleccionar ingrediente...</option>
                        {allIngredients.map(ing => (
                            <option key={ing.id} value={ing.id}>{ing.nombre}</option>
                        ))}
                    </select>
                </SectionBlock>

                <SectionBlock title="Objetivo Técnico">
                    <div className="space-y-2">
                        {['Transparencia', 'Textura Aterciopelada', 'Intensidad Aromática', 'Estabilidad Visual'].map(goal => (
                            <label key={goal} className="flex items-center space-x-2 cursor-pointer bg-white/50 p-2 rounded-lg border border-transparent hover:border-cyan-300 transition-colors">
                                <input type="radio" name="tech-goal" className="text-cyan-600 focus:ring-cyan-500 bg-slate-100 border-slate-300" />
                                <span className="text-sm text-slate-700 font-medium">{goal}</span>
                            </label>
                        ))}
                    </div>
                </SectionBlock>

                <button
                    onClick={handleGenerate}
                    className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl shadow-lg shadow-cyan-900/20 transition-all mt-4"
                >
                    GENERAR TÉCNICA
                </button>
            </UnleashColumn>

            {/* Column 2: Ficha Técnica */}
            <UnleashColumn title="Ficha Técnica">
                {!techResult ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
                        <div className="text-4xl mb-4 text-cyan-300">🧪</div>
                        <p className="text-sm italic font-medium">Configura parámetros para ver el protocolo.</p>
                    </div>
                ) : (
                    <div className="space-y-6 animate-fadeIn">
                        <div className="bg-gradient-to-r from-cyan-800 via-cyan-600 to-cyan-500 p-5 rounded-2xl shadow-lg shadow-cyan-900/20 text-white">
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <span className="text-cyan-200">⚡</span> {techResult.technique}
                            </h2>

                            {/* Parameters Grid */}
                            <div className="grid grid-cols-2 gap-3 mb-6">
                                {techResult.params.map((p, i) => (
                                    <div key={i} className="bg-white/10 p-3 rounded-lg border border-white/20 backdrop-blur-sm">
                                        <div className="text-xs text-cyan-100 uppercase tracking-wider opacity-80">{p.label}</div>
                                        <div className="text-sm font-bold text-white">{p.value}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Steps */}
                            <div className="space-y-3">
                                <h4 className="text-xs uppercase font-bold text-white tracking-widest pl-1 opacity-90">Protocolo Paso a Paso</h4>
                                {techResult.steps.map((step, i) => (
                                    <div key={i} className="flex gap-3 text-sm text-slate-700 bg-white p-3 rounded-lg shadow-sm">
                                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-100 text-cyan-700 flex items-center justify-center font-bold text-xs border border-cyan-200">
                                            {i + 1}
                                        </div>
                                        <p className="font-medium">{step}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Safety Alerts */}
                        <div className="p-4 bg-red-50 border border-red-200 rounded-xl shadow-sm">
                            <h4 className="text-xs uppercase font-bold text-red-600 mb-2 flex items-center gap-2">
                                ⚠️ Puntos Críticos de Control
                            </h4>
                            <ul className="list-disc list-inside text-xs text-red-700/80 space-y-1 font-medium">
                                {techResult.safety.map((s, i) => <li key={i}>{s}</li>)}
                            </ul>
                        </div>
                    </div>
                )}
            </UnleashColumn>

            {/* Column 3: Ciencia y Seguridad */}
            <UnleashColumn title="Ciencia + Seguridad">
                <SectionBlock title="Análisis de Riesgos">
                    <div className="p-3 bg-red-900/20 border border-red-900/50 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-red-400 font-bold text-xs uppercase">Alerta HACCP</span>
                        </div>
                        <p className="text-xs text-red-200">
                            Pendiente de receta para calcular riesgos bacteriológicos o alérgenos.
                        </p>
                    </div>
                </SectionBlock>

                <SectionBlock title="Optimización Científica">
                    <p className="text-xs text-slate-400 italic">
                        La IA analizará el pH, Brix y ABV para sugerir estabilizantes.
                    </p>
                </SectionBlock>
            </UnleashColumn>
        </div>
    );
};

export default AtelierView;
