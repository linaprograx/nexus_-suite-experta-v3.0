import React, { useEffect, useState } from 'react';
import { doc, onSnapshot, setDoc, collection, query, orderBy, limit, Firestore, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, FirebaseStorage } from 'firebase/storage';
import { Auth } from 'firebase/auth';
import { UserProfile, ColegiumResult, Recipe, PizarronTask } from '../types';
import { PersonalProfileSidebar } from '../components/personal/PersonalProfileSidebar';
import { PersonalHub } from '../components/personal/PersonalHub';
import { PersonalSettingsPanel } from '../components/personal/PersonalSettingsPanel';
import { useUI } from '../context/UIContext';
import { Input } from '../components/ui/Input'; // Used for hidden file inputs, kept for logic
import { useApp } from '../context/AppContext';
import { PLANS } from '../core/product/plans.config';
import { PlanTier } from '../core/product/plans.types';
import { startCheckout, openBillingPortal, isCheckoutTier, TIER_TO_PLAN_ID, BillingCycle } from '../services/stripeService';
import { Toast } from '../components/ui/Toast';
import { Icon } from '../components/ui/Icon';
import { ICONS } from '../components/ui/icons';

import { useRecipes } from '../hooks/useRecipes';
import { usePizarronData } from '../hooks/usePizarronData';

interface PersonalViewProps {
    db: Firestore;
    userId: string;
    storage: FirebaseStorage | null;
    auth: Auth | null;
    // allRecipes, allPizarronTasks REMOVED
}

// ── Plan & Membresía ────────────────────────────────────────────────────────

const PLAN_HIGHLIGHTS: Record<PlanTier, string[]> = {
    FREE:   ['Signals básicos de rendimiento', 'Control de inventario', 'Acceso al Grimorium', 'Historial 7 días'],
    PRO:    ['Hasta 3 insights asistidos por vista', 'Optimización guiada', 'Aprendizaje básico derivado', 'Historial 30 días'],
    EXPERT: ['Insights ilimitados', 'Acciones activas (opt-in)', 'Aprendizaje adaptativo completo', 'Historial 90 días'],
    STUDIO: ['Todo en Expert incluido', 'IA adaptativa avanzada', 'Thresholds 100% personalizados', 'Historial 1 año · Soporte VIP'],
};

// Structured pricing: monthly + annual (annual = 20% off, 2 months free)
type PriceInfo = { amount: string; suffix: string };
const PLAN_PRICING: Record<PlanTier, { monthly?: PriceInfo; annual?: PriceInfo; flat?: string }> = {
    FREE:   { flat: 'Gratis' },
    PRO:    { monthly: { amount: '49,99€', suffix: 'mes' }, annual: { amount: '479,90€', suffix: 'año' } },
    EXPERT: { monthly: { amount: '99,99€', suffix: 'mes' }, annual: { amount: '959,90€', suffix: 'año' } },
    STUDIO: { flat: 'A medida' },
};

// Brand-aligned accent per tier (used sparingly on a dark editorial canvas)
const PLAN_ACCENT: Record<PlanTier, { hex: string; from: string; to: string; glow: string; soft: string }> = {
    FREE:   { hex: '#94a3b8', from: '#64748b', to: '#94a3b8', glow: 'rgba(148,163,184,0.20)', soft: 'rgba(148,163,184,0.12)' },
    PRO:    { hex: '#2dd4bf', from: '#14b8a6', to: '#2dd4bf', glow: 'rgba(45,212,191,0.28)',  soft: 'rgba(45,212,191,0.12)' },
    EXPERT: { hex: '#fb923c', from: '#f59e0b', to: '#fb7185', glow: 'rgba(251,146,60,0.45)',  soft: 'rgba(251,146,60,0.16)' },
    STUDIO: { hex: '#c084fc', from: '#a855f7', to: '#c084fc', glow: 'rgba(192,132,252,0.30)', soft: 'rgba(192,132,252,0.14)' },
};

const PLAN_BADGE_LABEL: Record<PlanTier, string> = {
    FREE:   'ESSENTIAL',
    PRO:    'PRO MEMBER',
    EXPERT: 'ELITE',
    STUDIO: 'STUDIO',
};

const PLAN_ORDER: PlanTier[] = ['FREE', 'PRO', 'EXPERT', 'STUDIO'];
const RECOMMENDED_PLAN: PlanTier = 'EXPERT';

const PLAN_ICON: Record<PlanTier, string> = {
    FREE: ICONS.leaf,
    PRO: ICONS.zap,
    EXPERT: ICONS.award,
    STUDIO: ICONS.sparkles,
};

// Sub-price hint shown under the main price
const PLAN_SUBHINT: Record<PlanTier, string> = {
    FREE: 'Para siempre',
    PRO: 'Facturación mensual',
    EXPERT: 'Sin permanencia',
    STUDIO: 'Precio personalizado',
};

const MembershipSection: React.FC<{
    userPlan: PlanTier;
    userId: string;
    email?: string | null;
    onNotify: (msg: string, type?: 'success' | 'error' | 'info') => void;
}> = ({ userPlan, userId, email, onNotify }) => {
    const [pending, setPending] = React.useState<PlanTier | 'portal' | null>(null);
    const [billingCycle, setBillingCycle] = React.useState<BillingCycle>('monthly');

    const STUDIO_CONTACT_EMAIL = 'ventas@nexussuite.app'; // Studio is negotiated manually

    const handlePlanCta = async (tier: PlanTier, isActive: boolean) => {
        try {
            if (tier === 'STUDIO') {
                // Studio price is negotiated case-by-case — contact, NOT auto-checkout
                window.location.href = `mailto:${STUDIO_CONTACT_EMAIL}?subject=${encodeURIComponent('Interés en Nexus Studio')}`;
                onNotify('Studio es a medida. Te abrimos el correo para contactar con ventas.', 'info');
                return;
            }
            if (tier === 'FREE') {
                if (isActive) return;
                // Downgrade = cancel current subscription via the billing portal
                setPending('portal');
                await openBillingPortal(userId);
                return;
            }
            if (isActive) {
                // Manage current paid subscription
                setPending('portal');
                await openBillingPortal(userId);
                return;
            }
            // Upgrade / subscribe (professional / expert)
            const planId = TIER_TO_PLAN_ID[tier];
            if (!planId) return;
            setPending(tier);
            await startCheckout({ planId, billingCycle, userId, email });
        } catch (e: any) {
            console.error('[Stripe]', e);
            onNotify(e.message || 'No se pudo procesar el pago. ¿Gateway activo?', 'error');
            setPending(null);
        }
    };

    return (
    <div className="relative rounded-[34px] overflow-hidden bg-slate-50 dark:bg-[#0a0b12] border border-slate-200/70 dark:border-white/5 p-4 md:p-10 shadow-sm dark:shadow-[0_40px_120px_-30px_rgba(0,0,0,0.7)]">
        {/* Hero background image — top area, diagonally cut, blurred, fading into the panel */}
        <div className="absolute inset-x-0 top-0 h-[84%] overflow-hidden pointer-events-none z-0" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 82%, 0 100%)' }}>
            {/* brand gradient fallback (shows if the image isn't present yet) */}
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/15 via-transparent to-teal-500/15" />
            {/* the photo — placed plainly: full opacity, no blur, no zoom */}
            <div className="absolute inset-0 bg-cover bg-center opacity-100 dark:opacity-90" style={{ backgroundImage: 'url(/membership-hero.jpg)' }} />
            {/* theme fade so text + cards stay readable (light top, solid bottom for cards) */}
            <div className="absolute inset-0 bg-gradient-to-b from-slate-50/5 via-slate-50/25 to-slate-50 dark:from-[#0a0b12]/20 dark:via-[#0a0b12]/45 dark:to-[#0a0b12]" />
        </div>
        {/* soft ambient glows */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
            <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[70%] h-[380px] rounded-full blur-[120px]" style={{ background: 'radial-gradient(ellipse, rgba(251,146,60,0.12), transparent 70%)' }} />
        </div>

        {/* Header */}
        <div className="relative z-10 mb-6 text-center max-w-2xl mx-auto">
            <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-amber-500 dark:text-amber-400/90 mb-3">
                <span className="w-6 h-px bg-gradient-to-r from-transparent to-amber-500/50 dark:to-amber-400/60" />
                Nexus Membership
                <span className="w-6 h-px bg-gradient-to-l from-transparent to-amber-500/50 dark:to-amber-400/60" />
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>Elige tu nivel de inteligencia</h2>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mt-3 [text-shadow:0_1px_2px_rgba(255,255,255,0.6)] dark:[text-shadow:0_1px_3px_rgba(0,0,0,0.8)]">14 días de prueba gratis en anual · 7 días en mensual. Sin permanencia, sin tarjeta para empezar.</p>
        </div>

        {/* Monthly / Annual toggle */}
        <div className="relative z-10 flex items-center justify-center gap-3 mb-12">
            <span className={`text-xs font-bold uppercase tracking-wider transition-colors ${billingCycle === 'monthly' ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}>Mensual</span>
            <button
                onClick={() => setBillingCycle(c => c === 'monthly' ? 'annual' : 'monthly')}
                className="relative w-14 h-7 rounded-full bg-slate-200 dark:bg-white/10 border border-slate-300/60 dark:border-white/10 transition-colors"
                aria-label="Cambiar ciclo de facturación"
            >
                <span className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-[0_2px_10px_rgba(251,146,60,0.5)] transition-transform duration-300 ${billingCycle === 'annual' ? 'translate-x-7' : ''}`} />
            </button>
            <span className={`text-xs font-bold uppercase tracking-wider transition-colors ${billingCycle === 'annual' ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}>Anual</span>
            <span className="ml-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-wider border border-emerald-500/20">Ahorra 20%</span>
        </div>

        {/* Cards — uniform height, folder tab on top, recommended raised */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-x-5 gap-y-10 pt-4 items-stretch">
            {PLAN_ORDER.map((tier) => {
                const plan = PLANS[tier];
                const isActive = tier === userPlan;
                const isRecommended = tier === RECOMMENDED_PLAN && !isActive;
                const pricing = PLAN_PRICING[tier];
                const cyclePrice = pricing.flat ? null : (billingCycle === 'annual' ? pricing.annual : pricing.monthly);
                const amount = pricing.flat || cyclePrice?.amount || '';
                const suffix = cyclePrice?.suffix || '';
                const highlight = isActive || isRecommended;
                const accent = PLAN_ACCENT[tier];
                const tabColor = isActive ? '#10b981' : accent.hex;
                const tabGrad = isActive ? 'linear-gradient(135deg,#10b981,#059669)' : `linear-gradient(135deg,${accent.from},${accent.to})`;

                return (
                    <div key={tier} className={`relative flex ${isRecommended ? 'xl:-translate-y-5' : isActive ? 'xl:-translate-y-2' : ''} transition-transform duration-500`}>
                        {/* Folder tab */}
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                            <span
                                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-white shadow-lg whitespace-nowrap"
                                style={{ background: tabGrad, boxShadow: `0 6px 18px -6px ${accent.glow}` }}
                            >
                                {isActive && <Icon svg={ICONS.check} className="w-3 h-3" />}
                                {isRecommended && <Icon svg={ICONS.star} className="w-3 h-3" />}
                                {isActive ? 'Tu plan' : isRecommended ? 'Recomendado' : PLAN_BADGE_LABEL[tier]}
                            </span>
                        </div>

                        {/* Card — overflow-hidden so the colored header clips to the radius */}
                        <div
                            className={`
                                group relative flex flex-col w-full rounded-[26px] overflow-hidden min-h-0 lg:min-h-[540px]
                                bg-white dark:bg-white/[0.045] backdrop-blur-xl
                                border transition-all duration-500 ease-out
                                ${highlight
                                    ? 'border-transparent shadow-xl'
                                    : 'border-slate-200/80 dark:border-white/10 shadow-md hover:-translate-y-1.5 hover:shadow-xl'}
                            `}
                            style={highlight
                                ? { boxShadow: `0 24px 60px -24px ${accent.glow}, 0 0 0 1.5px ${accent.hex}55` }
                                : undefined}
                        >
                            {/* Highlighted color header block (foto-3 style) with diagonal bottom */}
                            <div
                                className="relative px-6 pt-9 pb-9 text-white"
                                style={{ background: `linear-gradient(150deg, ${accent.from}, ${accent.to})`, clipPath: 'polygon(0 0, 100% 0, 100% 82%, 0 100%)' }}
                            >
                                {/* gloss + soft light */}
                                <div className="absolute inset-0 bg-gradient-to-br from-white/25 via-transparent to-transparent pointer-events-none" />
                                <div className="absolute -top-10 -right-8 w-32 h-32 bg-white/15 rounded-full blur-2xl pointer-events-none" />

                                <p className="relative text-xs font-bold tracking-wide opacity-90 mb-2">{plan.name}</p>
                                <div className="relative flex items-baseline gap-1.5">
                                    <span className="text-[40px] font-black leading-none tracking-tighter drop-shadow-sm">{amount}</span>
                                    {suffix && <span className="text-sm font-bold opacity-80">/ {suffix}</span>}
                                </div>
                                <p className="relative text-[10px] font-bold mt-2.5 uppercase tracking-wide opacity-90">
                                    {pricing.flat ? PLAN_SUBHINT[tier] : `Prueba ${billingCycle === 'annual' ? '14' : '7'} días gratis`}
                                </p>
                            </div>

                            {/* Body */}
                            <div className="relative flex flex-col flex-1 px-6 pt-2 pb-6">
                                {/* Positioning */}
                                <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400 mb-5 leading-snug">{plan.positioning}</p>

                                {/* Features */}
                                <ul className="space-y-3 flex-1 mb-6">
                                    {PLAN_HIGHLIGHTS[tier].map(feat => (
                                        <li key={feat} className="flex items-start gap-2.5 text-[12.5px] text-slate-600 dark:text-slate-300">
                                            <span className="mt-0.5 w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: accent.soft }}>
                                                <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke={accent.hex} strokeWidth={4}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                </svg>
                                            </span>
                                            <span className="leading-tight">{feat}</span>
                                        </li>
                                    ))}
                                </ul>

                                {/* CTA */}
                                <button
                                    onClick={() => handlePlanCta(tier, isActive)}
                                    disabled={pending !== null}
                                    className={`relative w-full py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all active:scale-[0.97] flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-wait border ${highlight ? 'text-white' : 'text-slate-700 dark:text-white'}`}
                                    style={highlight
                                        ? { background: `linear-gradient(135deg,${accent.from},${accent.to})`, borderColor: 'transparent', boxShadow: `0 10px 26px -8px ${accent.glow}` }
                                        : { background: 'transparent', borderColor: accent.hex + '55' }}
                                >
                                    {pending === tier ? (
                                        <><svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> Redirigiendo…</>
                                    ) : isActive ? (
                                        isCheckoutTier(tier) ? 'Gestionar suscripción' : 'Plan activo'
                                    ) : tier === 'FREE' ? 'Continuar gratis'
                                        : tier === 'STUDIO' ? 'Contactar'
                                        : <>Elegir {PLAN_BADGE_LABEL[tier]} <span className="transition-transform group-hover:translate-x-0.5">→</span></>}
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>

        {/* Trust line */}
        <div className="relative mt-9 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px] text-slate-400 dark:text-slate-500">
            <span className="flex items-center gap-1.5"><Icon svg={ICONS.lock || ICONS.shield || ICONS.check} className="w-3.5 h-3.5 text-emerald-500/70" /> Pago seguro con Stripe</span>
            <span className="flex items-center gap-1.5"><Icon svg={ICONS.refresh} className="w-3.5 h-3.5 text-emerald-500/70" /> Cancela cuando quieras</span>
            <span className="flex items-center gap-1.5"><Icon svg={ICONS.check} className="w-3.5 h-3.5 text-emerald-500/70" /> Sin permanencia</span>
        </div>
    </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────

const PersonalView: React.FC<PersonalViewProps> = ({ db, userId, storage, auth }) => {
    const { recipes: allRecipes } = useRecipes();
    const { tasks: allPizarronTasks } = usePizarronData();
    const { userPlan } = useApp();

    const { theme, setTheme, compactMode, toggleCompactMode } = useUI();
    const [activePage, setActivePage] = useState<'profile' | 'plans'>('profile');
    const [toast, setToast] = useState({ message: '', type: 'success' as 'success' | 'error' | 'info', isVisible: false });
    const notify = (message: string, type: 'success' | 'error' | 'info' = 'success') => setToast({ message, type, isVisible: true });
    const [profile, setProfile] = useState<Partial<UserProfile>>({});
    const [newAvatar, setNewAvatar] = useState<File | null>(null);
    const [newAvatarPreview, setNewAvatarPreview] = useState<string | null>(null);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [newCover, setNewCover] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [quizHistory, setQuizHistory] = useState<ColegiumResult[]>([]);

    // Local Settings State
    const [reducedMotion, setReducedMotion] = useState(false);
    const [twoFactor, setTwoFactor] = useState(false);
    const [notifications, setNotifications] = useState(true);
    const [sounds, setSounds] = useState(true);

    // Hidden input refs logic replaced by direct button interactions if simplified,
    // but we need to trigger the File Input.
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    // Surface Stripe Checkout return status (?checkout=success|cancelled)
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const checkout = params.get('checkout');
        if (checkout === 'success') {
            notify('¡Suscripción activada! Tu plan se actualizará en unos segundos.', 'success');
            setActivePage('plans');
        } else if (checkout === 'cancelled') {
            notify('Pago cancelado. No se ha realizado ningún cargo.', 'info');
            setActivePage('plans');
        }
        if (checkout) {
            // Clean the URL so the toast doesn't reappear on refresh
            params.delete('checkout');
            const clean = window.location.pathname + (params.toString() ? `?${params}` : '');
            window.history.replaceState({}, '', clean);
        }
    }, []);

    useEffect(() => {
        if (!userId) return;
        const profileDocRef = doc(db, `users/${userId}/profile`, 'main');
        const unsubscribe = onSnapshot(profileDocRef, (doc) => {
            if (doc.exists()) {
                setProfile(doc.data());
            } else {
                setProfile({
                    displayName: auth?.currentUser?.displayName || '',
                    photoURL: auth?.currentUser?.photoURL || '',
                    jobTitle: '',
                    bio: '',
                });
            }
        });

        const resultsPath = `users/${userId}/colegium-results`;
        const q = query(collection(db, resultsPath), orderBy('createdAt', 'desc'), limit(10));
        const unsubQuiz = onSnapshot(q, (snap) => {
            setQuizHistory(snap.docs.map(d => d.data() as ColegiumResult));
        });

        return () => {
            unsubscribe();
            unsubQuiz();
        };
    }, [userId, db, auth]);

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            if (!storage) {
                alert("Storage no disponible");
                return;
            }
            const file = e.target.files[0];
            setNewAvatarPreview(URL.createObjectURL(file));

            try {
                // Upload to Firebase Storage
                const storageRef = ref(storage, `users/${userId}/profile/avatar_${Date.now()}`);
                await uploadBytes(storageRef, file);
                const downloadURL = await getDownloadURL(storageRef);

                // Update Firestore
                const profileRef = doc(db, `users/${userId}/profile`, 'main');
                await setDoc(profileRef, { photoURL: downloadURL }, { merge: true });

                alert('Foto de perfil actualizada correctamente.');
            } catch (error) {
                console.error("Error updating avatar:", error);
                alert('Error al subir la imagen. Inténtalo de nuevo.');
            }
        }
    };

    // Placeholder for full edit modal or inline edit. 
    // The previous code had inline inputs. The new design has "Edit Profile" button.
    // For this redesign, we'll keep the button as a "Mock" or simple prompt until user asks for the modal.
    const handleEditProfile = () => {
        const newName = prompt("Nuevo nombre:", profile.displayName || '');
        if (newName) setProfile(p => ({ ...p, displayName: newName }));
        // Full implementation would be a modal.
    };

    const recipesCount = allRecipes.length;
    const avgQuizScore = quizHistory.length > 0 ? (quizHistory.reduce((acc, curr) => acc + (curr.score / curr.total), 0) / quizHistory.length * 100) : 0;
    const ideasCount = allPizarronTasks.filter(task => task.assignees?.includes(userId)).length;

    const handleSaveProfile = async () => {
        try {
            const profileRef = doc(db, `users/${userId}/profile`, 'main');
            await setDoc(profileRef, profile, { merge: true });
            alert('Perfil actualizado.');
        } catch (e) {
            console.error("Error saving profile:", e);
        }
    };

    return (
        <div className="min-h-full lg:h-full p-3 md:p-4 lg:p-8 lg:overflow-y-auto custom-scrollbar pb-28 lg:pb-8">
            {/* Hidden Inputs for logic */}
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleAvatarChange}
            />

            {/* ── PAGE TABS ─────────────────────────────────────────────── */}
            <div className="flex items-center gap-2 mb-6 p-1 bg-slate-100 dark:bg-slate-800/60 rounded-2xl w-fit">
                {([
                    { id: 'profile', label: 'Perfil', icon: ICONS.user },
                    { id: 'plans', label: 'Planes & Suscripción', icon: ICONS.star },
                ] as const).map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActivePage(tab.id)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${activePage === tab.id
                            ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm'
                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    >
                        <Icon svg={tab.icon} className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ── PAGE 1: PROFILE ───────────────────────────────────────── */}
            {activePage === 'profile' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-6 animate-in fade-in duration-300">
                    {/* Profile card (4 cols) */}
                    <div className="lg:col-span-4">
                        <PersonalProfileSidebar
                            profile={profile}
                            onEditProfile={handleEditProfile}
                            onUploadAvatar={() => fileInputRef.current?.click()}
                            onSaveProfile={handleSaveProfile}
                            newAvatarPreview={newAvatarPreview}
                        />
                    </div>

                    {/* Hub (8 cols) */}
                    <div className="lg:col-span-8">
                        <PersonalHub
                            stats={{
                                recipes: recipesCount,
                                avgScore: Math.round(avgQuizScore),
                                ideas: ideasCount
                            }}
                            recentRecipes={allRecipes.slice(0, 3).map((r: any) => ({ ...r, name: r.nombre }))}
                            quizHistory={quizHistory}
                            db={db}
                            userId={userId}
                            onViewPlans={() => setActivePage('plans')}
                        />
                    </div>

                    {/* Settings (full width below) */}
                    <div className="lg:col-span-12">
                        <PersonalSettingsPanel
                            darkMode={theme === 'dark'}
                            toggleDarkMode={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
                            reducedMotion={reducedMotion}
                            toggleReducedMotion={() => setReducedMotion(!reducedMotion)}
                            twoFactor={twoFactor}
                            toggleTwoFactor={() => setTwoFactor(!twoFactor)}
                            notifications={notifications}
                            toggleNotifications={() => setNotifications(!notifications)}
                            sounds={sounds}
                            toggleSounds={() => setSounds(!sounds)}
                            compactMode={compactMode}
                            toggleCompactMode={toggleCompactMode}
                            activeSessions={true}
                            toggleActiveSessions={() => { }}
                        />
                    </div>
                </div>
            )}

            {/* ── PAGE 2: PLANS & SUBSCRIPTION ──────────────────────────── */}
            {activePage === 'plans' && (
                <div className="pb-6 animate-in fade-in duration-300">
                    <MembershipSection
                        userPlan={userPlan}
                        userId={userId}
                        email={auth?.currentUser?.email}
                        onNotify={notify}
                    />
                </div>
            )}

            <Toast
                message={toast.message}
                type={toast.type}
                isVisible={toast.isVisible}
                onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
            />
        </div>
    );
};

export default PersonalView;
