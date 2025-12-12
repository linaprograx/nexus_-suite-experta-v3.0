
import React from 'react';
import { ICONS } from '../ui/icons';
import { Ingredient } from '../../types';
import { Icon } from '../ui/Icon';

interface StockSidebarProps {
    onAction: (action: 'new_product' | 'providers' | 'movements') => void;
}

const StockSidebar: React.FC<StockSidebarProps> = ({ onAction }) => {
    return (
        <div className="h-full flex flex-col bg-transparent border-0 shadow-none overflow-hidden">
            <div className="p-6 space-y-8 overflow-y-auto custom-scrollbar w-full max-w-[95%] mx-auto">
                <div>
                    <h4 className="text-xs font-bold text-slate-500/80 uppercase tracking-wider mb-3 drop-shadow-sm">Acciones Rápidas</h4>
                    <div className="space-y-4">
                        {/* Modified: merged button for Providers, larger and highlighted */}
                        <button onClick={() => onAction('providers')} className="w-full text-left px-6 py-8 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 shadow-lg shadow-sky-500/20 border border-white/10 transition-all group flex flex-col justify-between h-32 relative overflow-hidden">
                            <div className="relative z-10 flex justify-between items-start">
                                <span className="p-3 bg-white/20 rounded-xl backdrop-blur-md">
                                    <Icon svg={ICONS.user} className="w-8 h-8 text-white" />
                                </span>
                                <Icon svg={ICONS.chevronRight} className="w-5 h-5 text-white/50 group-hover:translate-x-1 transition-transform" />
                            </div>
                            <div className="relative z-10">
                                <h3 className="text-xl font-bold text-white mb-1">Proveedores</h3>
                                <p className="text-sky-100/80 text-sm">Gestionar catálogo y pedidos</p>
                            </div>

                            {/* Decorative background icons */}
                            <Icon svg={ICONS.grid} className="absolute -bottom-4 -right-4 w-32 h-32 text-white/5 -rotate-12" />
                        </button>
                    </div>
                </div>

                <div>
                    <h4 className="text-xs font-bold text-slate-500/80 uppercase tracking-wider mb-3 drop-shadow-sm">Resumen de Alertas</h4>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-rose-50/50 border border-rose-100/50 backdrop-blur-sm">
                        <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                        <span className="text-sm text-rose-700 font-medium">3 Ingredientes Bajos</span>
                    </div>
                </div>

                <div>
                    <h4 className="text-xs font-bold text-slate-500/80 uppercase tracking-wider mb-3 drop-shadow-sm">Proveedores Activos</h4>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between p-3 rounded-xl bg-white/20 border border-white/10 backdrop-blur-sm">
                            <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Licores S.A.</span>
                            </div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 bg-white/30 px-2 py-1 rounded-lg">Principal</span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-xl bg-white/20 border border-white/10 backdrop-blur-sm">
                            <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Frutas Frescas</span>
                            </div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 bg-white/30 px-2 py-1 rounded-lg">Diario</span>
                        </div>
                    </div>
                </div>

                <div className="mt-auto p-4 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-800 dark:text-sky-200 backdrop-blur-sm">
                    <div className="flex gap-3">
                        <Icon svg={ICONS.info} className="w-5 h-5 shrink-0 text-sky-600" />
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
