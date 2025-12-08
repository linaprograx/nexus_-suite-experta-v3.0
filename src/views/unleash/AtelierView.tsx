import React from 'react';
import { Ingredient } from '../../types';

interface AtelierViewProps {
    allIngredients: Ingredient[];
}

const UnleashColumn = ({ title, children }: { title: string, children?: React.ReactNode }) => (
    <div className="h-full min-h-0 flex flex-col rounded-2xl border border-white/10 overflow-hidden bg-white/5 backdrop-blur-sm">
        <div className="p-4 border-b border-white/10 bg-white/5">
            <h3 className="font-bold text-white tracking-wide text-sm uppercase">{title}</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-4">
            {children}
        </div>
    </div>
);

const SectionBlock = ({ title, children }: { title: string, children?: React.ReactNode }) => (
    <div className="bg-white/5 p-4 rounded-xl border border-white/10">
        <h4 className="text-cyan-300 font-semibold mb-3 text-sm uppercase tracking-wider">{title}</h4>
        {children}
    </div>
);

const AtelierView: React.FC<AtelierViewProps> = ({ allIngredients }) => {
    return (
        <div className="h-full grid grid-cols-1 lg:grid-cols-[320px,minmax(0,1fr),320px] gap-6">
            {/* Column 1: Selector Técnico */}
            <UnleashColumn title="Selección Técnica">
                <SectionBlock title="Tipo de Técnica">
                    <select className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white text-sm focus:ring-2 focus:ring-cyan-500 outline-none">
                        <option>Espuma / Aire</option>
                        <option>Clarificado (Milk Punch)</option>
                        <option>Esferificación</option>
                        <option>Fat Wash</option>
                        <option>Infusión Sous-Vide</option>
                    </select>
                </SectionBlock>

                <SectionBlock title="Ingrediente Principal">
                    <select className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white text-sm focus:ring-2 focus:ring-cyan-500 outline-none">
                        <option value="">Seleccionar ingrediente...</option>
                        {allIngredients.map(ing => (
                            <option key={ing.id} value={ing.id}>{ing.nombre}</option>
                        ))}
                    </select>
                </SectionBlock>

                <SectionBlock title="Objetivo Técnico">
                    <div className="space-y-2">
                        {['Transparencia', 'Textura Aterciopelada', 'Intensidad Aromática', 'Estabilidad Visual'].map(goal => (
                            <label key={goal} className="flex items-center space-x-2 cursor-pointer bg-slate-800/50 p-2 rounded-lg border border-transparent hover:border-cyan-500/50 transition-colors">
                                <input type="radio" name="tech-goal" className="text-cyan-500 focus:ring-cyan-500 bg-slate-900 border-slate-600" />
                                <span className="text-sm text-slate-300">{goal}</span>
                            </label>
                        ))}
                    </div>
                </SectionBlock>

                <button className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl shadow-lg shadow-cyan-900/40 transition-all mt-4">
                    GENERAR TÉCNICA
                </button>
            </UnleashColumn>

            {/* Column 2: Ficha Técnica */}
            <UnleashColumn title="Ficha Técnica">
                <div className="text-white/30 text-center italic text-sm mt-10">
                    Configura los parámetros para generar la ficha técnica.
                </div>
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
