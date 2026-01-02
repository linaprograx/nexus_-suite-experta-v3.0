import React from 'react';
import { Recipe } from '../../types';

interface SynthesisViewProps {
    allRecipes: Recipe[];
}

const UnleashColumn = ({ title, children }: { title: string, children?: React.ReactNode }) => (
    <div className="h-full min-h-0 flex flex-col rounded-2xl bg-white/5 border border-white/10">
        <div className="p-4 border-b border-white/5">
            <h3 className="font-bold text-slate-400 tracking-wide text-xs uppercase opacity-80">{title}</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-8">
            {children}
        </div>
    </div>
);

const SectionBlock = ({ title, children }: { title: string, children?: React.ReactNode }) => (
    <div className="space-y-3">
        <h4 className="text-violet-400 font-medium text-[10px] uppercase tracking-wider opacity-80 pl-1">{title}</h4>
        {children}
    </div>
);

const SynthesisView: React.FC<SynthesisViewProps> = ({ allRecipes }) => {
    const [selectedRecipeId, setSelectedRecipeId] = React.useState<string>('');
    const [concept, setConcept] = React.useState('');
    const [creativityLevel, setCreativityLevel] = React.useState(50);
    const [narrativeTone, setNarrativeTone] = React.useState('Elegante');
    // State for generated result
    const [result, setResult] = React.useState<{
        name: string;
        tagline: string;
        story: string;
        sensory: { icon: string; label: string; desc: string }[];
    } | null>(null);

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

    const handleGenerate = () => {
        if (!selectedRecipeId && selectedRecipeId !== 'new') return;

        // Mock generation logic - In production, this would call Gemini API
        setResult({
            name: concept ? `The ${concept} Protocol` : "Nebula Essence",
            tagline: "Un viaje sensorial a través de la memoria.",
            story: "Este cóctel no es solo una bebida, es una cápsula del tiempo. Sus notas ahumadas evocan la nostalgia de una biblioteca antigua, mientras que el toque cítrico final nos devuelve al presente con una chispa de esperanza.",
            sensory: [
                { icon: "👁️", label: "Vista", desc: "Violeta profundo con destellos dorados." },
                { icon: "👃", label: "Olfato", desc: "Madera quemada, lavanda seca y lluvia." },
                { icon: "👅", label: "Gusto", desc: "Aterciopelado, inicio dulce y final amargo." },
                { icon: "🔊", label: "Oído", desc: "El crepitar del hielo tallado al romperse." }
            ]
        });
    };

    return (
        <div className="h-full grid grid-cols-1 lg:grid-cols-[320px,minmax(0,1fr),320px] gap-6">
            {/* Column 1: Brief & Inputs */}
            <UnleashColumn title="Brief & Inputs">
                <SectionBlock title="Selección de Cóctel">
                    <select
                        className="w-full bg-white border border-violet-200 rounded-lg p-2 text-slate-800 text-sm focus:ring-2 focus:ring-violet-500 outline-none"
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
                            className="w-full bg-white border border-violet-200 rounded-lg p-2 text-slate-800 text-sm placeholder:text-slate-400"
                            value={concept}
                            onChange={(e) => setConcept(e.target.value)}
                        />
                        <input type="text" placeholder="Emoción Deseada" className="w-full bg-white border border-violet-200 rounded-lg p-2 text-slate-800 text-sm placeholder:text-slate-400" />
                        <input type="text" placeholder="Perfil de Cliente" className="w-full bg-white border border-violet-200 rounded-lg p-2 text-slate-800 text-sm placeholder:text-slate-400" />
                        <textarea placeholder="Restricciones o Notas" className="w-full bg-white border border-violet-200 rounded-lg p-2 text-slate-800 text-sm h-20 resize-none placeholder:text-slate-400"></textarea>
                    </div>
                </SectionBlock>

                <button
                    onClick={handleGenerate}
                    disabled={!selectedRecipeId}
                    className={`w-full py-3 font-bold rounded-xl shadow-lg transition-all ${selectedRecipeId
                        ? 'bg-violet-600 hover:bg-violet-500 text-white shadow-violet-900/30'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        }`}
                >
                    GENERAR CONCEPTO
                </button>
            </UnleashColumn>

            {/* Column 2: Resultados Creativos */}
            <UnleashColumn title="Resultados Creativos">
                {!result ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
                        <div className="text-4xl mb-4 text-violet-300">✨</div>
                        <p className="text-sm italic font-medium">Define el brief y genera tu concepto.</p>
                    </div>
                ) : (
                    <div className="space-y-6 animate-fadeIn">
                        {/* Title Card */}
                        <div className="relative bg-gradient-to-br from-violet-600 to-violet-800 p-6 rounded-2xl shadow-lg shadow-violet-900/20 overflow-hidden text-white">
                            <div className="absolute top-0 right-0 p-4 opacity-20 text-9xl mix-blend-overlay">⚡</div>
                            <h2 className="text-3xl font-bold mb-2 relative z-10">{result.name}</h2>
                            <p className="text-violet-100 italic text-lg relative z-10 opacity-90">"{result.tagline}"</p>
                        </div>

                        {/* Storytelling */}
                        <div className="bg-white/60 p-6 rounded-2xl border border-violet-100">
                            <h4 className="text-xs uppercase tracking-widest text-violet-700 mb-3 font-bold">Narrativa</h4>
                            <p className="text-slate-700 leading-relaxed text-sm font-medium">{result.story}</p>
                        </div>

                        {/* Sensory Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            {result.sensory.map((s, i) => (
                                <div key={i} className="bg-white/80 p-4 rounded-xl border border-violet-100 hover:border-violet-300 transition-colors group shadow-sm">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="text-2xl group-hover:scale-110 transition-transform">{s.icon}</span>
                                        <span className="text-xs font-bold text-slate-500 uppercase">{s.label}</span>
                                    </div>
                                    <p className="text-xs text-slate-700 font-medium">{s.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </UnleashColumn>

            {/* Column 3: AI Panel & Control */}
            <UnleashColumn title="AI Panel & Control">
                <SectionBlock title="Nivel de Creatividad">
                    <input
                        type="range"
                        min="0" max="100"
                        value={creativityLevel}
                        onChange={(e) => setCreativityLevel(parseInt(e.target.value))}
                        className="w-full h-2 bg-violet-200 rounded-lg appearance-none cursor-pointer accent-violet-600"
                    />
                    <div className="flex justify-between text-xs text-violet-400 mt-1">
                        <span>Conservador</span>
                        <span>Disruptivo</span>
                    </div>
                </SectionBlock>

                <SectionBlock title="Tono Narrativo">
                    <div className="flex flex-wrap gap-2">
                        {['Elegante', 'Futurista', 'Oscuro', 'Místico', 'Divertido'].map(tag => (
                            <span
                                key={tag}
                                onClick={() => setNarrativeTone(tag)}
                                className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors border ${narrativeTone === tag
                                    ? 'bg-violet-600 text-white border-violet-600'
                                    : 'bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100'
                                    }`}
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                </SectionBlock>

                <div className="mt-auto pt-4 space-y-2">
                    <button
                        onClick={() => console.log('[Synthesis] Exportar a Menu Design clicado')}
                        className="w-full py-2 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-lg text-sm shadow-md shadow-violet-900/20 transition-colors"
                    >
                        Exportar a Menu Design
                    </button>
                    <button
                        onClick={() => console.log('[Synthesis] Guardar Preset clicado')}
                        className="w-full py-2 bg-white hover:bg-violet-50 text-violet-700 font-bold rounded-lg text-sm border border-violet-200 transition-colors"
                    >
                        Guardar Preset
                    </button>
                </div>
            </UnleashColumn>
        </div>
    );
};

export default SynthesisView;
