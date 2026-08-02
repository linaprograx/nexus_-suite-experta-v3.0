import React from 'react';
import { Icon } from '../ui/Icon';
import { ICONS } from '../ui/icons';
import { UserProfile } from '../../types';
import { useApp, useCapabilities } from '../../context/AppContext';
import { calculateLevelInfo } from '../../services/progression/xpService';
import { PlanTier } from '../../core/product/plans.types';

interface PersonalProfileSidebarProps {
    profile: Partial<UserProfile>;
    onEditProfile: () => void;
    onUploadAvatar: () => void;
    onSaveProfile: () => void;
    newAvatarPreview: string | null;
}

const TIER_STYLE: Record<PlanTier, { grad: string; accent: string; label: string }> = {
    FREE:   { grad: 'from-slate-500 to-slate-700',    accent: '#94a3b8', label: 'Essential' },
    PRO:    { grad: 'from-teal-500 to-emerald-600',   accent: '#14b8a6', label: 'Professional' },
    EXPERT: { grad: 'from-amber-500 to-orange-600',   accent: '#f97316', label: 'Expert' },
    STUDIO: { grad: 'from-violet-500 to-fuchsia-600', accent: '#a855f7', label: 'Studio' },
};

export const PersonalProfileSidebar: React.FC<PersonalProfileSidebarProps> = ({
    profile,
    onUploadAvatar,
    onSaveProfile,
    newAvatarPreview,
}) => {
    const { userProfile } = useApp();
    const { currentPlan } = useCapabilities();
    const tier = (currentPlan?.id || 'FREE') as PlanTier;
    const ts = TIER_STYLE[tier] || TIER_STYLE.FREE;
    const level = calculateLevelInfo(Number(userProfile?.experience) || 0);

    const inputCls = "w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition";

    return (
        <div className="h-full p-1">
            <div className="h-full flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">

                {/* Cover banner (tier-colored) with avatar */}
                <div className={`relative h-24 bg-gradient-to-br ${ts.grad} shrink-0`}>
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
                    <div className="absolute -top-6 -right-6 w-28 h-28 bg-white/15 rounded-full blur-2xl" />
                    {/* Plan badge */}
                    <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/20 backdrop-blur-md border border-white/25 text-white text-[9px] font-black uppercase tracking-widest">
                        {ts.label}
                    </span>
                </div>

                {/* Avatar overlapping the banner */}
                <div className="px-5 -mt-11 flex flex-col items-center shrink-0">
                    <div className="relative group">
                        <div className="absolute -inset-1 rounded-full blur opacity-70 group-hover:opacity-100 transition" style={{ background: `linear-gradient(135deg, ${ts.accent}, transparent)` }} />
                        <img
                            src={newAvatarPreview || profile.photoURL || `https://ui-avatars.com/api/?name=${profile.displayName || 'U'}&background=random`}
                            alt="Profile"
                            className="relative w-24 h-24 rounded-full object-cover border-4 border-white dark:border-slate-900 shadow-xl"
                        />
                        <button
                            onClick={onUploadAvatar}
                            className="absolute bottom-1 right-1 p-1.5 rounded-full text-white shadow-lg transition-all hover:scale-110"
                            style={{ background: ts.accent }}
                            title="Cambiar foto"
                        >
                            <Icon svg={ICONS.camera} className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    <h2 className="mt-3 text-lg font-black text-slate-900 dark:text-white leading-tight text-center">
                        {profile.displayName || 'Usuario Nexus'}
                    </h2>
                    <p className="font-bold text-[11px] uppercase tracking-wider mt-0.5" style={{ color: ts.accent }}>
                        {profile.jobTitle || 'Mixólogo'}
                    </p>
                    {profile.instagramHandle && (
                        <div className="mt-2 inline-flex items-center text-slate-500 dark:text-slate-400 text-[11px] font-medium bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
                            <Icon svg={ICONS.tag} className="w-3 h-3 mr-1" />
                            {profile.instagramHandle}
                        </div>
                    )}
                </div>

                {/* Level / XP mini-block */}
                <div className="px-5 mt-4 shrink-0">
                    <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 p-3">
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Nivel {level.level}</span>
                            <span className="text-[10px] font-mono text-slate-400">{level.currentXP} / {level.nextLevelXP} XP</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${level.progress}%`, background: `linear-gradient(90deg, ${ts.accent}, ${ts.accent}aa)` }} />
                        </div>
                    </div>
                </div>

                {/* Editable fields */}
                <div className="px-5 mt-4 flex flex-col flex-1 gap-3 overflow-y-auto custom-scrollbar pb-5">
                    <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 block mb-1">Nombre</label>
                        <input
                            defaultValue={profile.displayName || ''}
                            onChange={e => { (profile as any).displayName = e.target.value; }}
                            className={inputCls}
                            placeholder="Tu nombre"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 block mb-1">Cargo / Rol</label>
                        <input
                            defaultValue={profile.jobTitle || ''}
                            onChange={e => { (profile as any).jobTitle = e.target.value; }}
                            className={inputCls}
                            placeholder="Bar Manager, Mixólogo…"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 block mb-1">Instagram</label>
                        <input
                            defaultValue={profile.instagramHandle || ''}
                            onChange={e => { (profile as any).instagramHandle = e.target.value; }}
                            className={inputCls}
                            placeholder="@usuario"
                        />
                    </div>

                    {/* Sobre mí */}
                    <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 block mb-1 flex items-center gap-1.5">
                            <span style={{ color: ts.accent }}><Icon svg={ICONS.user} className="w-3 h-3" /></span> Sobre mí
                        </label>
                        <textarea
                            defaultValue={(profile as any).bio || ''}
                            onChange={e => { (profile as any).bio = e.target.value; }}
                            className={`${inputCls} h-20 resize-none`}
                            placeholder="Cuéntanos tu estilo, especialidad…"
                        />
                    </div>

                    {/* Objetivos a corto plazo */}
                    <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 block mb-1 flex items-center gap-1.5">
                            <span style={{ color: ts.accent }}><Icon svg={ICONS.star} className="w-3 h-3" /></span> Objetivos
                        </label>
                        <textarea
                            defaultValue={(profile as any).objetivos || ''}
                            onChange={e => { (profile as any).objetivos = e.target.value; }}
                            className={`${inputCls} h-16 resize-none`}
                            placeholder="Ej. lanzar 3 cócteles de temporada este mes"
                        />
                    </div>

                    <div className="flex-1" />

                    <button
                        onClick={onSaveProfile}
                        className={`w-full py-3 rounded-xl text-xs font-black uppercase tracking-widest text-white shadow-lg active:scale-95 transition-all bg-gradient-to-r ${ts.grad}`}
                        style={{ boxShadow: `0 10px 24px -8px ${ts.accent}` }}
                    >
                        Guardar cambios
                    </button>
                    <button
                        onClick={onUploadAvatar}
                        className="w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition flex items-center justify-center gap-2"
                    >
                        <Icon svg={ICONS.camera} className="w-4 h-4" /> Cambiar foto
                    </button>
                </div>
            </div>
        </div>
    );
};
