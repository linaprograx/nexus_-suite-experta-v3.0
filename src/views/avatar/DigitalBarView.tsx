import React, { useState, useEffect } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Icon } from '../../components/ui/Icon';
import { ICONS } from '../../components/ui/icons';

// --- Types ---
interface Zone {
    id: string;
    name: string;
    status: 'operational' | 'busy' | 'critical';
    staff: number;
    efficiency: number;
}

interface SimulationMetric {
    time: string;
    efficiency: number;
    tickets: number;
    stress: number;
}

// --- Components ---

const AvatarColumn = ({ title, children, accentColor = "bg-cyan-500" }: { title: string, children?: React.ReactNode, accentColor?: string }) => (
    <div className="h-full min-h-0 flex flex-col overflow-hidden">
        {/* Transparent Header */}
        <div className="pb-4 flex justify-between items-center px-2">
            <h3 className="font-bold text-cyan-800 tracking-wide text-xs uppercase flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${accentColor} shadow-[0_0_10px_rgba(34,211,238,0.5)]`}></span>
                {title}
            </h3>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 relative px-2 pb-2">
            {children}
        </div>
    </div>
);

// High-Tech "Cyber" Card Style (Cyan Theme, No Black)
const CyberCard = ({ children, className = "", active = false }: { children: React.ReactNode, className?: string, active?: boolean }) => (
    <div className={`
        rounded-xl backdrop-blur-md transition-all duration-300
        ${active
            ? 'bg-cyan-500/20 border border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.2)]'
            : 'bg-white/50 border border-cyan-900/10 hover:bg-cyan-50 hover:border-cyan-500/30'}
        ${className}
    `}>
        {children}
    </div>
);

const DigitalBarView: React.FC = () => {
    // --- State ---
    const [selectedZone, setSelectedZone] = useState<string>('bar-main');
    const [isSimulating, setIsSimulating] = useState(false);
    const [simData, setSimData] = useState<SimulationMetric[]>([]);

    // 3D View State
    const [zoom, setZoom] = useState(1);
    const [viewMode, setViewMode] = useState<'overview' | 'detail'>('overview');

    // Config State
    const [config, setConfig] = useState({
        staffCount: 3,
        autoRestock: true,
        iceMachineStatus: 'operational',
    });

    const zones: Zone[] = [
        { id: 'bar-main', name: 'Barra Principal', status: 'operational', staff: 2, efficiency: 92 },
        { id: 'service', name: 'Service Bar', status: 'busy', staff: 1, efficiency: 78 },
        { id: 'prep', name: 'Prep Lab', status: 'operational', staff: 0, efficiency: 100 },
        { id: 'storage', name: 'Almacén', status: 'critical', staff: 0, efficiency: 45 },
    ];

    useEffect(() => {
        if (!isSimulating) return;
        const interval = setInterval(() => {
            setSimData(prev => {
                const newMetric = {
                    time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                    efficiency: 70 + Math.random() * 25,
                    tickets: 10 + Math.floor(Math.random() * 20),
                    stress: 30 + Math.random() * 50
                };
                const newData = [...prev, newMetric];
                if (newData.length > 20) newData.shift();
                return newData;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [isSimulating]);

    const handleToggleSim = () => {
        if (isSimulating) {
            setIsSimulating(false);
        } else {
            setSimData(Array(10).fill(0).map((_, i) => ({
                time: `00:0${i}`,
                efficiency: 80,
                tickets: 15,
                stress: 40
            }))); // Reset/Init Data
            setIsSimulating(true);
        }
    };

    // 3D Transforms based on state
    const getSceneTransform = () => {
        const base = `rotateX(60deg) rotateZ(-45deg)`;
        if (viewMode === 'detail' && selectedZone === 'bar-main') return `${base} translateZ(50px) scale(1.5) translateX(20px)`;
        if (viewMode === 'detail' && selectedZone === 'service') return `${base} translateZ(50px) scale(1.5) translateX(-20px) translateY(20px)`;
        return `${base} scale(${zoom})`;
    };

    return (
        <div className="h-full grid grid-cols-1 lg:grid-cols-3 gap-6 text-cyan-900">

            {/* Column 1: Spatial Twin (Hologram) */}
            <AvatarColumn title="Spatial Twin">
                <div className="space-y-4 h-full flex flex-col">
                    {/* 3D Holographic Container */}
                    <div className="aspect-square bg-gradient-to-br from-cyan-900/5 to-cyan-500/5 rounded-2xl border border-cyan-500/20 relative overflow-hidden group perspective-[1200px] flex items-center justify-center shadow-inner">

                        {/* 3D Scene */}
                        <div
                            className="relative w-64 h-64 transition-transform duration-1000 ease-in-out transform-style-3d"
                            style={{ transform: getSceneTransform() }}
                        >
                            {/* Floor Grid */}
                            <div className="absolute inset-0 bg-cyan-500/5 border border-cyan-500/10 grid grid-cols-8 grid-rows-8" style={{ transformStyle: 'preserve-3d' }}>
                                {[...Array(64)].map((_, i) => <div key={i} className="border-[0.5px] border-cyan-500/10"></div>)}
                            </div>

                            {/* --- 3D Objects --- */}

                            {/* Object: Main Bar Counter */}
                            <div
                                onClick={() => { setSelectedZone('bar-main'); setViewMode('detail'); }}
                                className="absolute top-10 left-10 w-40 h-8 bg-cyan-600/80 border border-cyan-400 shadow-lg cursor-pointer hover:bg-cyan-500 transition-colors"
                                style={{ transform: 'translateZ(10px)', transformStyle: 'preserve-3d' }}
                            >
                                <div className="absolute inset-0 flex items-center justify-center text-[6px] font-bold text-white tracking-widest">MAIN BAR</div>
                                {/* Bar Height */}
                                <div className="absolute top-full left-0 w-full h-8 bg-cyan-700 origin-top rotate-x-[-90deg]"></div>
                                <div className="absolute top-0 right-0 h-full w-8 bg-cyan-800 origin-right rotate-y-[90deg]"></div>
                                <div className="absolute top-0 left-0 h-full w-8 bg-cyan-800 origin-left rotate-y-[-90deg]"></div>

                                {/* Bottles on Counter */}
                                <div className="absolute -top-1 left-2 w-1 h-3 bg-amber-400/80 transform-style-3d translate-z-10 rotate-x-[-90deg]"></div>
                                <div className="absolute -top-1 left-4 w-1 h-3 bg-rose-400/80 transform-style-3d translate-z-10 rotate-x-[-90deg]"></div>
                                <div className="absolute -top-1 left-8 w-1 h-3 bg-emerald-400/80 transform-style-3d translate-z-10 rotate-x-[-90deg]"></div>
                            </div>

                            {/* Object: Back Bar / Shelves */}
                            <div
                                className="absolute top-2 left-10 w-40 h-4 bg-slate-800 border border-cyan-600/50"
                                style={{ transform: 'translateZ(30px)', transformStyle: 'preserve-3d' }}
                            >
                                <div className="absolute top-full left-0 w-full h-20 bg-slate-700 origin-top rotate-x-[-90deg]"></div>
                            </div>

                            {/* Object: Service Station */}
                            <div
                                onClick={() => { setSelectedZone('service'); setViewMode('detail'); }}
                                className="absolute bottom-10 right-10 w-16 h-16 bg-indigo-600/80 border border-indigo-400 cursor-pointer hover:bg-indigo-500 transition-colors"
                                style={{ transform: 'translateZ(10px)', transformStyle: 'preserve-3d' }}
                            >
                                <div className="absolute inset-0 flex items-center justify-center text-[6px] font-bold text-white">SVC</div>
                                <div className="absolute top-full left-0 w-full h-6 bg-indigo-700 origin-top rotate-x-[-90deg]"></div>
                                <div className="absolute top-0 right-0 h-full w-6 bg-indigo-800 origin-right rotate-y-[90deg]"></div>
                            </div>

                            {/* Object: Clients (Holographic Cylinders) */}
                            {[1, 2, 3, 4].map((c, i) => (
                                <div
                                    key={i}
                                    className="absolute w-3 h-3 rounded-full bg-cyan-400/60 shadow-[0_0_10px_rgba(34,211,238,0.8)] animate-pulse"
                                    style={{
                                        top: `${20 + i * 15}px`,
                                        left: '60px',
                                        transform: `translateZ(0px)` // Floor level
                                    }}
                                >
                                    {/* Client Body */}
                                    <div className="absolute w-full h-8 bg-cyan-400/30 bottom-0 left-0 origin-bottom rotate-x-[-90deg] translate-z-4 rounded-full"></div>
                                </div>
                            ))}
                        </div>

                        {/* HUD Controls */}
                        <div className="absolute bottom-4 right-4 flex flex-col gap-2">
                            <button onClick={() => setZoom(z => Math.min(z + 0.2, 2))} className="w-6 h-6 bg-white/10 hover:bg-white/20 rounded-full text-cyan-500 font-bold flex items-center justify-center shadow backdrop-blur">+</button>
                            <button onClick={() => setZoom(z => Math.max(z - 0.2, 0.5))} className="w-6 h-6 bg-white/10 hover:bg-white/20 rounded-full text-cyan-500 font-bold flex items-center justify-center shadow backdrop-blur">-</button>
                            <button onClick={() => { setViewMode('overview'); setZoom(1); }} className="w-6 h-6 bg-white/10 hover:bg-white/20 rounded-full text-cyan-500 flex items-center justify-center shadow backdrop-blur">
                                <Icon svg={ICONS.refreshCw} className="w-3 h-3" />
                            </button>
                        </div>

                        <div className="absolute top-4 left-4">
                            <span className="text-[10px] font-bold text-cyan-600 bg-cyan-100/50 px-2 py-1 rounded backdrop-blur-sm border border-cyan-200">
                                {viewMode === 'overview' ? 'VISTA GENERAL' : `DETALLE: ${selectedZone.toUpperCase()}`}
                            </span>
                        </div>
                    </div>

                    {/* Zone List */}
                    <div className="space-y-2">
                        {zones.map(zone => (
                            <CyberCard
                                key={zone.id}
                                active={selectedZone === zone.id}
                                className="p-3 cursor-pointer flex justify-between items-center"
                            >
                                <div onClick={() => setSelectedZone(zone.id)}>
                                    <h4 className="text-xs font-bold text-cyan-900 uppercase">{zone.name}</h4>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className={`w-1.5 h-1.5 rounded-full ${zone.status === 'operational' ? 'bg-emerald-500' : zone.status === 'busy' ? 'bg-amber-500' : 'bg-rose-500'}`}></div>
                                        <span className="text-[10px] text-cyan-700 opacity-70"> Estado: {zone.status}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-xl font-bold text-cyan-800">{zone.efficiency}%</span>
                                    <p className="text-[9px] text-cyan-600 font-bold">EFICIENCIA</p>
                                </div>
                            </CyberCard>
                        ))}
                    </div>
                </div>
            </AvatarColumn>

            {/* Column 2: Simulation Engine */}
            <AvatarColumn title="Simulation Engine">
                <div className="h-full flex flex-col space-y-4">
                    <CyberCard className="p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="w-full">
                            <label className="text-[10px] font-bold text-cyan-600 uppercase mb-1 block">Escenario Activo</label>
                            <select className="w-full bg-white/50 border border-cyan-200 rounded-lg p-2 text-cyan-900 text-sm font-bold outline-none focus:ring-2 focus:ring-cyan-400">
                                <option>Rush Hour (Viernes)</option>
                                <option>Servicio Estándar</option>
                                <option>Evento Privado</option>
                            </select>
                        </div>
                        <button
                            onClick={handleToggleSim}
                            className={`w-full sm:w-auto px-6 py-2.5 rounded-lg font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-2 whitespace-nowrap ${isSimulating ? 'bg-rose-500 text-white shadow-rose-500/30' : 'bg-cyan-500 text-white shadow-cyan-500/30 hover:bg-cyan-400'}`}
                        >
                            {isSimulating ? 'DETENER' : 'INICIAR'}
                            <Icon svg={isSimulating ? ICONS.box : ICONS.arrowRight} className="w-3 h-3" />
                        </button>
                    </CyberCard>

                    <CyberCard className="flex-1 p-2 relative overflow-hidden min-h-[200px]">
                        <div className="absolute top-2 left-4 z-10">
                            <span className="text-[10px] font-bold text-cyan-700 bg-white/60 px-2 py-1 rounded backdrop-blur-sm">Eficiencia vs Carga</span>
                        </div>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={simData}>
                                <defs>
                                    <linearGradient id="colorEffCyan" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" vertical={false} />
                                <XAxis dataKey="time" hide />
                                <YAxis domain={[0, 100]} hide />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', border: '1px solid #cffafe', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                    itemStyle={{ fontSize: '12px', color: '#155e75', fontWeight: 'bold' }}
                                />
                                <Area type="monotone" dataKey="efficiency" stroke="#06b6d4" strokeWidth={3} fill="url(#colorEffCyan)" isAnimationActive={false} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CyberCard>

                    <div className="grid grid-cols-2 gap-3">
                        <CyberCard className="p-4 text-center">
                            <span className="text-[10px] font-bold text-cyan-500 uppercase block mb-1">Tickets / Hora</span>
                            <span className="text-2xl font-black text-cyan-800">{isSimulating ? simData[simData.length - 1]?.tickets || '--' : '--'}</span>
                        </CyberCard>
                        <CyberCard className="p-4 text-center">
                            <span className="text-[10px] font-bold text-cyan-500 uppercase block mb-1">Nivel Estrés</span>
                            <span className="text-2xl font-black text-amber-500">{isSimulating ? Math.round(simData[simData.length - 1]?.stress || 0) + '%' : '--%'}</span>
                        </CyberCard>
                    </div>
                </div>
            </AvatarColumn>

            {/* Column 3: Config */}
            <AvatarColumn title="Configuración">
                <div className="space-y-4">
                    <CyberCard className="p-4">
                        <h4 className="text-xs font-bold text-cyan-700 uppercase mb-4 flex items-center gap-2">
                            <Icon svg={ICONS.user} className="w-4 h-4" /> Personal Activo
                        </h4>
                        <div className="flex items-center justify-between bg-cyan-50 p-2 rounded-lg border border-cyan-100">
                            <button className="w-8 h-8 rounded bg-white shadow text-cyan-600 font-bold hover:bg-cyan-100" onClick={() => setConfig(prev => ({ ...prev, staffCount: Math.max(1, prev.staffCount - 1) }))}>-</button>
                            <span className="text-lg font-bold text-cyan-900">{config.staffCount} Staff</span>
                            <button className="w-8 h-8 rounded bg-white shadow text-cyan-600 font-bold hover:bg-cyan-100" onClick={() => setConfig(prev => ({ ...prev, staffCount: prev.staffCount + 1 }))}>+</button>
                        </div>
                    </CyberCard>

                    <CyberCard className="p-4">
                        <h4 className="text-xs font-bold text-cyan-700 uppercase mb-4 flex items-center gap-2">
                            <Icon svg={ICONS.settings} className="w-4 h-4" /> Estado de Equipos
                        </h4>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center p-2 rounded hover:bg-cyan-50/50 transition-colors">
                                <span className="text-xs font-bold text-cyan-800">Máquina de Hielo #1</span>
                                <div
                                    onClick={() => setConfig(prev => ({ ...prev, iceMachineStatus: prev.iceMachineStatus === 'operational' ? 'broken' : 'operational' }))}
                                    className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors shadow-inner ${config.iceMachineStatus === 'operational' ? 'bg-emerald-100' : 'bg-rose-100'}`}
                                >
                                    <div className={`absolute top-0.5 w-4 h-4 rounded-full shadow-sm transition-all ${config.iceMachineStatus === 'operational' ? 'left-5 bg-emerald-500' : 'left-0.5 bg-rose-500'}`}></div>
                                </div>
                            </div>
                            <div className="flex justify-between items-center p-2 rounded hover:bg-cyan-50/50 transition-colors">
                                <span className="text-xs font-bold text-cyan-800">Lavavajillas Principal</span>
                                <div className="w-10 h-5 bg-emerald-100 rounded-full relative cursor-pointer shadow-inner">
                                    <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-emerald-500 rounded-full shadow-sm"></div>
                                </div>
                            </div>
                        </div>
                    </CyberCard>

                    <div className="mt-auto pt-6">
                        <h4 className="text-[10px] font-bold text-cyan-400 uppercase mb-3 text-center">CONECTIVIDAD</h4>
                        <button
                            onClick={handleOpenVR}
                            className="w-full py-3 bg-gradient-to-r from-fuchsia-500 to-indigo-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all text-xs flex items-center justify-center gap-2 group"
                        >
                            <Icon svg={ICONS.monitor} className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            ENVIAR A VISOR VR
                        </button>
                    </div>
                </div>
            </AvatarColumn>
        </div>
    );
};

export default DigitalBarView;

