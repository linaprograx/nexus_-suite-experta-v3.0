import React from 'react';
import { Card } from '../ui/Card';
import { Icon } from '../ui/Icon';
import { ICONS } from '../ui/icons';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc } from 'firebase/firestore';
import { Firestore } from 'firebase/firestore';
import { useCapabilities, useApp } from '../../context/AppContext';
import { calculateLevelInfo } from '../../services/progression/xpService';
import { PlanTier } from '../../core/product/plans.types';

interface PersonalHubProps {
    stats: {
        recipes: number;
        avgScore: number;
        ideas: number;
    };
    recentRecipes?: Array<{ id: string; name: string; createdAt?: any; [key: string]: any }>;
    quizHistory?: Array<{ score: number; total: number; createdAt?: any; topic?: string }>;
    db?: Firestore;
    userId?: string;
    onViewPlans?: () => void;
}

// Tier identity — mirrors the accents used on the Planes & Suscripción page
const TIER_STYLE: Record<PlanTier, { grad: string; glow: string; accent: string; label: string }> = {
    FREE:   { grad: 'from-slate-600 via-slate-700 to-slate-800',   glow: 'rgba(100,116,139,0.35)', accent: '#cbd5e1', label: 'Essential' },
    PRO:    { grad: 'from-teal-600 via-emerald-600 to-teal-700',   glow: 'rgba(45,212,191,0.40)',  accent: '#5eead4', label: 'Professional' },
    EXPERT: { grad: 'from-amber-500 via-orange-500 to-amber-700',  glow: 'rgba(251,146,60,0.45)',  accent: '#fed7aa', label: 'Expert' },
    STUDIO: { grad: 'from-violet-600 via-fuchsia-600 to-purple-700', glow: 'rgba(192,132,252,0.40)', accent: '#e9d5ff', label: 'Studio' },
};

export const PersonalHub: React.FC<PersonalHubProps> = ({ stats, recentRecipes = [], quizHistory = [], db, userId, onViewPlans }) => {
    const { currentPlan } = useCapabilities();
    const { userProfile } = useApp();
    const navigate = useNavigate();

    const tier = (currentPlan?.id || 'FREE') as PlanTier;
    const ts = TIER_STYLE[tier] || TIER_STYLE.FREE;
    const level = calculateLevelInfo(Number(userProfile?.experience) || 0);
    const status = (userProfile as any)?.subscriptionStatus;
    const statusLabel = status === 'active' ? 'Activo' : status === 'trialing' ? 'En prueba' : status === 'past_due' ? 'Pago pendiente' : tier === 'FREE' ? 'Gratis' : 'Activo';

    return (
        <div className="h-full overflow-y-auto custom-scrollbar p-1 space-y-6">
            {/* Nexus ID — Membership Pass (tier-aware, real data) */}
            <div className={`relative overflow-hidden rounded-3xl text-white p-8 min-h-[300px] flex flex-col justify-between group bg-gradient-to-br ${ts.grad}`}
                style={{ boxShadow: `0 24px 60px -20px ${ts.glow}` }}>

                {/* gloss + halo */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/25 via-white/5 to-transparent pointer-events-none" />
                <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full blur-[100px] pointer-events-none" style={{ background: `radial-gradient(circle, ${ts.glow}, transparent 70%)` }} />

                {/* Header: plan name + status */}
                <div className="relative z-10 flex justify-between items-start">
                    <div className="min-w-0">
                        <span className="text-[11px] font-mono tracking-[0.3em] text-white/70">NEXUS ID · MEMBRESÍA</span>
                        <p className="text-4xl font-black tracking-tight drop-shadow-sm mt-1">
                            Nexus <span className="opacity-90">{ts.label}</span>
                        </p>
                        <span className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full bg-white/15 border border-white/20 backdrop-blur-sm text-[10px] font-bold uppercase tracking-wider">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" /> {statusLabel}
                        </span>
                    </div>
                    <div className="p-3 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 shadow-xl shrink-0">
                        <Icon svg={ICONS.award} className="w-7 h-7 text-white" />
                    </div>
                </div>

                {/* Level + XP progress (real) */}
                <div className="relative z-10 mt-6">
                    <div className="flex items-end justify-between mb-1.5">
                        <span className="text-[11px] font-bold uppercase tracking-widest text-white/80">Nivel {level.level}</span>
                        <span className="text-[11px] font-mono text-white/70">{level.currentXP} / {level.nextLevelXP} XP</span>
                    </div>
                    <div className="w-full h-2 bg-black/25 rounded-full overflow-hidden">
                        <div className="h-full bg-white/90 rounded-full shadow-[0_0_12px_rgba(255,255,255,0.6)] transition-all duration-1000" style={{ width: `${level.progress}%` }} />
                    </div>
                </div>

                {/* Key stats */}
                <div className="relative z-10 mt-6 grid grid-cols-3 gap-4">
                    <div>
                        <span className="block text-[10px] font-bold text-white/60 uppercase tracking-widest mb-1">Recetas</span>
                        <span className="text-3xl font-black tracking-tight">{stats.recipes}</span>
                    </div>
                    <div>
                        <span className="block text-[10px] font-bold text-white/60 uppercase tracking-widest mb-1">Score Medio</span>
                        <span className="text-3xl font-black">{stats.avgScore}%</span>
                    </div>
                    <div>
                        <span className="block text-[10px] font-bold text-white/60 uppercase tracking-widest mb-1">Contribución</span>
                        <span className="text-3xl font-black">{stats.ideas}</span>
                    </div>
                </div>

                {/* Footer: id + manage plan */}
                <div className="relative z-10 mt-6 flex justify-between items-center">
                    <span className="font-mono text-[10px] text-white/50 tracking-wider">ID: {(userId || '884291NEX').toString().slice(0, 6).toUpperCase()}-NEX</span>
                    <button
                        onClick={onViewPlans}
                        className="px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 border border-white/20 backdrop-blur-md text-[10px] font-black uppercase tracking-wider transition-colors flex items-center gap-1.5"
                    >
                        Gestionar plan <Icon svg={ICONS.chevronRight} className="w-3 h-3" />
                    </button>
                </div>
            </div>

            {/* Recent Activity / Timeline Placeholder */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-6 bg-transparent ring-1 ring-slate-200 dark:ring-slate-800 hover:ring-pink-500/50 transition-all">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-lg bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400">
                            <Icon svg={ICONS.activity} className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold">Actividad Reciente</h3>
                    </div>
                    <div className="space-y-4">
                        {recentRecipes.length === 0 ? (
                            <p className="text-sm text-slate-400 italic">Sin actividad reciente.</p>
                        ) : recentRecipes.map(r => (
                            <div key={r.id} className="flex gap-3 text-sm">
                                <div className="w-1 bg-indigo-300 dark:bg-indigo-700 rounded-full flex-shrink-0"></div>
                                <div>
                                    <p className="font-medium text-slate-800 dark:text-slate-200">Receta: "{r.name}"</p>
                                    <p className="text-xs text-slate-400">
                                        {r.createdAt?.toDate ? new Date(r.createdAt.toDate()).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : 'Reciente'}
                                    </p>
                                </div>
                            </div>
                        ))}
                        {quizHistory.slice(0, 1).map((q, i) => (
                            <div key={i} className="flex gap-3 text-sm">
                                <div className="w-1 bg-blue-300 dark:bg-blue-700 rounded-full flex-shrink-0"></div>
                                <div>
                                    <p className="font-medium text-slate-800 dark:text-slate-200">
                                        Quiz: {Math.round((q.score / q.total) * 100)}% — {q.topic || 'Colegium'}
                                    </p>
                                    <p className="text-xs text-slate-400">
                                        {q.createdAt?.toDate ? new Date(q.createdAt.toDate()).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : 'Reciente'}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>



                <Card className="p-6 bg-transparent ring-1 ring-slate-200 dark:ring-slate-800 hover:ring-pink-500/50 transition-all">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                            <Icon svg={ICONS.award} className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold">Logros</h3>
                    </div>
                    <div className="space-y-4">
                        {/* Logro: recetas creadas (objetivo 10) */}
                        <div>
                            <div className="flex justify-between text-xs mb-1">
                                <span>Creador de Recetas</span>
                                <span>{stats.recipes}/10</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${Math.min(100, (stats.recipes / 10) * 100)}%` }}></div>
                            </div>
                        </div>
                        {/* Logro: quizzes completados (objetivo 5) */}
                        <div>
                            <div className="flex justify-between text-xs mb-1">
                                <span>Estudioso del Colegium</span>
                                <span>{quizHistory.length}/5</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${Math.min(100, (quizHistory.length / 5) * 100)}%` }}></div>
                            </div>
                        </div>
                        {/* Logro: score promedio ≥ 80% (objetivo) */}
                        <div>
                            <div className="flex justify-between text-xs mb-1">
                                <span>Score de Élite (≥80%)</span>
                                <span>{stats.avgScore}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full transition-all ${stats.avgScore >= 80 ? 'bg-indigo-500' : 'bg-amber-500'}`} style={{ width: `${stats.avgScore}%` }}></div>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Smart Actions (Replaces Quick Tools) */}
                <Card className="md:col-span-1 p-6 bg-transparent ring-1 ring-slate-200 dark:ring-slate-800 hover:ring-pink-500/50 transition-all flex flex-col">
                    <h3 className="font-bold mb-4 flex items-center gap-2 text-indigo-400">
                        <Icon svg={ICONS.zap} className="w-4 h-4" />
                        Acciones Estratégicas
                    </h3>
                    <div className="space-y-3 flex-1 flex flex-col justify-center">
                        <button
                            onClick={() => navigate('/grimorium')}
                            className="w-full text-left p-2 rounded-lg hover:bg-white/5 group transition-colors flex items-center gap-3"
                        >
                            <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                                <Icon svg={ICONS.refresh || ICONS.activity} className="w-4 h-4" />
                            </div>
                            <div>
                                <span className="block text-xs font-bold text-slate-700 dark:text-slate-300">Auditoría de Stock</span>
                                <span className="text-[10px] text-slate-400">Hace 3 días</span>
                            </div>
                        </button>
                        <button
                            onClick={() => navigate('/cerebrity', { state: { tab: 'makeMenu' } })}
                            className="w-full text-left p-2 rounded-lg hover:bg-white/5 group transition-colors flex items-center gap-3"
                        >
                            <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all">
                                <Icon svg={ICONS.calendar} className="w-4 h-4" />
                            </div>
                            <div>
                                <span className="block text-xs font-bold text-slate-700 dark:text-slate-300">Planificar Menú</span>
                                <span className="text-[10px] text-slate-400">Semana 42</span>
                            </div>
                        </button>
                    </div>
                </Card>

                {/* Editable Daily Tip / Mantra — tier-colored */}
                <MantraCard db={db} userId={userId} grad={ts.grad} glow={ts.glow} accent={ts.accent} />
            </div>
        </div>
    );
};

const MantraCard = ({ db, userId, grad, glow, accent }: { db?: Firestore; userId?: string; grad?: string; glow?: string; accent?: string }) => {
    const [isEditing, setIsEditing] = React.useState(false);
    const [mantra, setMantra] = React.useState("El hielo es el alma del cóctel. Nunca subestimes la importancia de la dilución controlada.");
    const [author, setAuthor] = React.useState("Tu mantra personal");
    const [saving, setSaving] = React.useState(false);

    const handleSave = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (db && userId) {
            setSaving(true);
            try {
                await setDoc(doc(db, `users/${userId}/profile`, 'main'), { mantra, mantraAuthor: author }, { merge: true });
            } finally {
                setSaving(false);
            }
        }
        setIsEditing(false);
    };

    return (
        <Card
            className={`md:col-span-2 p-6 text-white relative overflow-hidden cursor-pointer group bg-gradient-to-br ${grad || 'from-slate-800 to-slate-900'}`}
            style={{ boxShadow: `0 0 40px -8px ${glow || 'rgba(0,0,0,0.4)'}` }}
            onClick={() => !isEditing && setIsEditing(true)}
        >
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent pointer-events-none" />
            <div className="absolute right-0 top-0 w-32 h-32 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" style={{ background: (glow || 'rgba(255,255,255,0.15)') }}></div>
            {!isEditing && (
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[10px] font-bold uppercase bg-white/20 px-2 py-1 rounded backdrop-blur-md">Editar</span>
                </div>
            )}
            <div className="relative z-10 flex flex-col h-full justify-center">
                <div className="flex items-center gap-2 mb-2 text-yellow-400">
                    <Icon svg={ICONS.star} className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Tip del Maestro</span>
                </div>
                {isEditing ? (
                    <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        <textarea
                            value={mantra}
                            onChange={e => setMantra(e.target.value)}
                            className="w-full bg-white/10 border border-white/20 rounded-lg p-3 text-base font-light italic text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/40 h-20 resize-none"
                            autoFocus
                        />
                        <div className="flex justify-between items-center">
                            <input
                                value={author}
                                onChange={e => setAuthor(e.target.value)}
                                className="bg-transparent border-b border-white/20 text-xs text-white/80 focus:outline-none focus:border-white w-1/2"
                            />
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-3 py-1 bg-white rounded-full text-xs font-bold shadow-lg disabled:opacity-50"
                                style={{ color: accent || '#0f172a' }}
                            >
                                {saving ? 'Guardando…' : 'Guardar'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <p className="text-base italic font-light leading-relaxed opacity-90">"{mantra}"</p>
                        <div className="mt-4 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                                <Icon svg={ICONS.star} className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-xs opacity-60">{author}</span>
                        </div>
                    </>
                )}
            </div>
        </Card>
    );
};
