import React from 'react';
import { ZeroWasteResult } from '../../../types';
import { Icon } from '../ui/Icon';
import { ICONS } from '../ui/icons';

interface ZeroWasteHistorySidebarProps {
    history: ZeroWasteResult[];
    onSelect: (result: ZeroWasteResult) => void;
}

const ZeroWasteHistorySidebar: React.FC<ZeroWasteHistorySidebarProps> = ({ history, onSelect }) => {
    return (
        <div className="bg-white/60 dark:bg-slate-900/30 backdrop-blur-md rounded-2xl border border-white/20 dark:border-white/5 h-full flex flex-col overflow-hidden">
            <div className="p-4 border-b border-white/10 dark:border-white/5 bg-white/40 dark:bg-slate-900/40">
                <h3 className="font-semibold text-slate-800 dark:text-slate-200">Resultados Recientes</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Tus generaciones de esta sesión</p>
            </div>

            <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                {history.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                        <Icon svg={ICONS.recycle} className="w-8 h-8 mb-2 opacity-30" />
                        <p className="text-xs text-center">Aquí aparecerán tus ideas generadas.</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {history.map((item, index) => (
                            <div
                                key={index}
                                onClick={() => onSelect(item)}
                                className="p-3 rounded-xl bg-white/40 dark:bg-slate-800/40 border border-white/10 hover:bg-white/60 dark:hover:bg-slate-700/60 transition-all cursor-pointer group"
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <h4 className="font-medium text-sm text-slate-700 dark:text-slate-200 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors line-clamp-1">{item.nombre}</h4>
                                    <Icon svg={ICONS.chevronRight} className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <p className="text-[10px] text-slate-500 line-clamp-2">{item.ingredientes.substring(0, 60)}...</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ZeroWasteHistorySidebar;
