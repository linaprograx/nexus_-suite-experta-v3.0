import React from 'react';

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
        <h4 className="text-emerald-300 font-semibold mb-3 text-sm uppercase tracking-wider">{title}</h4>
        {children}
    </div>
);

const OcrMasterView: React.FC = () => {
    return (
        <div className="h-full grid grid-cols-1 lg:grid-cols-[320px,minmax(0,1fr),320px] gap-6">
            {/* Column 1: Selector Económico */}
            <UnleashColumn title="Selector Económico">
                <SectionBlock title="Receta a Analizar">
                    <select className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none">
                        <option>Seleccionar Receta...</option>
                    </select>
                </SectionBlock>

                <SectionBlock title="Proveedor Base">
                    <select className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none">
                        <option>Proveedor Principal (Default)</option>
                        <option>Comparativa Global</option>
                    </select>
                </SectionBlock>

                <button className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-900/40 transition-all mt-4">
                    CALCULAR COSTE
                </button>
            </UnleashColumn>

            {/* Column 2: Análisis de Coste */}
            <UnleashColumn title="Análisis de Coste">
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 text-center">
                        <span className="text-xs text-slate-400 uppercase tracking-wider block mb-1">Coste x Copa</span>
                        <span className="text-2xl font-bold text-white">-- €</span>
                    </div>
                    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 text-center">
                        <span className="text-xs text-slate-400 uppercase tracking-wider block mb-1">Margen Actual</span>
                        <span className="text-2xl font-bold text-white">-- %</span>
                    </div>
                </div>

                <div className="text-white/30 text-center italic text-sm mt-10">
                    Selecciona una receta para ver el desglose detallado.
                </div>
            </UnleashColumn>

            {/* Column 3: Optimización */}
            <UnleashColumn title="Optimización">
                <SectionBlock title="Sugerencias de Ahorro">
                    <div className="space-y-3">
                        <div className="p-3 bg-emerald-900/10 border border-emerald-900/30 rounded-lg flex items-start gap-3">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0"></div>
                            <p className="text-xs text-slate-300">
                                Sin análisis activo. Calcula el coste para recibir sugerencias de sustitutos o proveedores.
                            </p>
                        </div>
                    </div>
                </SectionBlock>
            </UnleashColumn>
        </div>
    );
};

export default OcrMasterView;
