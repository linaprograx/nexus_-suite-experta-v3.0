import React from 'react';
import { Recipe } from '../../types';

interface SynthesisViewProps {
    allRecipes: Recipe[];
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
        <h4 className="text-violet-300 font-semibold mb-3 text-sm uppercase tracking-wider">{title}</h4>
        {children}
    </div>
);

const SynthesisView: React.FC<SynthesisViewProps> = ({ allRecipes }) => {
    const [selectedRecipeId, setSelectedRecipeId] = React.useState<string>('');
    const [concept, setConcept] = React.useState('');

    const handleRecipeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const recipeId = e.target.value;
        setSelectedRecipeId(recipeId);
        const recipe = allRecipes.find(r => r.id === recipeId);
        if (recipe) {
            setConcept(`Concepto para: ${recipe.nombre}`);
        } else {
            setConcept('');
        }
    };

    return (
        <div className="h-full grid grid-cols-1 lg:grid-cols-[320px,minmax(0,1fr),320px] gap-6">
            {/* Column 1: Brief & Inputs */}
            <UnleashColumn title="Brief & Inputs">
                <SectionBlock title="Selección de Cóctel">
                    <select
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white text-sm focus:ring-2 focus:ring-violet-500 outline-none"
                        value={selectedRecipeId}
                        onChange={handleRecipeChange}
                    >
                        <option value="">Seleccionar desde Grimorio...</option>
                        {allRecipes.map(recipe => (
                            <option key={recipe.id} value={recipe.id}>{recipe.nombre}</option>
                        ))}
                        <option value="new">Crear Nuevo (Manual)</option>
                    </select>
                </SectionBlock>

                <SectionBlock title="Definición del Concepto">
                    <div className="space-y-3">
                        <input
                            type="text"
                            placeholder="Concepto Central (ej. Nostalgia)"
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white text-sm"
                            value={concept}
                            onChange={(e) => setConcept(e.target.value)}
                        />
                        <input type="text" placeholder="Emoción Deseada" className="w-full bg-slate-800 border-slate-700 rounded-lg p-2 text-white text-sm" />
                        <input type="text" placeholder="Perfil de Cliente" className="w-full bg-slate-800 border-slate-700 rounded-lg p-2 text-white text-sm" />
                        <textarea placeholder="Restricciones o Notas" className="w-full bg-slate-800 border-slate-700 rounded-lg p-2 text-white text-sm h-20 resize-none"></textarea>
                    </div>
                </SectionBlock>

                <button className="w-full py-3 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl shadow-lg shadow-violet-900/40 transition-all">
                    GENERAR CONCEPTO
                </button>
            </UnleashColumn>

            {/* Column 2: Resultados Creativos */}
            <UnleashColumn title="Resultados Creativos">
                <div className="text-white/30 text-center italic text-sm mt-10">
                    {selectedRecipeId ? "Genera un concepto para ver resultados." : "Selecciona un cóctel para empezar."}
                </div>
            </UnleashColumn>

            {/* Column 3: AI Panel & Control */}
            <UnleashColumn title="AI Panel & Control">
                <SectionBlock title="Nivel de Creatividad">
                    <input type="range" className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer" />
                    <div className="flex justify-between text-xs text-slate-400 mt-1">
                        <span>Conservador</span>
                        <span>Disruptivo</span>
                    </div>
                </SectionBlock>

                <SectionBlock title="Tono Narrativo">
                    <div className="flex flex-wrap gap-2">
                        {['Elegante', 'Futurista', 'Oscuro', 'Místico', 'Divertido'].map(tag => (
                            <span key={tag} className="px-3 py-1 bg-slate-800 rounded-full text-xs text-slate-300 border border-slate-700 cursor-pointer hover:border-violet-500 hover:text-white transition-colors">
                                {tag}
                            </span>
                        ))}
                    </div>
                </SectionBlock>

                <div className="mt-auto pt-4 space-y-2">
                    <button className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-lg text-sm border border-slate-700 transition-colors">
                        Exportar a Menu Design
                    </button>
                    <button className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-lg text-sm border border-slate-700 transition-colors">
                        Guardar Preset
                    </button>
                </div>
            </UnleashColumn>
        </div>
    );
};

export default SynthesisView;
