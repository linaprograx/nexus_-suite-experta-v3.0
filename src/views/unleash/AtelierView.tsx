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

const CustomIngredientSelector = ({ ingredients, onSelect, selectedIds }: { ingredients: any[], onSelect: (id: string) => void, selectedIds: string[] }) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [search, setSearch] = React.useState('');
    const wrapperRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    const filtered = ingredients.filter(i => i.nombre.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="relative" ref={wrapperRef}>
            <div
                className="w-full bg-white border border-cyan-200 rounded-lg p-2 text-slate-800 text-sm focus:ring-2 focus:ring-cyan-500 cursor-pointer min-h-[42px] flex flex-wrap gap-1"
                onClick={() => setIsOpen(!isOpen)}
            >
                {selectedIds.length === 0 && <span className="text-slate-400">Seleccionar ingredientes...</span>}
                {selectedIds.map(id => {
                    const ing = ingredients.find(i => i.id === id);
                    return (
                        <span key={id} className="bg-cyan-100 text-cyan-800 text-xs px-2 py-1 rounded-md flex items-center gap-1">
                            {ing?.nombre}
                            <span className="cursor-pointer hover:text-cyan-900" onClick={(e) => { e.stopPropagation(); onSelect(id); }}>×</span>
                        </span>
                    );
                })}
            </div>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-cyan-200 rounded-lg shadow-xl max-h-[200px] overflow-hidden flex flex-col animate-fadeIn">
                    <input
                        type="text"
                        placeholder="Buscar ingrediente..."
                        className="p-2 border-b border-cyan-100 text-sm outline-none text-slate-700 bg-slate-50"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        autoFocus
                    />
                    <div className="overflow-y-auto flex-1 custom-scrollbar">
                        {filtered.map(ing => (
                            <div
                                key={ing.id}
                                className={`p-2 text-sm cursor-pointer hover:bg-cyan-50 text-slate-700 ${selectedIds.includes(ing.id) ? 'bg-cyan-50 text-cyan-700 font-bold' : ''}`}
                                onClick={() => { onSelect(ing.id); }}
                            >
                                {ing.nombre}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const AtelierView: React.FC<AtelierViewProps> = ({ allIngredients }) => {
    const [selectedTechnique, setSelectedTechnique] = React.useState('Clarificado (Milk Punch)');
    const [selectedIngredientIds, setSelectedIngredientIds] = React.useState<string[]>([]);
    const [objective, setObjective] = React.useState('');

    const [techResult, setTechResult] = React.useState<{
        technique: string;
        steps: string[];
        params: { label: string; value: string }[];
        safety: string[];
    } | null>(null);

    const handleToggleIngredient = (id: string) => {
        if (selectedIngredientIds.includes(id)) {
            setSelectedIngredientIds(selectedIngredientIds.filter(i => i !== id));
        } else {
            setSelectedIngredientIds([...selectedIngredientIds, id]);
        }
    };

    const handleGenerate = () => {
        if (selectedTechnique.includes("Milk Punch")) {
            setTechResult({
                technique: "Clarificación por Milk Punch",
                steps: [
                    "Mezclar el 'batch' de espirituosas y cítricos en un recipiente.",
                    "Calentar la leche entera a 60°C (sin hervir).",
                    "Verter el 'batch' SOBRE la leche (nunca al revés).",
                    "Dejar reposar 24 horas en frío para separar los sólidos.",
                    "Filtrar con filtro de café."
                ],
                params: [
                    { label: "Tiempo Reposo", value: "24 Horas" },
                    { label: "Temperatura", value: "4°C - 60°C" },
                    { label: "Rendimiento", value: "85%" },
                    { label: "Shelf Life", value: "12 Meses" }
                ],
                safety: ["Controlar cadena de frío.", "Alérgenos: Lácteos (Caseína)."]
            });
        } else if (selectedTechnique.includes("Espuma")) {
            setTechResult({
                technique: "Espuma Estable (Sifón)",
                steps: [
                    "Hidratar la gelatina o cargar las claras en la base líquida.",
                    "Colar la mezcla muy fina para evitar obstrucciones.",
                    "Llenar el sifón máximo 3/4 de su capacidad.",
                    "Cargar 2 cargas de N2O, agitando vigorosamente entre cargas.",
                    "Reposar en frío minimo 2 horas antes de usar."
                ],
                params: [
                    { label: "Cargas N2O", value: "2 Unidades" },
                    { label: "Estabilizante", value: "Gelatina/Claras" },
                    { label: "Temp Servicio", value: "4°C - 8°C" },
                    { label: "Densidad", value: "Aireada" }
                ],
                safety: ["Revisar estado de gomas del sifón.", "No exceder presión recomendada."]
            });
        } else if (selectedTechnique.includes("Fat Wash")) {
            setTechResult({
                technique: "Fat Washing Ochos",
                steps: [
                    "Fundir la materia grasa (mantequilla, aceite coco, bacon) a 60°C.",
                    "Mezclar con el destilado en proporción 1:10 (grasa:alcohol).",
                    "Dejar macerar a temperatura ambiente 4 horas agitando ocasionalmente.",
                    "Congelar el recipiente (-18°C) durante 12 horas hasta que la grasa solidifique.",
                    "Retirar la capa sólida de grasa y filtrar el líquido por filtro de café."
                ],
                params: [
                    { label: "Ratio", value: "1:10" },
                    { label: "Tiempo Congelado", value: "12 Horas" },
                    { label: "Temp Maceración", value: "20°C (Ambiente)" },
                    { label: "Pérdida", value: "~15%" }
                ],
                safety: ["Asegurar retirada total de sólidos grasos (enranciamiento).", "Etiquetar alérgenos si usa frutos secos/lácteos."]
            });
        } else if (selectedTechnique.includes("Sous-Vide")) {
            setTechResult({
                technique: "Infusión Controlada Sous-Vide",
                steps: [
                    "Envasar al vacío el destilado con los botánicos.",
                    "Configurar el baño térmico a 55°C.",
                    "Sumergir la bolsa y cocinar durante 2 horas.",
                    "Enfriar rápidamente en baño de agua y hielo (choque térmico).",
                    "Filtrar y embotellar."
                ],
                params: [
                    { label: "Temperatura", value: "55°C" },
                    { label: "Tiempo", value: "2 Horas" },
                    { label: "Vacío", value: "Total (99%)" },
                    { label: "Extracción", value: "Rápida/Intensa" }
                ],
                safety: ["Utilizar bolsas aptas para cocción.", "No superar graduación que evapore alcohol si no está sellado."]
            });
        } else if (selectedTechnique.includes("Esferificación")) {
            setTechResult({
                technique: "Esferificación Inversa (Estable)",
                steps: [
                    "Mezclar el ingrediente base con Lactato de Calcio (2%).",
                    "Congelar en moldes semiesféricos para facilitar la inmersión.",
                    "Preparar el baño de Alginato de Sodio (0.5%) en agua destilada.",
                    "Baño: Triturar, reposar 12h para eliminar aire.",
                    "Sumergir las esferas congeladas en el baño tibio (40°C) durante 3 min.",
                    "Enjuagar en agua limpia y reservar en su propio líquido."
                ],
                params: [
                    { label: "Baño Alginato", value: "0.5% (5g/L)" },
                    { label: "Base Calcio", value: "2.0% (20g/L)" },
                    { label: "PH Base", value: "> 4.0" },
                    { label: "Tiempo Baño", value: "3 Minutos" }
                ],
                safety: ["El PH ácido (<4) impide la gelificación (usar citrato).", "Evitar exceso de calcio (amargor)."]
            });
        } else {
            // Fallback
            setTechResult({
                technique: selectedTechnique,
                steps: ["Protocolo estándar pendiente de generación."],
                params: [{ label: "Estado", value: "Pendiente" }],
                safety: ["Revisar bibliografía técnica."]
            });
        }
    };

    return (
        <div className="h-full grid grid-cols-1 lg:grid-cols-[320px,minmax(0,1fr),320px] gap-6">
            {/* Column 1: Selector Técnico */}
            <UnleashColumn title="Selección Técnica">
                <SectionBlock title="Tipo de Técnica">
                    <select
                        className="w-full bg-white border border-cyan-200 rounded-lg p-2 text-slate-800 text-sm focus:ring-2 focus:ring-cyan-500 outline-none"
                        value={selectedTechnique}
                        onChange={(e) => setSelectedTechnique(e.target.value)}
                    >
                        <option>Espuma / Aire</option>
                        <option>Clarificado (Milk Punch)</option>
                        <option>Esferificación</option>
                        <option>Fat Wash</option>
                        <option>Infusión Sous-Vide</option>
                    </select>
                </SectionBlock>

                <SectionBlock title="Ingredientes Clave">
                    <CustomIngredientSelector
                        ingredients={allIngredients}
                        selectedIds={selectedIngredientIds}
                        onSelect={handleToggleIngredient}
                    />
                </SectionBlock>

                <SectionBlock title="Objetivo Técnico">
                    <textarea
                        className="w-full bg-white border border-cyan-200 rounded-lg p-2 text-slate-800 text-sm h-24 resize-none placeholder:text-slate-400 focus:ring-2 focus:ring-cyan-500 outline-none"
                        placeholder="Describe el resultado buscado (ej. Textura sedosa, clarificación cristalina, sabor intenso a bacon...)"
                        value={objective}
                        onChange={(e) => setObjective(e.target.value)}
                    ></textarea>
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
