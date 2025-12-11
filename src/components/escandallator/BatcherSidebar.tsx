import React from 'react';
import { ICONS } from '../ui/icons';
import { Icon } from '../ui/Icon';

interface BatcherSidebarProps {
    onConfigureBatch: (amount: number, unit: 'Litros' | 'Botellas') => void;
}

const BatcherSidebar: React.FC<BatcherSidebarProps> = ({ onConfigureBatch }) => {
    return (
        <div className="h-full flex flex-col bg-transparent border-0 shadow-none overflow-hidden">
            <div className="p-6 space-y-8 overflow-y-auto custom-scrollbar w-full max-w-[95%] mx-auto">
                <div>
                    <h4 className="text-xs font-bold text-slate-500/80 uppercase tracking-wider mb-3 drop-shadow-sm">Accesos Rápidos</h4>
                    <div className="space-y-2">
                        <button
                            onClick={() => onConfigureBatch(1, 'Litros')}
                            className="w-full text-left px-4 py-3 rounded-xl bg-white/20 hover:bg-white/30 border border-white/10 transition-colors flex items-center gap-3 group backdrop-blur-sm"
                        >
                            <Icon svg={ICONS.beaker} className="w-4 h-4 text-slate-500 group-hover:text-amber-500" />
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Nuevo Batch (1L)</span>
                        </button>
                        <button
                            onClick={() => onConfigureBatch(1, 'Botellas')}
                            className="w-full text-left px-4 py-3 rounded-xl bg-white/20 hover:bg-white/30 border border-white/10 transition-colors flex items-center gap-3 group backdrop-blur-sm"
                        >
                            <Icon svg={ICONS.bottle} className="w-4 h-4 text-slate-500 group-hover:text-amber-500" />
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Nuevo Batch (700ml)</span>
                        </button>
                    </div>
                </div>

                <div>
                    <h4 className="text-xs font-bold text-slate-500/80 uppercase tracking-wider mb-3 drop-shadow-sm">Historial Reciente</h4>
                    <div className="text-center py-6 text-slate-400 bg-white/10 rounded-xl border border-dashed border-white/20">
                        <p className="text-xs">No hay batches recientes</p>
                    </div>
                </div>

                <div className="mt-auto p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-200">
                    <div className="flex gap-3">
                        <Icon svg={ICONS.info} className="w-5 h-5 shrink-0 text-amber-600" />
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
