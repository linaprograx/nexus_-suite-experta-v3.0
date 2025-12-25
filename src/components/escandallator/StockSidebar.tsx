import React from 'react';
import { ICONS } from '../ui/icons';
import { Icon } from '../ui/Icon';
import { useApp, useCapabilities } from '../../context/AppContext';

interface StockSidebarProps {
    onAction?: (action: 'new_product' | 'providers' | 'movements') => void;
}

const StockSidebar: React.FC<StockSidebarProps> = ({ onAction }) => {
    const { hasLayer } = useCapabilities();
    const canAssist = hasLayer('assisted_intelligence');

    return (
        <div className="h-full flex flex-col bg-transparent border-0 shadow-none overflow-hidden">
            <div className="p-6 space-y-8 overflow-y-auto custom-scrollbar w-full max-w-[95%] mx-auto">
                <div>
                    <h4 className="text-xs font-bold text-slate-500/80 uppercase tracking-wider mb-3 drop-shadow-sm">Acciones Rápidas</h4>
                    <div className="space-y-4">
                        <div className="p-4 bg-slate-100 dark:bg-slate-800/50 rounded-xl text-center border-2 border-dashed border-slate-200 dark:border-slate-700">
                            <p className="text-sm text-slate-400">Stock activo</p>
                            <p className="text-[10px] text-slate-400 mt-1">Gestión Operativa</p>
                        </div>
                    </div>
                </div>

                {canAssist && (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-700">
                        <h4 className="text-xs font-bold text-slate-500/80 uppercase tracking-wider mb-3 drop-shadow-sm">Monitor de Inventario</h4>
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-indigo-50/50 border border-indigo-100/50 backdrop-blur-sm">
                            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                            <span className="text-sm text-indigo-700 font-medium">Sistema Activo</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
                            Nexus monitoriza tu inventario en tiempo real comparando con precios de mercado activos.
                        </p>
                    </div>
                )}

                <div className="mt-auto p-4 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-800 dark:text-sky-200 backdrop-blur-sm">
                    <div className="flex gap-3">
                        <Icon svg={ICONS.info} className="w-5 h-5 shrink-0 text-sky-600" />
                        <p className="text-xs leading-relaxed">
                            <strong>Operativa:</strong> Esta sección solo refleja ítems en posesión. Para buscar nuevos ingredientes, usa Grimorio Market.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StockSidebar;
