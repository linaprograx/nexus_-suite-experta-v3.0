import React from 'react';
import { Area, AreaChart, CartesianGrid, PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Icon } from '../../components/ui/Icon';
import { ICONS } from '../../components/ui/icons';

// --- Types ---
interface KpiData {
    label: string;
    value: string;
    trend: number;
    trendLabel: string;
}

// --- Components ---

const AvatarColumn = ({ title, children, accentColor = "bg-orange-500" }: { title: string, children?: React.ReactNode, accentColor?: string }) => (
    <div className="h-full min-h-0 flex flex-col overflow-hidden">
        {/* Transparent Header */}
        <div className="pb-4 flex justify-between items-center px-2">
            <h3 className="font-bold text-orange-900 tracking-wide text-xs uppercase flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${accentColor} shadow-[0_0_10px_rgba(251,146,60,0.5)]`}></span>
                {title}
            </h3>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 relative px-2 pb-2">
            {children}
        </div>
    </div>
);

// High-Tech "Insight" Card Style (Orange Theme)
const InsightCard = ({ children, className = "", active = false }: { children: React.ReactNode, className?: string, active?: boolean }) => (
    <div className={`
        rounded-xl backdrop-blur-md transition-all duration-300
        ${active
            ? 'bg-orange-500/20 border border-orange-400 shadow-[0_0_20px_rgba(251,146,60,0.2)]'
            : 'bg-white/50 border border-orange-900/10 hover:bg-orange-50 hover:border-orange-500/30'}
        ${className}
    `}>
        {children}
    </div>
);

const KpiCard = ({ data }: { data: KpiData }) => (
    <InsightCard className="p-4 flex flex-col gap-2">
        <span className="text-[10px] uppercase font-bold text-orange-600/70 tracking-wider">{data.label}</span>
        <div className="flex justify-between items-end">
            <span className="text-2xl font-black text-slate-800">{data.value}</span>
            <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 ${data.trend >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                {data.trend >= 0 ? '+' : ''}{data.trend}%
                <Icon svg={data.trend >= 0 ? ICONS.trendingUp : ICONS.trending} className="w-3 h-3" />
            </div>
        </div>
    </InsightCard>
);

const AvatarInsightsView: React.FC = () => {
    // Mock Data
    const kpis: KpiData[] = [
        { label: 'Ventas Totales', value: '$12,450', trend: 12.5, trendLabel: 'vs semana pasada' },
        { label: 'Ticket Medio', value: '$45.20', trend: -2.3, trendLabel: 'vs semana pasada' },
        { label: 'Coste (COGS)', value: '24.8%', trend: -1.5, trendLabel: 'Optimizado' },
        { label: 'Margen Bruto', value: '75.2%', trend: 1.2, trendLabel: 'Saludable' },
    ];

    const radarData = [
        { subject: 'Eficiencia', A: 120, fullMark: 150 },
        { subject: 'Calidad', A: 98, fullMark: 150 },
        { subject: 'Velocidad', A: 86, fullMark: 150 },
        { subject: 'Coste', A: 99, fullMark: 150 },
        { subject: 'Sostenibilidad', A: 85, fullMark: 150 },
        { subject: 'Innovación', A: 65, fullMark: 150 },
    ];

    const areaData = [
        { name: '18:00', uv: 4000, pv: 2400, amt: 2400 },
        { name: '19:00', uv: 3000, pv: 1398, amt: 2210 },
        { name: '20:00', uv: 2000, pv: 9800, amt: 2290 },
        { name: '21:00', uv: 2780, pv: 3908, amt: 2000 },
        { name: '22:00', uv: 1890, pv: 4800, amt: 2181 },
        { name: '23:00', uv: 2390, pv: 3800, amt: 2500 },
        { name: '00:00', uv: 3490, pv: 4300, amt: 2100 },
    ];

    const handleOpenInsights = () => {
        console.log('[Avatar Insights] Opening full analysis...');
        // Placeholder for navigation or modal logic
    };

    return (
        <div className="h-full grid grid-cols-1 lg:grid-cols-3 gap-6 text-slate-800">

            {/* Column 1: Context & Health */}
            <AvatarColumn title="Contexto & Salud">
                <div className="space-y-4">
                    {/* Context Selectors in a Card */}
                    <InsightCard className="p-4 space-y-3">
                        <div>
                            <label className="text-[10px] font-bold text-orange-600/70 uppercase mb-1 block">Periodo de Análisis</label>
                            <select className="w-full bg-white border border-orange-200 rounded p-1.5 text-xs font-bold text-slate-700 outline-none focus:border-orange-400">
                                <option>Turno Actual (Live)</option>
                                <option>Últimas 24 Horas</option>
                                <option>Esta Semana</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-orange-600/70 uppercase mb-1 block">Área Operativa</label>
                            <select className="w-full bg-white border border-orange-200 rounded p-1.5 text-xs font-bold text-slate-700 outline-none focus:border-orange-400">
                                <option>Global (Todas)</option>
                                <option>Barra Principal</option>
                                <option>Cocktail Lounge</option>
                            </select>
                        </div>
                    </InsightCard>

                    {/* KPI Grid */}
                    <div className="grid grid-cols-2 gap-3">
                        {kpis.map((kpi, idx) => (
                            <KpiCard key={idx} data={kpi} />
                        ))}
                    </div>

                    {/* AI Alert Card */}
                    <InsightCard className="p-4 bg-gradient-to-br from-rose-50 to-orange-50 border-orange-200">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-1.5 bg-rose-100 rounded text-rose-600">
                                <Icon svg={ICONS.alert} className="w-4 h-4" />
                            </div>
                            <h4 className="text-xs font-bold text-rose-700 uppercase">Alertas Críticas</h4>
                        </div>
                        <ul className="space-y-2">
                            <li className="text-xs text-slate-600 flex justify-between items-center bg-white/50 p-2 rounded border border-orange-100">
                                <span>Stock bajo: Tequila Blanco</span>
                                <span className="text-[10px] text-rose-500 font-bold uppercase bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100">Urgente</span>
                            </li>
                            <li className="text-xs text-slate-600 flex justify-between items-center bg-white/50 p-2 rounded border border-orange-100">
                                <span>Mantenimiento: Ice Machine</span>
                                <span className="text-[10px] text-amber-500 font-bold uppercase bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">Hoy</span>
                            </li>
                        </ul>
                    </InsightCard>
                </div>
            </AvatarColumn>

            {/* Column 2: Performance */}
            <AvatarColumn title="Rendimiento Financiero" accentColor="bg-blue-500">
                <div className="space-y-4">
                    <InsightCard className="p-4 bg-white/50">
                        <div className="h-[200px] w-full">
                            {areaData && areaData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={areaData}>
                                        <defs>
                                            <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                            itemStyle={{ fontSize: '12px', fontWeight: 'bold', color: '#1e293b' }}
                                        />
                                        <Area type="monotone" dataKey="uv" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorUv)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex h-full items-center justify-center text-xs text-slate-400">Cargando datos financieros...</div>
                            )}
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-4">
                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Margen Cocktail</span>
                                <p className="text-xl font-black text-slate-700">82%</p>
                            </div>
                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Desperdicio</span>
                                <p className="text-xl font-black text-emerald-600">1.2%</p>
                            </div>
                        </div>
                    </InsightCard>

                    <InsightCard className="aspect-square relative p-4 bg-white/50 flex flex-col items-center justify-center">
                        <h4 className="absolute top-4 left-4 text-[10px] font-bold text-slate-400 uppercase">Salud Operativa (Radar)</h4>
                        <div className="w-full h-full">
                            {radarData && radarData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                        <PolarGrid stroke="#e2e8f0" />
                                        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#64748b' }} />
                                        <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                                        <Radar name="Actual" dataKey="A" stroke="#fb923c" strokeWidth={3} fill="#fb923c" fillOpacity={0.3} />
                                    </RadarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex h-full items-center justify-center text-xs text-slate-400">Analizando...</div>
                            )}
                        </div>
                    </InsightCard>
                </div>
            </AvatarColumn>

            {/* Column 3: Command Center */}
            <AvatarColumn title="Centro de Comando" accentColor="bg-slate-800">
                <div className="space-y-3">
                    {[
                        { label: 'Exportar Reporte PDF', icon: ICONS.fileText || ICONS.book, color: 'bg-orange-500 text-white hover:bg-orange-600' },
                        { label: 'Guardar Snapshot', icon: ICONS.camera, color: 'bg-orange-500 text-white hover:bg-orange-600' },
                        { label: 'Configurar Alertas', icon: ICONS.bell || ICONS.alert, color: 'bg-orange-500 text-white hover:bg-orange-600' },
                    ].map((btn, i) => (
                        <button key={i} className={`w-full py-4 rounded-xl ${btn.color} shadow-lg shadow-slate-200 flex items-center justify-between px-6 transition-transform hover:scale-[1.02]`}>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/10 rounded-lg">
                                    <Icon svg={btn.icon} className="w-5 h-5" />
                                </div>
                                <span className="font-bold text-sm">{btn.label}</span>
                            </div>
                            <Icon svg={ICONS.arrowRight} className="w-4 h-4 opacity-50" />
                        </button>
                    ))}

                    <InsightCard className="p-6 mt-6 bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-none shadow-xl shadow-indigo-200">
                        <div className="flex justify-between items-start mb-4">
                            <h4 className="text-sm font-bold opacity-90">AI Insights Assistant</h4>
                            <span className="px-2 py-0.5 bg-white/20 rounded text-[10px] font-bold">BETA</span>
                        </div>
                        <p className="text-xs opacity-80 mb-6 leading-relaxed">
                            "Se detecta un patrón de consumo inusual en 'Signature Cocktails' entre 21:00-23:00. Sugiero aumentar stock de guarniciones cítricas."
                        </p>
                        <button
                            onClick={handleOpenInsights}
                            className="w-full py-3 bg-white text-orange-600 font-bold rounded-lg text-xs hover:bg-orange-50 transition-colors shadow-sm"
                        >
                            VER ANÁLISIS COMPLETO
                        </button>
                    </InsightCard>
                </div>
            </AvatarColumn>
        </div>
    );
};

export default AvatarInsightsView;
