import React, { useState } from 'react';
import { Icon } from '../../components/ui/Icon';
import { ICONS } from '../../components/ui/icons';

// --- Types ---
type Station = 'Barra Principal' | 'Estación Fría' | 'Estación Caliente' | 'Pasillos' | 'Lavadero' | 'Almacén';
type Scenario = 'Servicio Lento' | 'Servicio Medio' | 'Rush (Intenso)';
type Finding = { id: string; title: string; severity: 'high' | 'medium' | 'low'; lostTime: string; suggestion: string };

const AvatarColumn = ({ title, children }: { title: string, children?: React.ReactNode }) => (
    <div className="h-full min-h-0 flex flex-col rounded-2xl border border-slate-700/50 overflow-hidden bg-slate-800/20 backdrop-blur-md shadow-xl ring-1 ring-white/5">
        <div className="p-4 border-b border-slate-700/50 bg-slate-800/40">
            <h3 className="font-bold text-slate-300 tracking-wide text-xs uppercase flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                {title}
            </h3>
        </div>
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-4 relative">
            {children}
        </div>
    </div>
);

const DtoXView: React.FC = () => {
    // State
    const [selectedStation, setSelectedStation] = useState<Station>('Barra Principal');
    const [selectedScenario, setSelectedScenario] = useState<Scenario>('Servicio Medio');
    const [isSimulating, setIsSimulating] = useState(false);
    const [simulationResult, setSimulationResult] = useState<any | null>(null);

    // Mock Data
    const findings: Finding[] = [
        { id: '1', title: 'Cuello de Botella', severity: 'high', lostTime: '15s/ticket', suggestion: 'Mover garnish de cítricos a estación central.' },
        { id: '2', title: 'Ergonomía Deficiente', severity: 'medium', lostTime: '5s/ticket', suggestion: 'Altura de speed rail requiere flexión excesiva.' },
        { id: '3', title: 'Cruce de Flujos', severity: 'medium', lostTime: '8s/ticket', suggestion: 'Ruta de runner cruza con bartender principal.' },
    ];

    const handleSimulate = () => {
        setIsSimulating(true);
        setSimulationResult(null);
        setTimeout(() => {
            setIsSimulating(false);
            setSimulationResult({
                efficiency: '82%',
                stressLevel: 'Alto',
                cocktailsPerHour: 45
            });
        }, 2000);
    };

    return (
        <div className="h-full grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Column 1: Mapa Operativo */}
            <AvatarColumn title="Mapa Operativo">
                <div className="space-y-6">
                    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-3">Estación / Área</label>
                        <div className="space-y-2">
                            {['Barra Principal', 'Estación Fría', 'Estación Caliente', 'Almacén'].map((s) => (
                                <button
                                    key={s}
                                    onClick={() => setSelectedStation(s as Station)}
                                    className={`w-full text-left px-4 py-3 rounded-lg text-sm transition-all border ${selectedStation === s
                                            ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-200 shadow-[0_0_15px_rgba(99,102,241,0.15)]'
                                            : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                                        }`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-3">Escenario de Carga</label>
                        <select
                            className="w-full bg-slate-900/60 border border-slate-700 rounded-lg p-3 text-slate-300 text-sm outline-none focus:ring-2 focus:ring-indigo-500/50"
                            value={selectedScenario}
                            onChange={(e) => setSelectedScenario(e.target.value as Scenario)}
                        >
                            <option>Servicio Lento</option>
                            <option>Servicio Medio</option>
                            <option>Rush (Intenso)</option>
                        </select>
                    </div>

                    <button
                        onClick={handleSimulate}
                        disabled={isSimulating}
                        className="w-full py-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-900/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isSimulating ? (
                            <>
                                <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></span>
                                Simulando Flujos...
                            </>
                        ) : (
                            <>
                                <Icon svg={ICONS.activity} className="w-5 h-5" />
                                SIMULAR FLUJO
                            </>
                        )}
                    </button>

                    {/* Visual Placeholder for Spatial Map */}
                    <div className="aspect-video bg-slate-900/80 rounded-xl border border-slate-700/50 relative overflow-hidden flex items-center justify-center group">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.15),transparent_70%)]"></div>
                        <div className="grid grid-cols-6 grid-rows-4 gap-1 w-3/4 h-3/4 opacity-20 group-hover:opacity-40 transition-opacity">
                            {[...Array(24)].map((_, i) => <div key={i} className="border border-indigo-400/30 rounded-sm"></div>)}
                        </div>
                        <span className="absolute text-xs font-mono text-indigo-400 tracking-widest bg-slate-950/80 px-3 py-1 rounded-full border border-indigo-500/30 backdrop-blur-sm">
                            VISTA ESPACIAL :: {selectedStation.toUpperCase()}
                        </span>
                    </div>
                </div>
            </AvatarColumn>

            {/* Column 2: Auditoría 360 */}
            <AvatarColumn title="Auditoría 360°">
                {!simulationResult ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-60">
                        <Icon svg={ICONS.radar} className="w-12 h-12 mb-4 text-slate-600" />
                        <p className="text-sm font-medium">Esperando simulación...</p>
                    </div>
                ) : (
                    <div className="space-y-4 animate-fadeIn">
                        <div className="flex gap-3 mb-6">
                            <div className="flex-1 bg-slate-800/80 p-3 rounded-lg border border-slate-700 text-center">
                                <div className="text-[10px] text-slate-500 uppercase">Eficiencia</div>
                                <div className="text-xl font-bold text-emerald-400">{simulationResult.efficiency}</div>
                            </div>
                            <div className="flex-1 bg-slate-800/80 p-3 rounded-lg border border-slate-700 text-center">
                                <div className="text-[10px] text-slate-500 uppercase">Nivel Estrés</div>
                                <div className="text-xl font-bold text-orange-400">{simulationResult.stressLevel}</div>
                            </div>
                        </div>

                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Hallazgos Operativos</h4>
                        {findings.map(f => (
                            <div key={f.id} className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/50 hover:border-slate-600 transition-colors group">
                                <div className="flex justify-between items-start mb-2">
                                    <h5 className="font-bold text-slate-200 text-sm flex items-center gap-2">
                                        {f.severity === 'high' && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>}
                                        {f.severity === 'medium' && <span className="w-2 h-2 rounded-full bg-amber-500"></span>}
                                        {f.title}
                                    </h5>
                                    <span className="text-[10px] font-mono text-red-400 bg-red-900/10 px-1.5 py-0.5 rounded border border-red-900/20">
                                        -{f.lostTime}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-400 mb-3 leading-relaxed">
                                    {f.suggestion}
                                </p>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button className="flex-1 py-1.5 text-[10px] font-bold bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20 hover:bg-emerald-500/20">
                                        ACEPTAR CAMBIO
                                    </button>
                                    <button className="px-3 py-1.5 text-[10px] font-bold bg-slate-700 text-slate-400 rounded-lg hover:bg-slate-600">
                                        DESCARTAR
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </AvatarColumn>

            {/* Column 3: Entrenamiento */}
            <AvatarColumn title="Entrenamiento & Config">
                <div className="space-y-6">
                    {/* Training Mode */}
                    <SectionBlock title="Modo Competición">
                        <div className="grid grid-cols-2 gap-3 mb-3">
                            <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-700 text-center cursor-pointer hover:border-indigo-500/50 transition-colors">
                                <div className="text-2xl mb-1">⚡️</div>
                                <div className="text-[10px] font-bold text-slate-300">SPEED ROUND</div>
                            </div>
                            <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-700 text-center cursor-pointer hover:border-indigo-500/50 transition-colors">
                                <div className="text-2xl mb-1">🎯</div>
                                <div className="text-[10px] font-bold text-slate-300">PRECISIÓN</div>
                            </div>
                        </div>
                        <button className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-bold rounded-lg border border-slate-600 transition-all">
                            INICIAR CRONÓMETRO VR
                        </button>
                    </SectionBlock>

                    {/* Widget Builder */}
                    <SectionBlock title="KPI Widgets">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between p-2 bg-slate-800/40 rounded-lg border border-slate-700/50">
                                <span className="text-xs text-slate-400">Tiempo/Cóctel</span>
                                <div className="w-8 h-4 bg-indigo-500/20 rounded-full relative cursor-pointer border border-indigo-500/50">
                                    <div className="absolute right-0.5 top-0.5 w-3 h-3 bg-indigo-400 rounded-full shadow-sm"></div>
                                </div>
                            </div>
                            <div className="flex items-center justify-between p-2 bg-slate-800/40 rounded-lg border border-slate-700/50">
                                <span className="text-xs text-slate-400">Fatiga Física</span>
                                <div className="w-8 h-4 bg-slate-700 rounded-full relative cursor-pointer">
                                    <div className="absolute left-0.5 top-0.5 w-3 h-3 bg-slate-500 rounded-full"></div>
                                </div>
                            </div>
                        </div>
                        <button className="w-full mt-3 py-1.5 border border-dashed border-slate-600 text-slate-500 text-xs rounded-lg hover:bg-slate-800 hover:text-slate-300 transition-colors">
                            + Agregar Widget
                        </button>
                    </SectionBlock>

                    {/* Export */}
                    <div className="mt-auto pt-4 border-t border-slate-700/50">
                        <button className="w-full py-3 bg-slate-100 hover:bg-white text-slate-900 font-bold rounded-xl shadow-lg shadow-slate-900/20 transition-all flex items-center justify-center gap-2 text-xs">
                            <Icon svg={ICONS.fileText} className="w-4 h-4 text-indigo-600" />
                            EXPORTAR REPORTE OPERATIVO
                        </button>
                    </div>
                </div>
            </AvatarColumn>
        </div>
    );
};

// Helper internal component
const SectionBlock = ({ title, children }: { title: string, children?: React.ReactNode }) => (
    <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-700/50 shadow-sm">
        <h4 className="text-indigo-400/80 font-bold mb-3 text-[10px] uppercase tracking-wider">{title}</h4>
        {children}
    </div>
);

export default DtoXView;
