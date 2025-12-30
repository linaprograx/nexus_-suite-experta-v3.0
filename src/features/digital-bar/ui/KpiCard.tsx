import React from 'react';

interface KpiCardProps {
    title: string;
    value: string | number;
    subValue?: string;
    icon?: React.ReactNode;
    color?: string; // Tailwind class like 'text-cyan-500'
}

export const KpiCard: React.FC<KpiCardProps> = ({ title, value, subValue, icon, color = 'text-cyan-500' }) => {
    return (
        <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur border border-cyan-100 dark:border-cyan-900 rounded-xl p-4 shadow-sm hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-2">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${color}`}>{title}</span>
                {icon && <div className={`${color} opacity-80`}>{icon}</div>}
            </div>
            <div className="text-2xl font-black text-slate-800 dark:text-slate-100">
                {value}
            </div>
            {subValue && (
                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
                    {subValue}
                </div>
            )}
        </div>
    );
};
