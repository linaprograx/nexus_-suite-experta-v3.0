import React from 'react';
import { useSuppliers } from '../../features/suppliers/hooks/useSuppliers';

export const SuppliersList: React.FC<{ db: any, userId: string, onSelect?: (supplier: any) => void }> = ({ db, userId, onSelect }) => {
    const { suppliers, loading } = useSuppliers({ db, userId });

    if (loading) return <div className="text-xs text-slate-400 p-2">Cargando proveedores...</div>;

    if (suppliers.length === 0) return (
        <div className="text-xs text-slate-400 p-2 italic border border-dashed border-slate-300 rounded-lg">
            No hay proveedores activos.
        </div>
    );

    return (
        <div className="space-y-2 p-1">
            {suppliers.map(s => (
                <div
                    key={s.id}
                    onClick={() => onSelect && onSelect(s)}
                    className="flex items-center justify-between p-3 rounded-xl bg-white/40 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 hover:border-emerald-500/50 hover:bg-emerald-50 dark:hover:bg-slate-800/80 transition-all cursor-pointer group shadow-sm"
                >
                    <div className="flex flex-col gap-0.5 w-full">
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">{s.name}</span>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-500 uppercase tracking-wider">{s.category || 'General'}</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};
