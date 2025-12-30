
import React, { useState } from 'react';
import { ActiveSuggestion } from '../../core/active/active.types';
import { Icon } from '../ui/Icon';
import { ICONS } from '../ui/icons';
import { Button } from '../ui/Button';
import { createExecutableAction } from '../../core/actions/action.engine';
import { executeAction } from '../../core/actions/action.executor';
import { logActionExecution } from '../../core/actions/action.audit';
import { ExecutableAction } from '../../core/actions/action.types';
import { useApp } from '../../context/AppContext';
import { LearningEngine } from '../../core/learning/learning.engine';

interface ActiveSuggestionCardProps {
    suggestion: ActiveSuggestion;
    onDismiss?: (id: string) => void;
    onAction?: (id: string) => void;
}

export const ActiveSuggestionCard: React.FC<ActiveSuggestionCardProps> = ({ suggestion, onDismiss, onAction }) => {
    const { db, userId } = useApp();
    const [isExpanded, setIsExpanded] = useState(false);
    const [mode, setMode] = useState<'idle' | 'preview' | 'executing' | 'success'>('idle');
    const [action, setAction] = useState<ExecutableAction | null>(null);
    const [showMenu, setShowMenu] = useState(false);

    const handleSnooze = async (days: number) => {
        if (!db || !userId) return;

        // Assume active ingredients/suppliers are identified in suggestion.data or suggestion.id
        // For prototype, we use suggestion.id or data payload if available.
        const entityId = suggestion.data?.ingredientId || suggestion.data?.supplierId || suggestion.id;

        console.log(`Snoozing entity ${entityId} for ${days} days`);

        // Track event
        await LearningEngine.trackEvent(db, userId, {
            type: 'suggestion_dismissed', // Treat as dismissal but stricter
            scope: suggestion.scope,
            entity: { ingredientId: entityId },
            signalIds: [],
            suggestionId: suggestion.id,
            meta: { snoozedDays: days }
        });

        // Direct update profile (Manual Override)
        const profile = await LearningEngine.getProfile(db, userId);
        profile.snoozes.byEntity[entityId] = {
            until: Date.now() + (days * 24 * 60 * 60 * 1000),
            reason: 'Manual Snooze'
        };
        await LearningEngine.updateProfile(db, userId, profile);

        onDismiss?.(suggestion.id); // Remove from view
    };

    if (!suggestion) return null;

    const handleStartAction = (e: React.MouseEvent) => {
        e.stopPropagation();
        const newAction = createExecutableAction(suggestion);
        if (newAction) {
            // Check if we have necessary IDs in data. If likely missing (prototype), we might need to inject from props.
            // But assume rule engine provides it.
            setAction(newAction);
            setMode('preview');
            // Ensure card is expanded in preview
            setIsExpanded(true);
        } else {
            console.warn('Action creation blocked by guardrails');
        }
    };

    const handleConfirm = async () => {
        if (!action || !db || !userId) {
            console.error("Context missing for execution");
            return;
        }
        setMode('executing');

        // Execute with Real DB Context
        const success = await executeAction(action, { db, userId });
        if (success) {
            logActionExecution(action, userId);
            setMode('success');
            onAction?.(suggestion.id); // Parent callback
        } else {
            setMode('preview'); // Revert on failure
        }
    };

    const handleUndo = () => {
        // Mock undo for Phase 3.1
        setMode('idle');
        setAction(null);
        console.log('[Undo] Reverted action locally');
    };

    return (
        <div className={`bg-indigo-50/50 dark:bg-indigo-900/10 border ${mode === 'success' ? 'border-emerald-200 bg-emerald-50/30' : 'border-indigo-100 dark:border-indigo-900/30'} rounded-xl p-4 mb-6 transition-all relative overflow-hidden`}>

            {/* Success Overlay Background */}
            {mode === 'success' && <div className="absolute inset-0 bg-emerald-50/50 pointer-events-none animate-in fade-in duration-500" />}

            {/* Header - Always visible */}
            <div className="flex items-center gap-3 cursor-pointer relative z-10" onClick={() => mode === 'idle' && setIsExpanded(!isExpanded)}>
                <div className={`p-2 rounded-full transition-colors ${mode === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300'}`}>
                    <Icon svg={mode === 'success' ? ICONS.check : ICONS.lightbulb} className="w-5 h-5" />
                </div>
                <div className="flex-1">
                    <h4 className={`text-sm font-bold ${mode === 'success' ? 'text-emerald-900' : 'text-indigo-900 dark:text-indigo-100'}`}>
                        {mode === 'success' ? 'Acción Completada' : suggestion.title}
                    </h4>
                    <p className={`text-xs opacity-80 ${mode === 'success' ? 'text-emerald-700' : 'text-indigo-700 dark:text-indigo-300'}`}>
                        {mode === 'preview' ? 'Revisa los cambios antes de confirmar.' :
                            mode === 'success' ? 'Los cambios se han aplicado correctamente.' :
                                suggestion.proposal}
                    </p>
                </div>
                {mode === 'idle' && (
                    <div className="flex items-center gap-1 relative">
                        {/* Snooze/Menu Trigger */}
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-indigo-300 hover:text-indigo-500" onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}>
                            <Icon svg={ICONS.menu} className="w-4 h-4" />
                        </Button>

                        {/* Menu Popover */}
                        {showMenu && (
                            <div className="absolute right-0 top-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-1 z-50 min-w-[160px] animate-in fade-in zoom-in-95">
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 mb-1 border-b border-slate-100 dark:border-slate-800">
                                    Opciones
                                </div>
                                <button className="w-full text-left px-2 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded flex items-center gap-2" onClick={(e) => { e.stopPropagation(); handleSnooze(7); }}>
                                    <Icon svg={ICONS.clock || ICONS.menu} className="w-3 h-3 opacity-50" />
                                    Posponer 7 días
                                </button>
                                <button className="w-full text-left px-2 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded flex items-center gap-2" onClick={(e) => { e.stopPropagation(); handleSnooze(30); }}>
                                    <Icon svg={ICONS.eyeOff || ICONS.x} className="w-3 h-3 opacity-50" />
                                    Ocultar 30 días
                                </button>
                                <button className="w-full text-left px-2 py-2 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded flex items-center gap-2 mt-1 border-t border-slate-100 dark:border-slate-800" onClick={(e) => { e.stopPropagation(); onDismiss?.(suggestion.id); }}>
                                    <Icon svg={ICONS.trash || ICONS.x} className="w-3 h-3 opacity-50" />
                                    Descartar ahora
                                </button>
                            </div>
                        )}

                        <Button variant="ghost" size="sm" className="shrink-0">
                            <Icon svg={isExpanded ? ICONS.chevronDown : ICONS.chevronRight} className="w-4 h-4 text-indigo-400" />
                        </Button>
                    </div>
                )}
            </div>

            {/* Expanded Content */}
            {(isExpanded || mode === 'preview' || mode === 'success') && (
                <div className="mt-4 pt-3 border-t border-indigo-100 dark:border-indigo-900/30 animate-in fade-in slide-in-from-top-2 relative z-10">

                    {/* PREVIEW MODE */}
                    {mode === 'preview' && action && (
                        <div className="space-y-4">
                            <div className="bg-white/80 dark:bg-black/30 p-3 rounded-lg border border-indigo-200 dark:border-indigo-800">
                                <h5 className="text-xs font-bold text-indigo-800 uppercase mb-2">Vista Previa del Impacto</h5>
                                <div className="flex justify-between items-center text-sm mb-1">
                                    <span className="text-slate-500">Estado Actual:</span>
                                    <span className="line-through opacity-60">{action.preview.before}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm font-bold text-indigo-700">
                                    <span>Nuevo Estado:</span>
                                    <span>{action.preview.after}</span>
                                </div>
                                {action.preview.delta && (
                                    <div className="mt-2 text-xs font-mono bg-indigo-50 dark:bg-indigo-900/40 p-1.5 rounded text-center text-indigo-600">
                                        {action.preview.delta}
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-2 justify-end pt-2">
                                <Button variant="ghost" size="sm" onClick={() => setMode('idle')}>Cancelar</Button>
                                <Button variant="default" size="sm" className="bg-indigo-600 text-white hover:bg-indigo-700" onClick={handleConfirm}>
                                    Confirmar Cambio
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* SUCCESS MODE */}
                    {mode === 'success' && (
                        <div className="flex justify-end gap-2 pt-2">
                            <Button variant="ghost" size="sm" onClick={handleUndo} className="text-slate-500 hover:text-slate-700">
                                <Icon svg={ICONS.undo || ICONS.refreshCw} className="w-3 h-3 mr-1" />
                                Deshacer
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => onDismiss?.(suggestion.id)} className="text-emerald-700 font-medium">
                                Entendido
                            </Button>
                        </div>
                    )}

                    {/* IDLE MODE (Standard) */}
                    {mode === 'idle' && (
                        <>
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div className="bg-white/60 dark:bg-black/20 p-2 rounded-lg">
                                    <span className="text-[10px] uppercase font-bold opacity-50 block mb-1">Antes</span>
                                    <span className="text-sm text-slate-600 dark:text-slate-400">{suggestion.preview.before}</span>
                                </div>
                                <div className="bg-emerald-50/50 dark:bg-emerald-900/10 p-2 rounded-lg border border-emerald-100 dark:border-emerald-900/30">
                                    <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400 block mb-1">Después</span>
                                    <span className="text-sm font-medium text-emerald-800 dark:text-emerald-300">{suggestion.preview.after}</span>
                                </div>
                            </div>

                            <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 italic">
                                "{suggestion.why}"
                            </p>

                            <div className="flex items-center gap-3 justify-end">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => { e.stopPropagation(); onDismiss?.(suggestion.id); }}
                                    className="text-slate-500 hover:text-slate-700"
                                >
                                    {suggestion.actions.secondary || 'Ignorar'}
                                </Button>
                                <Button
                                    variant="default"
                                    size="sm"
                                    className="bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-200 dark:shadow-none transition-all hover:scale-105"
                                    onClick={handleStartAction}
                                >
                                    <Icon svg={ICONS.play} className="w-3 h-3 mr-2 opacity-70" />
                                    {suggestion.actions.primary}
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};
