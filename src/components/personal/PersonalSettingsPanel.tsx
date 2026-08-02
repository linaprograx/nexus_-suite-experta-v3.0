import React from 'react';
import { Card } from '../ui/Card';
import { Icon } from '../ui/Icon';
import { ICONS } from '../ui/icons';
import { Button } from '../ui/Button';

import { useApp, useCapabilities } from '../../context/AppContext';
import { sendPasswordResetEmail } from 'firebase/auth'; // Kept for legacy fallback if needed
import { CustomToast, ChangePasswordModal } from './PersonalModals';
import { PlanTier } from '../../core/product/plans.types';
import { APP_SECTIONS } from '../../config/appSections';
import { useSectionsStore } from '../../store/sectionsStore';

const TIER_ACCENT: Record<PlanTier, string> = {
    FREE: '#94a3b8', PRO: '#14b8a6', EXPERT: '#f97316', STUDIO: '#a855f7',
};

// Local Switch Component (accent = plan tier)
const Switch = ({ label, checked, onChange, accent }: { label: string, checked?: boolean, onChange?: () => void, accent?: string }) => (
    <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
        <div
            onClick={onChange}
            className={`w-10 h-6 rounded-full p-1 cursor-pointer transition-colors ${checked ? '' : 'bg-slate-200 dark:bg-slate-700'}`}
            style={checked ? { background: accent || '#6366f1' } : undefined}
        >
            <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
        </div>
    </div>
);

interface PersonalSettingsPanelProps {
    darkMode: boolean;
    toggleDarkMode: () => void;
    reducedMotion: boolean;
    toggleReducedMotion: () => void;
    twoFactor: boolean;
    toggleTwoFactor: () => void;
    activeSessions: boolean;
    toggleActiveSessions: () => void;
    notifications: boolean;
    toggleNotifications: () => void;
    sounds: boolean;
    toggleSounds: () => void;
    compactMode: boolean;
    toggleCompactMode: () => void;
}

export const PersonalSettingsPanel: React.FC<PersonalSettingsPanelProps> = ({
    darkMode, toggleDarkMode,
    reducedMotion, toggleReducedMotion,
    twoFactor, toggleTwoFactor,
    activeSessions, toggleActiveSessions,
    notifications, toggleNotifications,
    sounds, toggleSounds,
    compactMode, toggleCompactMode
}) => {
    const { auth, user } = useApp();
    const { currentPlan } = useCapabilities();
    const accent = TIER_ACCENT[(currentPlan?.id || 'FREE') as PlanTier] || TIER_ACCENT.FREE;
    const [isPasswordModalOpen, setPasswordModalOpen] = React.useState(false);
    const [toast, setToast] = React.useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

    // Command center — section visibility in the sidebar
    const [sectionsOpen, setSectionsOpen] = React.useState(false);
    const isEnabled = useSectionsStore(s => s.isEnabled);
    const toggleSection = useSectionsStore(s => s.toggleSection);
    const hiddenSections = useSectionsStore(s => s.hiddenSections); // subscribe for re-render
    const enabledCount = APP_SECTIONS.filter(s => isEnabled(s.id)).length;

    // Dynamic import for auth functions to avoid top-level bloat if not used elsewhere often
    // Actually standard imports are better for clarity. Assuming imports present or I'll add them.

    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
        setToast({ message, type });
    };

    const handlePasswordChangeClick = () => {
        setPasswordModalOpen(true);
    };

    const performPasswordUpdate = async (currentPass: string, newPass: string) => {
        if (!auth || !user || !user.email) {
            throw new Error("No hay sesión activa.");
        }

        const { EmailAuthProvider, reauthenticateWithCredential, updatePassword } = await import('firebase/auth');

        // 1. Re-authenticate
        const credential = EmailAuthProvider.credential(user.email, currentPass);
        await reauthenticateWithCredential(user, credential);

        // 2. Update Password
        await updatePassword(user, newPass);

        showToast("Contraseña actualizada con éxito", 'success');
    };

    return (
        <>
            <div className="h-full flex flex-col gap-4">
                <div className="flex items-center gap-3 px-1">
                    <span className="p-2 rounded-xl text-white shadow-sm" style={{ background: accent }}>
                        <Icon svg={ICONS.settings} className="w-4 h-4" />
                    </span>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">Configuración</h3>
                </div>

                {/* Command center — enable/disable app sections (highlighted with plan tier color) */}
                <div className="rounded-2xl overflow-hidden shadow-lg" style={{ boxShadow: `0 10px 30px -12px ${accent}66` }}>
                    <button
                        onClick={() => setSectionsOpen(o => !o)}
                        className="w-full flex items-center justify-between gap-3 p-4 text-left text-white transition-all hover:brightness-105"
                        style={{ background: `linear-gradient(135deg, ${accent}, ${accent}cc)` }}
                    >
                        <div className="flex items-center gap-3">
                            <span className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
                                <Icon svg={ICONS.sliders || ICONS.settings} className="w-5 h-5" />
                            </span>
                            <div>
                                <p className="text-sm font-black">Gestionar secciones</p>
                                <p className="text-xs text-white/85">
                                    Activa o desactiva las secciones del menú lateral · {enabledCount}/{APP_SECTIONS.length} activas
                                </p>
                            </div>
                        </div>
                        <span className="p-1.5 rounded-full bg-white/15">
                            <Icon svg={sectionsOpen ? ICONS.chevronUp : ICONS.chevronDown} className="w-4 h-4" />
                        </span>
                    </button>

                    {sectionsOpen && (
                        <div className="px-5 pb-5 pt-3 bg-white dark:bg-slate-900 border-x border-b border-slate-200 dark:border-slate-800">
                            <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-2">
                                Las secciones desactivadas se ocultan del menú lateral hasta que las vuelvas a activar.
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
                                {APP_SECTIONS.map(section => {
                                    const on = isEnabled(section.id);
                                    return (
                                        <div key={section.id} className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <span className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                                                    <Icon svg={section.icon} className="w-4 h-4" />
                                                </span>
                                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{section.label}</span>
                                                {section.locked && (
                                                    <span className="shrink-0 text-slate-300 dark:text-slate-600" title="Sección fija — siempre visible">
                                                        <Icon svg={ICONS.lock} className="w-3.5 h-3.5" />
                                                    </span>
                                                )}
                                            </div>
                                            {section.locked ? (
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-600">Fija</span>
                                            ) : (
                                                <div
                                                    onClick={() => toggleSection(section.id)}
                                                    className={`shrink-0 w-10 h-6 rounded-full p-1 cursor-pointer transition-colors ${on ? '' : 'bg-slate-200 dark:bg-slate-700'}`}
                                                    style={on ? { background: accent } : undefined}
                                                >
                                                    <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${on ? 'translate-x-4' : 'translate-x-0'}`} />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Efficient grid — 3 columns on desktop */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Appearance */}
                    <Card className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center gap-2 mb-4 text-xs font-black uppercase tracking-wider" style={{ color: accent }}>
                            <Icon svg={ICONS.moon} className="w-4 h-4" /> Apariencia
                        </div>
                        <Switch label="Modo Oscuro" checked={darkMode} onChange={toggleDarkMode} accent={accent} />
                        <Switch label="Animaciones Reducidas" checked={reducedMotion} onChange={toggleReducedMotion} accent={accent} />
                        <Switch label="Modo Compacto" checked={compactMode} onChange={toggleCompactMode} accent={accent} />
                    </Card>

                    {/* App / Notifications */}
                    <Card className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center gap-2 mb-4 text-xs font-black uppercase tracking-wider" style={{ color: accent }}>
                            <Icon svg={ICONS.bell || ICONS.settings} className="w-4 h-4" /> Notificaciones
                        </div>
                        <Switch label="Notificaciones Push" checked={notifications} onChange={toggleNotifications} accent={accent} />
                        <Switch label="Sonidos del Sistema" checked={sounds} onChange={toggleSounds} accent={accent} />
                    </Card>

                    {/* Security */}
                    <Card className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center gap-2 mb-4 text-xs font-black uppercase tracking-wider" style={{ color: accent }}>
                            <Icon svg={ICONS.lock} className="w-4 h-4" /> Seguridad
                        </div>
                        <button
                            onClick={handlePasswordChangeClick}
                            className="w-full flex items-center justify-center gap-2 py-2.5 mb-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold transition"
                        >
                            <Icon svg={ICONS.key} className="w-4 h-4" /> Cambiar Contraseña
                        </button>
                        <Switch label="Autenticación 2FA" checked={twoFactor} onChange={toggleTwoFactor} accent={accent} />
                        <Switch label="Sesiones Activas" checked={activeSessions} onChange={toggleActiveSessions} accent={accent} />
                    </Card>
                </div>
            </div>

            {/* Portals */}
            {toast && <CustomToast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            <ChangePasswordModal
                isOpen={isPasswordModalOpen}
                onClose={() => setPasswordModalOpen(false)}
                onSubmit={performPasswordUpdate}
            />
        </>
    );
};
