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
}

export const NexusMemberPassCard: React.FC<NexusMemberPassCardProps> = ({
    level = 12,
    xpCurrent = 3450,
    xpMax = 5000,
    title = 'Coctelería Clásica',
    modulesCompleted = 42,
    streakDays = 5
}) => {
    const [showLevelDetails, setShowLevelDetails] = React.useState(false);

    return (
        <Card
            className={`group relative overflow-hidden p-6 bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-none shadow-xl cursor-pointer transition-all duration-300 ${showLevelDetails ? 'row-span-2' : ''}`}
            onClick={() => setShowLevelDetails(!showLevelDetails)}
        >
            <div className="flex items-center justify-between mb-4">
                <span className="font-bold uppercase tracking-wider text-xs opacity-70">NEXUS MEMBER PASS</span>
                <Icon svg={showLevelDetails ? ICONS.chevronUp : ICONS.star} className="w-5 h-5 text-yellow-300 transition-transform" />
            </div>

            <div className="flex justify-between items-end mb-2">
                <div>
                    <span className="text-xs uppercase font-bold opacity-80 block">Nivel Actual</span>
                    <div className="text-4xl font-bold">{level}</div>
                </div>
                <div className="text-right">
                    <span className="px-2 py-1 bg-white/20 rounded text-[10px] font-bold uppercase backdrop-blur-sm border border-white/20">
                        PRO MEMBER
                    </span>
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
                        <span className="opacity-80">Dominio</span>
                        <span className="font-bold">{title}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="opacity-80">Completado</span>
                        <span className="font-bold">{modulesCompleted} Módulos</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="opacity-80">Racha</span>
                        <span className="font-bold">{streakDays} Días 🔥</span>
                    </div>
                    <div className="mt-4 p-3 bg-white/10 rounded-xl text-xs text-center border border-white/10">
                        Próxima Recompensa: <br />
                        <strong className="text-yellow-300">Badge 'Mixólogo Master'</strong>
                    </div>
                </div>
            </div>
        </Card>
    );
};
