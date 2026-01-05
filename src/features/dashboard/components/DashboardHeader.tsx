import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAvatarCognition } from '../../../hooks/useAvatarCognition';
import { useApp } from '../../../context/AppContext';
import { Icon } from '../../../components/ui/Icon';
import { ICONS } from '../../../components/ui/icons';

interface DashboardHeaderProps {
    xp: number;
    level: number;
    nextLevelXp: number;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ xp, level, nextLevelXp }) => {
    const navigate = useNavigate();
    const { userProfile } = useApp();
    const { activeAvatarType, getActiveConfig, getActiveProfile } = useAvatarCognition();
    const config = getActiveConfig();
    const profile = getActiveProfile();

    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Calculate progress %
    const progress = Math.min(100, Math.max(0, (xp / nextLevelXp) * 100));

    // Get Greeting based on time
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Buenos días' : hour < 20 ? 'Buenas tardes' : 'Buenas noches';
    const name = userProfile?.displayName?.split(' ')[0] || 'Chef';

    return (
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">

            {/* 1. Identity & Greeting */}
            <div className="flex items-center gap-5">
                <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full opacity-75 group-hover:opacity-100 transition duration-500 blur-[2px]"></div>
                    <div className="relative w-16 h-16 rounded-full bg-slate-900 border-2 border-white/10 flex items-center justify-center text-3xl shadow-2xl overflow-hidden">
                        {userProfile?.photoURL ? (
                            <img src={userProfile.photoURL} alt="User" className="w-full h-full object-cover" />
                        ) : (
                            <span>{config.emoji}</span>
                        )}
                    </div>
                    {/* Status Dot */}
                    <div className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 border-2 border-slate-900 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                </div>

                <div>
                    <h1 className="text-3xl font-serif text-gray-900 dark:text-white leading-none mb-1">
                        {greeting}, <span className="text-indigo-600 dark:text-indigo-400">{name}</span>
                    </h1>
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <span>{activeAvatarType}</span>
                        <span className="w-1 h-1 rounded-full bg-gray-400"></span>
                        <span className="italic">"{profile?.name || 'Estándar'}"</span>
                    </div>
                </div>
            </div>

            {/* 2. Avatar Status Pill (Center/Right) */}
            <div className="flex-1 w-full xl:w-auto flex xl:justify-end gap-4">
                {/* Avatar Status Capsule */}
                <div className="relative flex items-center bg-white/50 dark:bg-slate-800/50 backdrop-blur-md border border-gray-200 dark:border-white/10 rounded-full px-2 py-2 pr-6 shadow-sm hover:shadow-md transition-all duration-300 group">

                    {/* Icon Circle */}
                    <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-300 mr-3 border border-indigo-200 dark:border-indigo-500/30">
                        <Icon svg={ICONS.star} className="w-4 h-4" />
                    </div>

                    {/* Text Info */}
                    <div className="flex flex-col mr-6">
                        <span className="text-[9px] uppercase tracking-widest font-bold text-gray-400 dark:text-slate-500 mb-0.5">Enfoque Cognitivo</span>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-700 dark:text-gray-200">{config.tone}</span>
                            <span className="text-[10px] text-gray-400">•</span>
                            <span className="text-xs text-gray-600 dark:text-gray-400">{profile?.activePrinciples.length || 0} Principios</span>
                        </div>
                    </div>

                    {/* Change Focus Logic (Mock for now, or link to Modal) */}
                    <button
                        onClick={() => navigate('/avatar')}
                        className="hidden group-hover:flex absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-indigo-600 text-white text-[10px] uppercase font-bold rounded-full tracking-wide shadow-lg hover:bg-indigo-500 transition-all"
                    >
                        Ajustar
                    </button>
                    <div className="group-hover:hidden absolute right-4 top-1/2 -translate-y-1/2">
                        <Icon svg={ICONS.chevronDown} className="w-3 h-3 text-gray-400" />
                    </div>
                </div>

                {/* Level / XP Pill */}
                <div className="hidden md:flex flex-col justify-center min-w-[140px]">
                    <div className="flex justify-between items-end mb-1">
                        <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Nivel {level}</span>
                        <span className="text-[10px] font-mono text-indigo-500">{xp}/{nextLevelXp} XP</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-1000" style={{ width: `${progress}%` }}></div>
                    </div>
                </div>
            </div>
        </div>
    );
};
