import React from 'react';
import { Icon } from '../ui/Icon';
import { ICONS } from '../ui/icons';

interface MakeMenuSidebarProps {
    activeMode: 'designer' | 'critic';
    onModeChange: (mode: 'designer' | 'critic') => void;
}

const MakeMenuSidebar: React.FC<MakeMenuSidebarProps> = ({ activeMode, onModeChange }) => {
    return (
        <div className="backdrop-blur-xl bg-white/40 dark:bg-slate-900/40 border border-white/20 shadow-lg rounded-2xl h-full flex flex-col overflow-hidden p-4 gap-6">
            <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 px-2">Personalización</h3>
                <div className="space-y-4">
                    <div className="bg-white/40 p-3 rounded-xl border border-white/10">
                        <label className="text-xs font-semibold text-slate-600 block mb-2">Estilo Base</label>
                        <select className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 text-slate-700 outline-none">
                            <option>Moderno</option>
                            <option>Clásico</option>
                            <option>Minimalista</option>
                        </select>
                    </div>

                    <div className="bg-white/40 p-3 rounded-xl border border-white/10">
                        <label className="text-xs font-semibold text-slate-600 block mb-2">Acento de Color</label>
                        <div className="flex gap-2">
                            <div className="w-6 h-6 rounded-full bg-slate-900 cursor-pointer border-2 border-transparent hover:scale-110 transition-transform"></div>
                            <div className="w-6 h-6 rounded-full bg-red-600 cursor-pointer border-2 border-transparent hover:scale-110 transition-transform"></div>
                            <div className="w-6 h-6 rounded-full bg-amber-500 cursor-pointer border-2 border-transparent hover:scale-110 transition-transform"></div>
                            <div className="w-6 h-6 rounded-full bg-emerald-600 cursor-pointer border-2 border-transparent hover:scale-110 transition-transform"></div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-auto bg-rose-50 dark:bg-rose-900/10 rounded-xl p-4 border border-rose-100 dark:border-rose-800/20">
                <h4 className="text-sm font-semibold text-rose-800 dark:text-rose-200 mb-2">
                    Modo Creativo
                </h4>
                <p className="text-xs text-rose-600 dark:text-rose-300 leading-relaxed">
                    Diseña menús impactantes combinando tus recetas con conceptos generados por IA. Usa el panel derecho para configurar.
                </p>
            </div>
        </div>
    );
};

export default MakeMenuSidebar;
