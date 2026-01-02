import React from 'react';
import { Card } from '../ui/Card';
import { Icon } from '../ui/Icon';
import { ICONS } from '../ui/icons';

interface NexusMemberPassCardProps {
    level?: number;
    xpCurrent?: number;
    xpMax?: number;
    title?: string;
    modulesCompleted?: number;
    streakDays?: number;
    variant?: 'essential' | 'pro' | 'elite' | 'jupiter';
    active?: boolean;
}

export const NexusMemberPassCard: React.FC<NexusMemberPassCardProps> = ({
    level = 1,
    xpCurrent = 0,
    xpMax = 1000,
    title = 'Miembro Nexus',
    modulesCompleted = 0,
    streakDays = 0,
    variant = 'pro',
    active = false
}) => {
    const [showLevelDetails, setShowLevelDetails] = React.useState(false);

    // Variant Styles
    const getStyles = () => {
        switch (variant) {
            case 'essential':
                return {
                    bg: 'bg-gradient-to-br from-slate-400 to-slate-600',
                    badge: 'ESSENTIAL',
                    badgeColor: 'bg-slate-200/20 text-slate-100',
                    iconColor: 'text-slate-300'
                };
            case 'elite':
                return {
                    bg: 'bg-gradient-to-br from-amber-500 via-yellow-500 to-amber-600',
                    badge: 'ELITE',
                    badgeColor: 'bg-black/20 text-white',
                    iconColor: 'text-white'
                };
            case 'jupiter':
                return {
                    bg: 'bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-purple-900 to-slate-900',
                    badge: 'JUPITER INTERNAL',
                    badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
                    iconColor: 'text-cyan-400'
                };
            case 'pro':
            default:
                return {
                    bg: 'bg-gradient-to-br from-indigo-500 to-purple-600',
                    badge: 'PRO MEMBER',
                    badgeColor: 'bg-white/20 text-white',
                    iconColor: 'text-yellow-300'
                };
        }
    };

    const styles = getStyles();

    return (
        <Card
            className={`group relative overflow-hidden p-6 ${styles.bg} text-white border-none shadow-xl cursor-pointer transition-all duration-300 ${showLevelDetails ? 'row-span-2' : ''} ${!active ? 'opacity-80 grayscale-[0.3] hover:grayscale-0' : 'ring-2 ring-offset-2 ring-indigo-500'}`}
            onClick={() => setShowLevelDetails(!showLevelDetails)}
        >
            <div className="flex items-center justify-between mb-4">
                <span className="font-bold uppercase tracking-wider text-xs opacity-70">NEXUS ID</span>
                <Icon svg={showLevelDetails ? ICONS.chevronUp : ICONS.star} className={`w-5 h-5 transition-transform ${styles.iconColor}`} />
            </div>

            <div className="flex justify-between items-end mb-2">
                <div>
                    <span className="text-xs uppercase font-bold opacity-80 block">Nivel</span>
                    <div className="text-4xl font-bold">{level}</div>
                </div>
                <div className="text-right">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase backdrop-blur-sm border border-white/20 ${styles.badgeColor}`}>
                        {styles.badge}
                    </span>
                    {!active && <div className="text-[9px] uppercase mt-1 opacity-75">Click to preview</div>}
                </div>
            </div>

            <div className="w-full bg-black/20 rounded-full h-2 mb-2 mt-2">
                <div
                    className="bg-white h-2 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)] transition-all duration-1000"
                    style={{ width: `${(xpCurrent / xpMax) * 100}%` }}
                ></div>
            </div>
            <p className="text-xs opacity-80 text-right font-mono">{xpCurrent} / {xpMax} XP</p>

            {/* Collapsible Details */}
            <div className={`grid transition-all duration-300 ease-in-out ${showLevelDetails ? 'grid-rows-[1fr] opacity-100 mt-6 pt-6 border-t border-white/20' : 'grid-rows-[0fr] opacity-0'}`}>
                <div className="overflow-hidden space-y-3">
                    <div className="flex justify-between items-center text-sm">
                        <span className="opacity-80">Rango</span>
                        <span className="font-bold">{title}</span>
                    </div>
                    {active ? (
                        <>
                            <div className="flex justify-between items-center text-sm">
                                <span className="opacity-80">Completado</span>
                                <span className="font-bold">{modulesCompleted} Módulos</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="opacity-80">Racha</span>
                                <span className="font-bold">{streakDays} Días 🔥</span>
                            </div>
                        </>
                    ) : (
                        <div className="mt-4 text-center">
                            <button className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded text-xs font-bold uppercase transition-colors">
                                Validar Membresía
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
};
