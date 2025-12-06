import React from 'react';
import { Icon } from '../ui/Icon';
import { ICONS } from '../ui/icons';

interface MakeMenuSidebarProps {
    activeMode: 'designer' | 'critic';
    onModeChange: (mode: 'designer' | 'critic') => void;
}

const MakeMenuSidebar: React.FC<MakeMenuSidebarProps> = ({ activeMode, onModeChange }) => {
    return (
        <div className="bg-white/60 dark:bg-slate-900/30 backdrop-blur-md rounded-2xl border border-white/20 dark:border-white/5 h-full flex flex-col overflow-hidden p-4 gap-6">
            <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 px-2">Navegación</h3>
                <div className="space-y-2">
                    <button
                        onClick={() => onModeChange('designer')}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${activeMode === 'designer'
                                ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-white/40 dark:hover:bg-slate-800/40'
                            }`}
                    >
                        <Icon svg={ICONS.menu} className="w-5 h-5" />
                        <span className="font-medium">Diseñador</span>
                    </button>

                    <button
                        onClick={() => onModeChange('critic')}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${activeMode === 'critic'
                                ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-white/40 dark:hover:bg-slate-800/40'
                            }`}
                    >
                        <Icon svg={ICONS.critic} className="w-5 h-5" />
                        <span className="font-medium">El Crítico</span>
                    </button>
                </div>
            </div>

            <div className="bg-rose-50 dark:bg-rose-900/10 rounded-xl p-4 border border-rose-100 dark:border-rose-800/20">
                <h4 className="text-sm font-semibold text-rose-800 dark:text-rose-200 mb-2">
                    {activeMode === 'designer' ? 'Modo Creativo' : 'Modo Analítico'}
                </h4>
                <p className="text-xs text-rose-600 dark:text-rose-300 leading-relaxed">
                    {activeMode === 'designer'
                        ? 'Diseña menús impactantes combinando tus recetas con conceptos generados por IA.'
                        : 'Obtén feedback profesional instantáneo sobre tus propuestas de menú.'
                    }
                </p>
            </div>
        </div>
    );
};

export default MakeMenuSidebar;
