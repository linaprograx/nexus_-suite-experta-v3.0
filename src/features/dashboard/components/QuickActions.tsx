import React from 'react';
import { Icon } from '../../../components/ui/Icon';
import { ICONS } from '../../../components/ui/icons';
import { useNavigate } from 'react-router-dom';

export const QuickActions: React.FC = () => {
    const navigate = useNavigate();

    const actions = [
        { label: 'Nueva Receta', icon: ICONS.flask, route: '/grimorium', color: 'text-emerald-500', group: 'group-hover:text-emerald-500' },
        { label: 'Explorar', icon: ICONS.search, route: '/cerebrity', color: 'text-violet-500', group: 'group-hover:text-violet-500' }, // Fallback if telescope not there
        { label: 'Idea Rápida', icon: ICONS.lightbulb, route: '/pizarron', color: 'text-amber-500', group: 'group-hover:text-amber-500' },
        { label: 'Analizar', icon: ICONS.critic, route: '/unleash', color: 'text-rose-500', group: 'group-hover:text-rose-500' }
    ];

    return (
        <div className="grid grid-cols-2 gap-3">
            {actions.map((action, idx) => (
                <button
                    key={idx}
                    onClick={() => navigate(action.route)}
                    className="group flex flex-col items-center justify-center p-3 bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-700 backdrop-blur-xl rounded-xl border border-indigo-500/50 shadow-[0_0_15px_-3px_rgba(99,102,241,0.25),_0_10px_30px_-5px_rgba(0,0,0,0.1)] dark:shadow-[0_0_20px_-3px_rgba(99,102,241,0.3),_0_10px_30px_-5px_rgba(0,0,0,0.5)] hover:shadow-[0_0_25px_-3px_rgba(99,102,241,0.4),_0_15px_35px_-5px_rgba(0,0,0,0.15)] transition-all duration-300 relative overflow-hidden"
                >
                    {/* Glass Highlight */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                    <div className={`p-2 rounded-full bg-gray-50 dark:bg-white/5 mb-2 group-hover:scale-110 transition-transform ${action.color}`}>
                        <Icon svg={action.icon} className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-bold text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                        {action.label}
                    </span>
                </button>
            ))}
        </div>
    );
};
