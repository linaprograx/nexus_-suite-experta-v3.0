import React, { useMemo, useState } from 'react';
import { PageName, UserProfile } from '../types';
import GlassCard from '../components/GlassCard';
import PremiumButton from '../components/PremiumButton';
import { useIngredients } from '../../../hooks/useIngredients';

interface DashboardProps {
    onNavigate: (page: PageName) => void;
    user: UserProfile;
    notify?: (message: string, type?: 'success' | 'error' | 'loading') => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate, user }) => {
    const { ingredients } = useIngredients();
    const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'system'>('overview');

    const TAB_LABELS = {
        overview: 'General',
        analytics: 'Analíticas',
        system: 'Sistema'
    };

    // Calculate real stats from ingredients
    const stats = useMemo(() => {
        const lowStockCount = ingredients.filter(i => (i.stock || 0) <= (i.minStock || 0)).length;

        return [
            { label: 'Operaciones', value: '98%', status: 'óptimo', color: '#10B981', icon: 'check_circle' },
            { label: 'Rendimiento', value: '94%', status: 'alto', color: '#0066FF', icon: 'speed' },
            { label: 'Red', value: '112ms', status: 'estable', color: '#6366F1', icon: 'signal_cellular_alt' },
            { label: 'Sincronización', value: 'Activa', status: 'sincronizado', color: '#00E5FF', icon: 'cloud_done' },
        ];
    }, [ingredients]);

    return (
        <div className="px-5 py-6 pb-32 overflow-y-auto custom-scroll">

            {/* Header */}
            <header className="mb-6">
                <p className="text-[10px] font-black tracking-[0.2em] text-white/80 uppercase mb-2">Nexus Suite v3.0</p>
                <h1 className="text-6xl font-extrabold text-white tracking-tighter leading-[0.9] mb-4">
                    NEXUS<br />
                    <span className="text-white/70">DASHBOARD</span>
                </h1>

                {/* Tab Pills */}
                <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                    {(['overview', 'analytics', 'system'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-md whitespace-nowrap transition-all ${activeTab === tab
                                ? 'bg-white text-blue-600'
                                : 'bg-white/20 backdrop-blur-md border border-white/30 text-white hover:bg-white/30'
                                }`}
                        >
                            {TAB_LABELS[tab]}
                        </button>
                    ))}
                </div>
            </header>

            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
                <>
                    {/* System Status Cards */}
                    <section className="space-y-4 mb-6">
                        {stats.map((stat, i) => (
                            <GlassCard
                                key={i}
                                rounded="3xl"
                                padding="md"
                                className="relative group"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div
                                            className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg"
                                            style={{
                                                backgroundColor: stat.color,
                                                boxShadow: `0 8px 20px -6px ${stat.color}60`
                                            }}
                                        >
                                            <span className="material-symbols-outlined text-2xl fill-1">{stat.icon}</span>
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-zinc-900 mb-1">{stat.label}</h3>
                                            <p className="text-xs font-medium text-zinc-500">Estado: {stat.status}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span
                                            className="text-3xl font-black tracking-tight"
                                            style={{ color: stat.color }}
                                        >
                                            {stat.value}
                                        </span>
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                {stat.value.includes('%') && (
                                    <div className="mt-4">
                                        <div className="w-full bg-zinc-100 rounded-full h-1.5">
                                            <div
                                                className="h-1.5 rounded-full transition-all"
                                                style={{
                                                    width: stat.value,
                                                    backgroundColor: stat.color
                                                }}
                                            ></div>
                                        </div>
                                    </div>
                                )}
                            </GlassCard>
                        ))}
                    </section>

                    {/* AI Next Best Action */}
                    <GlassCard rounded="3xl" padding="lg" className="bg-gradient-to-r from-blue-50 to-transparent mb-6">
                        <div className="flex items-center gap-4 mb-5">
                            <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-xl action-glow-blue">
                                <span className="material-symbols-outlined text-3xl fill-1">auto_awesome</span>
                            </div>
                            <div className="flex-1">
                                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-[8px] font-black uppercase tracking-wider">
                                    Recomendación IA
                                </span>
                                <h3 className="text-xl font-black text-zinc-900 mt-2 mb-1">Sintetizar Nuevo Menú</h3>
                                <p className="text-xs text-zinc-600 font-medium">3 cócteles listos para revisar en Cerebrity</p>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button
                                className="flex-[0.4] py-3 rounded-2xl text-[10px] font-black text-zinc-500 bg-zinc-100 border border-zinc-200 uppercase tracking-wider hover:bg-zinc-200 transition-colors"
                            >
                                Más Tarde
                            </button>
                            <PremiumButton
                                module="dashboard"
                                variant="gradient"
                                size="md"
                                icon={<span className="material-symbols-outlined !text-sm">arrow_forward</span>}
                                iconPosition="right"
                                className="flex-1"
                                onClick={() => onNavigate(PageName.CerebritySynthesis)}
                            >
                                ABRIR CEREBRITY
                            </PremiumButton>
                        </div>
                    </GlassCard>

                    {/* Quick Actions Grid */}
                    <section className="grid grid-cols-2 gap-3">
                        <GlassCard
                            rounded="2xl"
                            padding="md"
                            className="cursor-pointer active:scale-95 transition-all"
                            onClick={() => onNavigate(PageName.GrimorioStock)}
                        >
                            <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center mb-3">
                                <span className="material-symbols-outlined fill-1">inventory_2</span>
                            </div>
                            <h4 className="text-sm font-bold text-zinc-900 mb-1">Inventario</h4>
                            <p className="text-[10px] text-zinc-500 font-medium">Ver alertas</p>
                        </GlassCard>

                        <GlassCard
                            rounded="2xl"
                            padding="md"
                            className="cursor-pointer active:scale-95 transition-all"
                            onClick={() => onNavigate(PageName.GrimorioRecipes)}
                        >
                            <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center mb-3">
                                <span className="material-symbols-outlined fill-1">book_2</span>
                            </div>
                            <h4 className="text-sm font-bold text-zinc-900 mb-1">Recetas</h4>
                            <p className="text-[10px] text-zinc-500 font-medium">Ver lógica</p>
                        </GlassCard>

                        <GlassCard
                            rounded="2xl"
                            padding="md"
                            className="cursor-pointer active:scale-95 transition-all"
                            onClick={() => onNavigate(PageName.Pizarron)}
                        >
                            <div className="w-10 h-10 rounded-xl bg-cyan-100 text-cyan-600 flex items-center justify-center mb-3">
                                <span className="material-symbols-outlined fill-1">layers</span>
                            </div>
                            <h4 className="text-sm font-bold text-zinc-900 mb-1">Pizarrón</h4>
                            <p className="text-[10px] text-zinc-500 font-medium">Abrir canvas</p>
                        </GlassCard>

                        <GlassCard
                            rounded="2xl"
                            padding="md"
                            className="cursor-pointer active:scale-95 transition-all"
                            onClick={() => onNavigate(PageName.AvatarCore)}
                        >
                            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mb-3">
                                <span className="material-symbols-outlined fill-1">person</span>
                            </div>
                            <h4 className="text-sm font-bold text-zinc-900 mb-1">Avatar</h4>
                            <p className="text-[10px] text-zinc-500 font-medium">Ver perfil</p>
                        </GlassCard>
                    </section>
                </>
            )}

            {/* ANALYTICS TAB */}
            {activeTab === 'analytics' && (
                <>
                    {/* Revenue Card */}
                    <GlassCard rounded="3xl" padding="xl" className="bg-gradient-to-r from-emerald-50 to-transparent mb-4">
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Ingresos Totales</p>
                                <h2 className="text-4xl font-black text-emerald-600">$24,580</h2>
                                <span className="text-xs font-bold text-emerald-600">+12.5% vs mes anterior</span>
                            </div>
                            <div className="w-16 h-16 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-xl action-glow-emerald">
                                <span className="material-symbols-outlined text-3xl fill-1">payments</span>
                            </div>
                        </div>
                        <div className="w-full bg-zinc-100 rounded-full h-2">
                            <div className="bg-emerald-600 h-2 rounded-full" style={{ width: '75%' }}></div>
                        </div>
                    </GlassCard>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <GlassCard rounded="2xl" padding="md">
                            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-3">
                                <span className="material-symbols-outlined fill-1">receipt_long</span>
                            </div>
                            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Pedidos</p>
                            <h4 className="text-2xl font-black text-zinc-900">1,247</h4>
                        </GlassCard>

                        <GlassCard rounded="2xl" padding="md">
                            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mb-3">
                                <span className="material-symbols-outlined fill-1">groups</span>
                            </div>
                            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Clientes</p>
                            <h4 className="text-2xl font-black text-zinc-900">856</h4>
                        </GlassCard>

                        <GlassCard rounded="2xl" padding="md">
                            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mb-3">
                                <span className="material-symbols-outlined fill-1">star</span>
                            </div>
                            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Calificación</p>
                            <h4 className="text-2xl font-black text-zinc-900">4.8</h4>
                        </GlassCard>

                        <GlassCard rounded="2xl" padding="md">
                            <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center mb-3">
                                <span className="material-symbols-outlined fill-1">trending_up</span>
                            </div>
                            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Crecimiento</p>
                            <h4 className="text-2xl font-black text-zinc-900">+18%</h4>
                        </GlassCard>
                    </div>

                    {/* Top Performers */}
                    <div>
                        <h3 className="text-xs font-black text-white/80 uppercase tracking-wider mb-3 px-2">Mejores Resultados</h3>
                        {['Mojito Classic', 'Negroni Sbagliato', 'Espresso Martini'].map((name, i) => (
                            <GlassCard key={i} rounded="2xl" padding="md" className="mb-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl font-black text-zinc-300">#{i + 1}</span>
                                        <div>
                                            <h4 className="text-sm font-bold text-zinc-900">{name}</h4>
                                            <p className="text-xs text-zinc-500">{145 - (i * 20)} pedidos</p>
                                        </div>
                                    </div>
                                    <span className="text-lg font-black text-emerald-600">+{25 - (i * 3)}%</span>
                                </div>
                            </GlassCard>
                        ))}
                    </div>
                </>
            )}

            {/* SYSTEM TAB */}
            {activeTab === 'system' && (
                <>
                    {/* System Info Card */}
                    <GlassCard rounded="3xl" padding="xl" className="bg-gradient-to-r from-slate-50 to-transparent mb-4">
                        <div className="flex items-center gap-5 mb-5">
                            <div className="w-16 h-16 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-xl">
                                <span className="material-symbols-outlined text-3xl fill-1">settings</span>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-black text-zinc-900 mb-1">Configuración del Sistema</h3>
                                <p className="text-xs text-zinc-600">Todos los sistemas operativos</p>
                            </div>
                        </div>
                        <div className="bg-slate-100 rounded-2xl p-4">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-bold text-zinc-600">Versión</span>
                                <span className="text-xs font-mono text-zinc-900">v3.0.2</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-zinc-600">Entorno</span>
                                < span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[9px] font-black">PRODUCCIÓN</span>
                            </div>
                        </div>
                    </GlassCard>

                    {/* Settings List */}
                    <div>
                        <h3 className="text-xs font-black text-white/80 uppercase tracking-wider mb-3 px-2">Configuración</h3>
                        {[
                            { icon: 'notifications', label: 'Notificaciones', value: 'Activado' },
                            { icon: 'lock', label: 'Seguridad', value: '2FA Activo' },
                            { icon: 'cloud_sync', label: 'Auto Sincronizar', value: 'On' },
                            { icon: 'dark_mode', label: 'Tema', value: 'Premium' },
                        ].map((setting, i) => (
                            <GlassCard key={i} rounded="2xl" padding="md" className="mb-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-zinc-100 text-zinc-700 flex items-center justify-center">
                                            <span className="material-symbols-outlined fill-1">{setting.icon}</span>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-zinc-900">{setting.label}</h4>
                                            <p className="text-xs text-zinc-500">{setting.value}</p>
                                        </div>
                                    </div>
                                    <span className="material-symbols-outlined text-zinc-400">chevron_right</span>
                                </div>
                            </GlassCard>
                        ))}
                    </div>

                    {/* Actions */}
                    <div className="mt-6 space-y-3">
                        <PremiumButton
                            variant="secondary"
                            size="lg"
                            fullWidth
                            customColor="#DC2626"
                            icon={<span className="material-symbols-outlined !text-base">refresh</span>}
                            iconPosition="left"
                        >
                            Limpiar Caché
                        </PremiumButton>
                        <PremiumButton
                            variant="outline"
                            size="lg"
                            fullWidth
                            customColor="#6B7280"
                            icon={<span className="material-symbols-outlined !text-base">logout</span>}
                            iconPosition="left"
                        >
                            Cerrar Sesión
                        </PremiumButton>
                    </div>
                </>
            )}

        </div>
    );
};

export default Dashboard;
