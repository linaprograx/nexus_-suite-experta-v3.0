
import React, { useState } from 'react';
import { useUserIntelProfile } from '../hooks/useUserIntelProfile';
import { LearningEngine } from '../../../core/learning/learning.engine';
import { useApp, useCapabilities } from '../../../context/AppContext';
import { Button } from '../../../components/ui/Button';
import { Icon } from '../../../components/ui/Icon';
import { ICONS } from '../../../components/ui/icons';
import { LearningTransparency } from '../../../core/learning/learning.transparency';
import { IntelChangelog } from '../../../core/learning/learning.changelog';
import { LearningGuardrails } from '../../../core/learning/learning.guardrails';

interface IntelPreferencesPanelProps {
    onClose: () => void;
}

export const IntelPreferencesPanel: React.FC<IntelPreferencesPanelProps> = ({ onClose }) => {
    const { profile, loading } = useUserIntelProfile();
    const { db, userId } = useApp();
    const [saving, setSaving] = useState(false);

    // Local state
    const [threshold, setThreshold] = useState(profile.visibility.active_confidence_threshold || 80);
    const [maxInsights, setMaxInsights] = useState(profile.visibility.max_visible_insights_default || 2);

    // Transparency State
    const [changelog, setChangelog] = useState<any[]>([]);
    const [systemState, setSystemState] = useState<any>(null);

    // Gating
    const { canCustomizeThresholds, currentPlan } = useCapabilities();

    React.useEffect(() => {
        if (profile) {
            setSystemState(LearningTransparency.getSystemState(profile));
            // In a real app we might fetch from firestore, here we use the local cache service
            setChangelog(IntelChangelog.getRecentEntries());
        }
    }, [profile]);

    const handleSave = async () => {
        if (!db || !userId) return;
        setSaving(true);

        // Guardrails Check (Clamp before saving)
        let newProfile = { ...profile };
        newProfile.visibility.active_confidence_threshold = threshold;
        newProfile.visibility.max_visible_insights_default = maxInsights;

        // Apply Clamps
        newProfile = LearningGuardrails.clampProfile(newProfile);

        // Update local state to reflect clamps if they happened
        setThreshold(newProfile.visibility.active_confidence_threshold);
        setMaxInsights(newProfile.visibility.max_visible_insights_default);

        // Track/Save
        // Direct save logic would go here. For now we rely on the side-effect or Engine method if it existed.
        // We'll just track the event as 'manual_adjustment'
        // Simulating save for Phase 4.1 demo
        console.log('Saved guarded profile', newProfile);

        // Log manual change in changelog
        await IntelChangelog.logChange(db, userId, {
            ruleId: 'MANUAL_ADJUSTMENT',
            description: 'Ajuste manual de preferencias.',
            before: '?',
            after: 'Actualizado',
            scope: 'global',
            reversible: true
        });

        setTimeout(() => {
            setSaving(false);
            onClose();
        }, 500);
    };

    const handleReset = async () => {
        if (!db || !userId) return;
        if (confirm('¿Estás seguro? Esto restablecerá toda la memoria de aprendizaje y pausará el auto-ajuste por 48 horas.')) {
            await LearningTransparency.resetToDefaults(db, userId);
            onClose();
        }
    };

    const handleRevert = async (entry: any) => {
        if (!db || !userId) return;
        await LearningTransparency.revertChange(db, userId, entry.description);
        // Refresh log
        setChangelog(IntelChangelog.getRecentEntries());
        alert('Cambio revertido (simulado).');
    };

    if (loading) return <div className="p-4 text-slate-500">Cargando perfil...</div>;

    const snoozedCount = profile.snoozes ? Object.keys(profile.snoozes.byEntity || {}).length : 0;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
                <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
                    <div>
                        <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                            <Icon svg={ICONS.sparkles} className="w-5 h-5 text-amber-500" />
                            Inteligencia Activa
                        </h3>
                        <p className="text-xs text-slate-500">Transparencia y control total sobre el aprendizaje.</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={onClose}><Icon svg={ICONS.x} className="w-5 h-5 text-slate-400" /></Button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar space-y-8">

                    {/* SYSTEM STATE SUMMARY */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Nivel Silencio</span>
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{systemState?.silenceLevel || '-'}</span>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Confianza</span>
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{systemState?.confidenceMode || '-'}</span>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Acciones</span>
                            <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{systemState?.actionMode || '-'}</span>
                        </div>
                    </div>

                    {/* MANUAL CONTROLS */}
                    <div className="space-y-6">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">Preferencias Manuales</h4>

                        {/* Confidence Slider */}
                        <div className={`space-y-3 ${!canCustomizeThresholds ? 'opacity-50 pointer-events-none' : ''}`}>
                            <div className="flex justify-between">
                                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Umbral de Confianza {!canCustomizeThresholds && <span className="text-xs font-normal text-amber-500 ml-2">(Requiere Plan EXPERT)</span>}</label>
                                <span className="text-sm font-mono font-bold text-indigo-600">{threshold}%</span>
                            </div>
                            <input
                                type="range"
                                min="75" // Guardrail Min
                                max="90" // Guardrail Max
                                value={threshold}
                                onChange={(e) => setThreshold(Number(e.target.value))}
                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                            />
                            <p className="text-xs text-slate-500">
                                Filtra sugerencias por debajo de este % de certeza.
                            </p>
                        </div>

                        {/* Max Insights */}
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Máx. Sugerencias</label>
                                <span className="text-sm font-mono font-bold text-indigo-600">{maxInsights}</span>
                            </div>
                            <div className="flex gap-2">
                                {[1, 2].map(n => ( // Guardrail Limit: Max 2
                                    <button
                                        key={n}
                                        onClick={() => setMaxInsights(n)}
                                        className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-all ${maxInsights === n
                                            ? 'bg-indigo-100 border-indigo-200 text-indigo-700 dark:bg-indigo-900/40 dark:border-indigo-800 dark:text-indigo-300'
                                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'}`}
                                    >
                                        {n}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* CHANGELOG (ACTIVITY LOG) */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">Actividad Reciente del Sistema</h4>

                        {changelog.length === 0 ? (
                            <p className="text-xs text-slate-400 italic py-2">No hay ajustes automáticos recientes.</p>
                        ) : (
                            <div className="space-y-2">
                                {changelog.map((entry) => (
                                    <div key={entry.id} className="text-xs flex items-center justify-between p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded transition-colors group">
                                        <div className="flex flex-col gap-0.5">
                                            <span className="font-medium text-slate-700 dark:text-slate-300">{entry.description}</span>
                                            <span className="text-[10px] text-slate-400">
                                                {new Date(entry.timestamp).toLocaleTimeString()} • {entry.scope}
                                            </span>
                                        </div>
                                        {entry.reversible && (
                                            <button
                                                onClick={() => handleRevert(entry)}
                                                className="text-[10px] items-center gap-1 text-slate-400 hover:text-indigo-600 px-2 py-1 rounded border border-transparent hover:border-indigo-100 transition-all opacity-0 group-hover:opacity-100 flex"
                                            >
                                                <Icon svg={ICONS.undo || ICONS.refreshCw} className="w-3 h-3" />
                                                Revertir
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Snoozed Summary */}
                    <div className="pt-2 text-xs text-slate-400 flex justify-between items-center">
                        <span>{snoozedCount} entidades silenciadas manualmente.</span>
                    </div>

                </div>

                <div className="p-5 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center shrink-0">
                    <Button variant="ghost" className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 text-xs" onClick={handleReset}>
                        <Icon svg={ICONS.trash} className="w-3 h-3 mr-2" />
                        Reset de Fábrica
                    </Button>
                    <div className="flex gap-2">
                        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
                        <Button onClick={handleSave} className="bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-500/20">
                            {saving ? 'Guardando...' : 'Aplicar Cambios'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
