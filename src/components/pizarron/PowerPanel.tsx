import React from 'react';
import { Icon } from '../ui/Icon';
import { Button } from '../ui/Button';

interface PowerPanelProps {
    title: string;
    icon: string;
    theme: 'violet' | 'emerald' | 'lime' | 'amber' | 'teal' | 'blue' | 'orange' | 'pink' | 'purple';
    onClose: () => void;
    children: React.ReactNode;
    subtitle?: string;
}

export const PowerPanel: React.FC<PowerPanelProps> = ({ title, icon, theme, onClose, children, subtitle }) => {

    const themeStyles = {
        violet: {
            bg: 'bg-violet-50 dark:bg-violet-900/10',
            border: 'border-violet-100 dark:border-violet-800/30',
            text: 'text-violet-700 dark:text-violet-300',
            iconBg: 'bg-violet-100 dark:bg-violet-800/50'
        },
        emerald: {
            bg: 'bg-emerald-50 dark:bg-emerald-900/10',
            border: 'border-emerald-100 dark:border-emerald-800/30',
            text: 'text-emerald-700 dark:text-emerald-300',
            iconBg: 'bg-emerald-100 dark:bg-emerald-800/50'
        },
        lime: {
            bg: 'bg-lime-50 dark:bg-lime-900/10',
            border: 'border-lime-100 dark:border-lime-800/30',
            text: 'text-lime-700 dark:text-lime-300',
            iconBg: 'bg-lime-100 dark:bg-lime-800/50'
        },
        amber: {
            bg: 'bg-amber-50 dark:bg-amber-900/10',
            border: 'border-amber-100 dark:border-amber-800/30',
            text: 'text-amber-700 dark:text-amber-300',
            iconBg: 'bg-amber-100 dark:bg-amber-800/50'
        },
        teal: {
            bg: 'bg-teal-50 dark:bg-teal-900/10',
            border: 'border-teal-100 dark:border-teal-800/30',
            text: 'text-teal-700 dark:text-teal-300',
            iconBg: 'bg-teal-100 dark:bg-teal-800/50'
        },
        blue: {
            bg: 'bg-blue-50 dark:bg-blue-900/10',
            border: 'border-blue-100 dark:border-blue-800/30',
            text: 'text-blue-700 dark:text-blue-300',
            iconBg: 'bg-blue-100 dark:bg-blue-800/50'
        },
        orange: {
            bg: 'bg-orange-50 dark:bg-orange-900/10',
            border: 'border-orange-100 dark:border-orange-800/30',
            text: 'text-orange-700 dark:text-orange-300',
            iconBg: 'bg-orange-100 dark:bg-orange-800/50'
        },
        pink: {
            bg: 'bg-pink-50 dark:bg-pink-900/10',
            border: 'border-pink-100 dark:border-pink-800/30',
            text: 'text-pink-700 dark:text-pink-300',
            iconBg: 'bg-pink-100 dark:bg-pink-800/50'
        },
        purple: {
            bg: 'bg-purple-50 dark:bg-purple-900/10',
            border: 'border-purple-100 dark:border-purple-800/30',
            text: 'text-purple-700 dark:text-purple-300',
            iconBg: 'bg-purple-100 dark:bg-purple-800/50'
        },
    };

    const s = themeStyles[theme];

    return (
        <div className={`${s.bg} p-6 rounded-2xl border ${s.border} animate-in fade-in zoom-in-95 duration-300 shadow-sm mb-6 flex flex-col`}>
            {/* Header */}
            <div className="flex justify-between items-start mb-6 pb-4 border-b border-black/5 dark:border-white/5">
                <div className="flex items-center gap-3">
                    <div className={`${s.iconBg} p-2 rounded-xl`}>
                        <Icon svg={icon} className={`w-6 h-6 ${s.text}`} />
                    </div>
                    <div>
                        <h4 className={`font-bold text-lg leading-tight ${s.text}`}>
                            {title}
                        </h4>
                        {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
                    </div>
                </div>
                <Button size="sm" variant="ghost" onClick={onClose} className="hover:bg-black/5 dark:hover:bg-white/5 rounded-full w-8 h-8 p-0 flex items-center justify-center">
                    <span className="text-xl leading-none">&times;</span>
                </Button>
            </div>

            {/* Content */}
            <div className="flex-1">
                {children}
            </div>
        </div>
    );
};
