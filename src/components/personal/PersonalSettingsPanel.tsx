import React from 'react';
import { Card } from '../ui/Card';
import { Icon } from '../ui/Icon';
import { ICONS } from '../ui/icons';
import { Toggle } from '../ui/Toggle'; // Assuming a Toggle exists or using simple checkbox styled
import { Button } from '../ui/Button';

// Mock Toggle if not exists, user instructed "only modify sections", so I assume components exist or use simple divs
const Switch = ({ label, checked, onChange }: { label: string, checked?: boolean, onChange?: () => void }) => (
    <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
        <div
            onClick={onChange}
            className={`w-10 h-6 rounded-full p-1 cursor-pointer transition-colors ${checked ? 'bg-indigo-500' : 'bg-slate-200 dark:bg-slate-700'}`}
        >
            <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
        </div>
    </div>
);

interface PersonalSettingsPanelProps {
    darkMode: boolean;
    toggleDarkMode: () => void;

    // New Props
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
    return (
        <div className="h-full flex flex-col gap-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white px-2">Configuración</h3>

            {/* Appearance */}
            <Card className="p-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <Icon svg={ICONS.moon} className="w-4 h-4" />
                    Apariencia
                </div>
                <Switch label="Modo Oscuro" checked={darkMode} onChange={toggleDarkMode} />
                <Switch label="Animaciones Reducidas" checked={reducedMotion} onChange={toggleReducedMotion} />
            </Card>

            {/* Security */}
            <Card className="p-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <Icon svg={ICONS.lock} className="w-4 h-4" />
                    Seguridad
                </div>
                <Button variant="outline" size="sm" className="w-full justify-start mb-2">
                    <Icon svg={ICONS.key} className="w-4 h-4 mr-2" />
                    Cambiar Contraseña
                </Button>
                <Switch label="Autenticación 2FA" checked={twoFactor} onChange={toggleTwoFactor} />
                <Switch label="Sesiones Activas" checked={activeSessions} onChange={toggleActiveSessions} />
            </Card>

            {/* App Config */}
            <Card className="p-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <Icon svg={ICONS.settings} className="w-4 h-4" />
                    Aplicación
                </div>
                <Switch label="Notificaciones Push" checked={notifications} onChange={toggleNotifications} />
                <Switch label="Sonidos del Sistema" checked={sounds} onChange={toggleSounds} />
                <Switch label="Modo Compacto" checked={compactMode} onChange={toggleCompactMode} />
            </Card>
        </div>
    );
};
