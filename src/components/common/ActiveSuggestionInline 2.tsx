
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

interface ActiveSuggestionInlineProps {
    suggestion: ActiveSuggestion;
    onDismiss?: (id: string) => void;
    onAction?: (id: string) => void;
}

export const ActiveSuggestionInline: React.FC<ActiveSuggestionInlineProps> = ({ suggestion, onDismiss, onAction }) => {
    const { db, userId } = useApp();
    const [isExpanded, setIsExpanded] = useState(false);
    // Modes: idle -> preview -> executing -> success
    const [mode, setMode] = useState<'idle' | 'preview' | 'executing' | 'success'>('idle');
    const [action, setAction] = useState<ExecutableAction | null>(null);

    if (!suggestion) return null;

    const handleStartAction = (e: React.MouseEvent) => {
        e.stopPropagation();
        const newAction = createExecutableAction(suggestion);
        if (newAction) {
            setAction(newAction);
            setMode('preview');
            setIsExpanded(true);
        }
    };

    const handleConfirm = async () => {
        if (!action || !db || !userId) return;
        setMode('executing');
        const success = await executeAction(action, { db, userId });
        if (success) {
            logActionExecution(action, userId);
            setMode('success');
            onAction?.(suggestion.id);
        } else {
            setMode('preview');
        }
    };

    return (
        <div className={`border rounded-lg p-3 mt-4 transition-all ${mode === 'success' ? 'bg-emerald-50/30 border-emerald-200' : 'bg-indigo-50/30 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-900/30 hover:bg-indigo-50/50'}`}>
            {/* Header */}
            <div className="flex items-center justify-between cursor-pointer" onClick={() => mode !== 'executing' && setIsExpanded(!isExpanded)}>
                <div className="flex items-center gap-2">
                    <Icon svg={mode === 'success' ? ICONS.check : ICONS.sparkles} className={`w-4 h-4 ${mode === 'success' ? 'text-emerald-500' : 'text-indigo-500'}`} />
                    <span className={`text-xs font-semibold ${mode === 'success' ? 'text-emerald-700' : 'text-indigo-900 dark:text-indigo-200'}`}>
                        {mode === 'success' ? 'Aplicado Correctamente' : suggestion.title}
                    </span>
                </div>
                {mode === 'idle' && (
                    <Icon svg={isExpanded ? ICONS.chevronDown : ICONS.chevronRight} className="w-3 h-3 text-indigo-400" />
                )}
            </div>

            {/* Content */}
            {(isExpanded || mode === 'preview' || mode === 'success') && (
                <div className="mt-3 pt-2 border-t border-indigo-100 dark:border-indigo-900/20">

                    {/* PREVIEW */}
                    {mode === 'preview' && action && (
                        <div className="space-y-3">
                            <div className="text-xs bg-white/60 p-2 rounded border border-indigo-100">
                                <div className="flex justify-between mb-1">
                                    <span className="text-slate-500">Antes:</span>
                                    <span className="line-through">{action.preview.before}</span>
                                </div>
                                <div className="flex justify-between font-bold text-indigo-700">
                                    <span>Después:</span>
                                    <span>{action.preview.after}</span>
                                </div>
                            </div>
                            <div className="flex gap-2 justify-end">
                                <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={() => setMode('idle')}>Cancelar</Button>
                                <Button variant="default" size="sm" className="h-6 text-[10px] bg-indigo-600 text-white" onClick={handleConfirm}>Confirmar</Button>
                            </div>
                        </div>
                    )}

                    {/* SUCCESS */}
                    {mode === 'success' && (
                        <div className="flex justify-between items-center text-xs text-emerald-600">
                            <span>Cambio realizado.</span>
                            <Button variant="ghost" size="sm" className="h-6 px-0 text-[10px] text-slate-400 underline" onClick={() => console.log('Undo not implemented inline yet')}>Deshacer</Button>
                        </div>
                    )}

                    {/* IDLE */}
                    {mode === 'idle' && (
                        <>
                            <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
                                {suggestion.proposal}
                            </p>
                            <div className="flex items-center justify-between gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-[10px] h-6 px-2 text-slate-400 hover:text-slate-600"
                                    onClick={(e) => { e.stopPropagation(); onDismiss?.(suggestion.id); }}
                                >
                                    Ignorar
                                </Button>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    className="h-7 text-xs bg-indigo-100 text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-300"
                                    onClick={handleStartAction}
                                >
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
