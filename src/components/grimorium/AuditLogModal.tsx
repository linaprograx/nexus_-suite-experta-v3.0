import React from 'react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { useApp } from '../../context/AppContext';
import { Icon } from '../ui/Icon';
import { ICONS } from '../ui/icons';
import { AUDIT_COLLECTION, AuditRecord } from '../../core/actions/action.audit';

const timeAgo = (ts: number): string => {
    const s = Math.floor((Date.now() - ts) / 1000);
    if (s < 60) return 'hace un momento';
    const m = Math.floor(s / 60);
    if (m < 60) return `hace ${m} min`;
    const h = Math.floor(m / 60);
    if (h < 24) return `hace ${h} h`;
    const d = Math.floor(h / 24);
    return `hace ${d} d`;
};

const STATUS_STYLE: Record<string, { label: string; cls: string; icon: string }> = {
    success: { label: 'Aplicada', cls: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10', icon: ICONS.check },
    failed: { label: 'Fallida', cls: 'text-rose-600 dark:text-rose-400 bg-rose-500/10', icon: ICONS.x },
    reverted: { label: 'Revertida', cls: 'text-amber-600 dark:text-amber-400 bg-amber-500/10', icon: ICONS.refresh },
};

export const AuditLogModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { db, userId } = useApp();
    const [records, setRecords] = React.useState<AuditRecord[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        (async () => {
            if (!db || !userId) { setLoading(false); return; }
            try {
                const q = query(collection(db, AUDIT_COLLECTION(userId)), orderBy('timestamp', 'desc'), limit(100));
                const snap = await getDocs(q);
                setRecords(snap.docs.map(d => ({ ...(d.data() as AuditRecord), id: d.id })));
            } catch (err) {
                console.error('[AUDIT] Failed to load audit log:', err);
            } finally {
                setLoading(false);
            }
        })();
    }, [db, userId]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-md animate-in fade-in duration-200" onClick={onClose} style={{ WebkitBackdropFilter: 'blur(12px)' }} />

            <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/60 dark:border-white/10 overflow-hidden animate-in fade-in duration-200">
                {/* Header */}
                <div className="relative px-5 py-4 shrink-0 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 overflow-hidden flex items-center justify-between">
                    <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                    <div className="relative z-10 flex items-center gap-3">
                        <span className="p-2 rounded-xl bg-white/20 backdrop-blur-sm text-white"><Icon svg={ICONS.shield} className="w-5 h-5" /></span>
                        <div>
                            <h2 className="text-base font-bold text-white">Historial de acciones</h2>
                            <p className="text-xs text-white/70">Qué cambió el asistente, cuándo y sobre qué</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="relative z-10 w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors">
                        <Icon svg={ICONS.x} className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
                    {loading ? (
                        <div className="text-center py-16 text-sm text-slate-400">Cargando historial…</div>
                    ) : records.length === 0 ? (
                        <div className="text-center py-16">
                            <Icon svg={ICONS.shield || ICONS.activity} className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                            <p className="text-sm text-slate-500 dark:text-slate-400">Aún no hay acciones registradas.</p>
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Cuando aceptes una sugerencia del asistente, aparecerá aquí.</p>
                        </div>
                    ) : (
                        <ul className="space-y-2">
                            {records.map(r => {
                                const st = STATUS_STYLE[r.status] || STATUS_STYLE.success;
                                return (
                                    <li key={r.id} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                        <span className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${st.cls}`}>
                                            <Icon svg={st.icon} className="w-4 h-4" />
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{r.title}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{r.details}</p>
                                            {r.entityId && <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">entidad: {r.entityId}</p>}
                                        </div>
                                        <div className="shrink-0 text-right">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${st.cls}`}>{st.label}</span>
                                            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">{timeAgo(r.timestamp)}</p>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
};
