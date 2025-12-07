import React from 'react';
import { ICONS } from '../ui/icons';
import { Icon } from '../ui/Icon';

interface StockSidebarProps {
    // Add props if needed
}

const StockSidebar: React.FC<StockSidebarProps> = () => {
    return (
        <div className="bg-white/60 dark:bg-slate-900/30 backdrop-blur-md rounded-2xl border border-white/20 dark:border-white/5 h-full flex flex-col p-6 shadow-sm overflow-hidden">
            <div className="pb-6 border-b border-white/10 dark:border-white/5 flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                    <Icon svg={ICONS.box} className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="font-bold text-slate-800 dark:text-white">Stock</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Gestión</p>
                </div>
            </div>

            <div className="mt-6 space-y-6 overflow-y-auto custom-scrollbar">
                <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Resumen de Alertas</h4>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-800/30">
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-sm text-red-700 dark:text-red-300 font-medium">3 Ingredientes Bajos</span>
                    </div>
                </div>

                <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Proveedores</h4>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between p-3 rounded-xl bg-white/40 dark:bg-slate-800/40 border border-white/10 dark:border-white/5">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Licores S.A.</span>
                            <span className="text-xs text-slate-400">Principal</span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-xl bg-white/40 dark:bg-slate-800/40 border border-white/10 dark:border-white/5">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Frutas Frescas</span>
                            <span className="text-xs text-slate-400">Diario</span>
                        </div>
                    </div>
                </div>

                <div className="mt-auto p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-800 dark:text-blue-200">
                    <div className="flex gap-3">
                        <Icon svg={ICONS.info} className="w-5 h-5 shrink-0 text-blue-600" />
                        <p className="text-xs leading-relaxed">
                            Genera listas de compra basadas en proyección de ventas para optimizar tu inventario.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StockSidebar;
