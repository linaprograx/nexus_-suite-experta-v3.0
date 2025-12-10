import React from 'react';
import { ICONS } from '../ui/icons';
import { Icon } from '../ui/Icon';

interface BatcherSidebarProps {
    onConfigureBatch: (amount: number, unit: 'Litros' | 'Botellas') => void;
}

const BatcherSidebar: React.FC<BatcherSidebarProps> = ({ onConfigureBatch }) => {
    return (
        <div className="bg-white/60 dark:bg-slate-900/30 backdrop-blur-md rounded-2xl border border-white/20 dark:border-white/5 h-full flex flex-col p-6 shadow-sm overflow-hidden">
            <div className="pb-6 border-b border-white/10 dark:border-white/5 flex items-center gap-3">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400">
                    <Icon svg={ICONS.layers} className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="font-bold text-slate-800 dark:text-white">Batcher</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Producción</p>
                </div>
            </div>

            <div className="mt-6 space-y-6 overflow-y-auto custom-scrollbar">
                <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Accesos Rápidos</h4>
                    <div className="space-y-2">
                        <button
                            onClick={() => onConfigureBatch(1, 'Litros')}
                            className="w-full text-left px-4 py-3 rounded-xl bg-white/40 dark:bg-slate-800/40 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 border border-white/10 dark:border-white/5 transition-colors flex items-center gap-3 group"
                        >
                            <Icon svg={ICONS.beaker} className="w-4 h-4 text-slate-400 group-hover:text-emerald-500" />
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Nuevo Batch (1L)</span>
                        </button>
                        <button
                            onClick={() => onConfigureBatch(1, 'Botellas')}
                            className="w-full text-left px-4 py-3 rounded-xl bg-white/40 dark:bg-slate-800/40 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 border border-white/10 dark:border-white/5 transition-colors flex items-center gap-3 group"
                        >
                            <Icon svg={ICONS.bottle} className="w-4 h-4 text-slate-400 group-hover:text-emerald-500" />
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Nuevo Batch (700ml)</span>
                        </button>
                    </div>
                </div>

                <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Historial Reciente</h4>
                    <div className="text-center py-6 text-slate-400 bg-slate-50/50 dark:bg-slate-800/20 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                        <p className="text-xs">No hay batches recientes</p>
                    </div>
                </div>

                <div className="mt-auto p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-200">
                    <div className="flex gap-3">
                        <Icon svg={ICONS.info} className="w-5 h-5 shrink-0 text-emerald-600" />
                        <p className="text-xs leading-relaxed">
                            Recuerda que la dilución del 20% es estándar para cócteles agitados. Ajusta según el método.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BatcherSidebar;
