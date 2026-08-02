import React from 'react';
import { Icon } from '../ui/Icon';
import { ICONS } from '../ui/icons';
import { useGlobalSuggestions } from '../../hooks/useGlobalSuggestions';
import { ActiveSuggestionCard } from './ActiveSuggestionCard';

/**
 * #19 · Surfaces Grimorio's active suggestions anywhere in Nexus (Dashboard, Pizarrón…),
 * fully executable in place — the user no longer has to open the exact ingredient card.
 * Reuses ActiveSuggestionCard so preview, guardrails, execution and audit are identical.
 */
export const GlobalSuggestionsWidget: React.FC<{ limit?: number; className?: string }> = ({ limit = 3, className = '' }) => {
    const { suggestions, enabled } = useGlobalSuggestions(limit);
    const [dismissed, setDismissed] = React.useState<string[]>([]);

    const visible = suggestions.filter(s => !dismissed.includes(s.id));
    if (!enabled || visible.length === 0) return null;

    return (
        <div className={className}>
            <div className="flex items-center gap-2 mb-3">
                <span className="p-1.5 rounded-lg bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
                    <Icon svg={ICONS.sparkles} className="w-4 h-4" />
                </span>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Sugerencias del asistente
                </h3>
                <span className="text-[10px] font-bold text-slate-400">{visible.length}</span>
            </div>

            {visible.map(s => (
                <ActiveSuggestionCard
                    key={s.id}
                    suggestion={s}
                    onDismiss={(id) => setDismissed(d => [...d, id])}
                    onAction={(id) => setDismissed(d => [...d, id])}
                />
            ))}
        </div>
    );
};
