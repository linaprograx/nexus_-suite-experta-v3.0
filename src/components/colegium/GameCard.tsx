import React from 'react';
import { Icon } from '../ui/Icon';
import { Button } from '../ui/Button';

interface GameCardProps {
    title: string;
    description: string;
    icon: string;
    color: string; // e.g. "from-indigo-500 to-purple-500"
    delay?: number; // Animation delay
    onPlay: () => void;
    locked?: boolean;
    stats?: string; // e.g. "Best: 1250"
}

export const GameCard: React.FC<GameCardProps> = ({
    title,
    description,
    icon,
    color,
    delay = 0,
    onPlay,
    locked = false,
    stats
}) => {
    return (
        <div
            className={`group relative overflow-hidden rounded-3xl p-6 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl cursor-pointer
                bg-white/10 dark:bg-slate-900/40 backdrop-blur-md border border-white/20 dark:border-white/5
                animate-in fade-in slide-in-from-bottom-4 fill-mode-backwards
            `}
            style={{ animationDelay: `${delay}ms` }}
            onClick={!locked ? onPlay : undefined}
        >
            {/* Background Gradient Blob */}
            <div className={`absolute -right-10 -top-10 w-40 h-40 rounded-full bg-gradient-to-br ${color} opacity-20 blur-3xl group-hover:opacity-40 transition-opacity duration-500`} />

            <div className="relative z-10 flex flex-col h-full">
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                    <div className={`p-3 rounded-2xl bg-gradient-to-br ${color} shadow-lg shadow-indigo-500/20 text-white`}>
                        <Icon svg={icon} className="w-6 h-6" />
                    </div>
                    {stats && (
                        <span className="px-3 py-1 rounded-full bg-white/10 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-300 backdrop-blur-md">
                            {stats}
                        </span>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-indigo-400 group-hover:to-purple-400 transition-all">
                        {title}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                        {description}
                    </p>
                </div>

                {/* Footer / Action */}
                <div className="mt-6 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        {locked ? 'Bloqueado' : 'Jugar Ahora'}
                    </span>
                    <Button size="icon" className={`rounded-full bg-gradient-to-r ${color} text-white shadow-lg`}>
                        <Icon svg={locked ? "lock" : "arrowRight"} className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
};
