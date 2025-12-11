import React from 'react';
import { ZeroWasteResult } from '../../types';
import { Icon } from '../ui/Icon';
import { ICONS } from '../ui/icons';

interface ZeroWasteHistorySidebarProps {
    history: ZeroWasteResult[];
    onSelect: (result: ZeroWasteResult) => void;
}

const ZeroWasteHistorySidebar: React.FC<ZeroWasteHistorySidebarProps> = ({ history, onSelect }) => {
    return (
        <div className="h-full flex flex-col bg-transparent border-0 shadow-none px-2 w-full max-w-[95%] mx-auto overflow-hidden gap-6">
            {/* Recent Results */}
            <div className="flex-1 min-h-0 flex flex-col w-full mx-auto">
                <div className="p-4 mb-2">
                    <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm uppercase tracking-wide opacity-80">Resultados Recientes</h3>
                </div>
                <div className="flex-1 overflow-y-auto px-0 custom-scrollbar space-y-4">
                    {history.slice(0, 3).map((item, index) => (
                        <div
                            key={`recent-${index}`}
                            onClick={() => onSelect(item)}
                            className="p-3 rounded-xl bg-white/30 dark:bg-slate-800/30 backdrop-blur-md border border-white/10 hover:bg-lime-50 dark:hover:bg-lime-900/10 hover:border-lime-200 transition-all cursor-pointer group shadow-sm"
                        >
                            <div className="flex justify-between items-start mb-1">
                                <h4 className="font-bold text-sm text-slate-700 dark:text-slate-200 group-hover:text-lime-600 dark:group-hover:text-lime-400 transition-colors line-clamp-1">{item.nombre}</h4>
                                <Icon svg={ICONS.chevronRight} className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <p className="text-[10px] text-slate-500 line-clamp-2">{item.ingredientes.substring(0, 60)}...</p>
                        </div>
                    ))}
                    {history.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-20 text-slate-400">
                            <p className="text-xs text-center italic opacity-50">Sin resultados recientes</p>
                        </div>
                    )}
                </div>
            </div>

            {/* History */}
            <div className="flex-1 min-h-0 flex flex-col border-t border-white/10 pt-4 w-full max-w-[94%] mx-auto">
                <div className="p-4 mb-2">
                    <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm uppercase tracking-wide opacity-80">Historial</h3>
                </div>
                <div className="flex-1 overflow-y-auto px-0 custom-scrollbar space-y-4">
                    {history.slice(3).map((item, index) => (
                        <div
                            key={`hist-${index}`}
                            onClick={() => onSelect(item)}
                            className="p-3 rounded-xl bg-white/10 dark:bg-slate-800/10 border border-white/5 hover:bg-white/20 transition-all cursor-pointer group"
                        >
                            <h4 className="font-medium text-xs text-slate-600 dark:text-slate-300 group-hover:text-lime-600 transition-colors line-clamp-1">{item.nombre}</h4>
                            <p className="text-[10px] text-slate-400">{item.ingredientes.substring(0, 30)}...</p>
                        </div>
                    ))}
                    {history.length <= 3 && (
                        <div className="flex flex-col items-center justify-center h-20 text-slate-400">
                            <p className="text-xs text-center italic opacity-50">Historial vacío</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ZeroWasteHistorySidebar;
