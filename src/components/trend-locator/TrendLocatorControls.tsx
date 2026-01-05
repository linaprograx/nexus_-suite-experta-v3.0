import React from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Label } from '../ui/Label';
import { Icon } from '../ui/Icon';
import { ICONS } from '../ui/icons';
import { Spinner } from '../ui/Spinner';

export const TREND_SOURCES = ["Coctelería General", "Inspirado en 50 Best Bars", "Revistas (Diffords/Punch)", "Competiciones (World Class)"];
export const TREND_TOPICS = ["Garnish Game", "Tecnicas de Alta Cocina", "Infusiones y Maceraciones", "Elaboraciones Complejas", "Ingredientes", "Sostenibilidad", "Conceptos"];

interface TrendLocatorControlsProps {
    sourceFilter: string;
    setSourceFilter: (val: string) => void;
    topicFilter: string;
    setTopicFilter: (val: string) => void;
    keyword: string;
    setKeyword: (val: string) => void;
    loading: boolean;
    onSearch: () => void;
}

export const TrendLocatorControls: React.FC<TrendLocatorControlsProps> = ({
    sourceFilter, setSourceFilter,
    topicFilter, setTopicFilter,
    keyword, setKeyword,
    loading, onSearch
}) => {
    return (
        <div className="h-full flex flex-col backdrop-blur-xl bg-white/40 dark:bg-slate-900/40 border border-white/20 shadow-lg rounded-2xl p-4 overflow-y-auto">
            <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                <Icon svg={ICONS.filter} className="w-4 h-4" />
                Filtros de Búsqueda
            </h3>

            <div className="space-y-4 flex-1">
                <div className="space-y-1">
                    <Label htmlFor="source-filter" className="text-xs">Fuente de Inspiración</Label>
                    <Select id="source-filter" value={sourceFilter} onChange={e => setSourceFilter(e.target.value)} className="bg-white/60 dark:bg-slate-800/60">
                        {TREND_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                    </Select>
                </div>

                <div className="space-y-1">
                    <Label htmlFor="topic-filter" className="text-xs">Tema / Foco</Label>
                    <Select id="topic-filter" value={topicFilter} onChange={e => setTopicFilter(e.target.value)} className="bg-white/60 dark:bg-slate-800/60">
                        {TREND_TOPICS.map(s => <option key={s} value={s}>{s}</option>)}
                    </Select>
                </div>

                <div className="space-y-1">
                    <Label htmlFor="keyword" className="text-xs">Palabra Clave (Opcional)</Label>
                    <Input id="keyword" value={keyword} onChange={e => setKeyword(e.target.value)} placeholder="Ej: Fermentación, Tiki..." className="bg-white/60 dark:bg-slate-800/60" />
                </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200/50 dark:border-slate-700/50">
                <Button onClick={onSearch} disabled={loading} className="w-full bg-gradient-to-r from-fuchsia-500 to-pink-500 hover:from-fuchsia-600 hover:to-pink-600 text-white shadow-lg transition-all hover:scale-[1.02]">
                    {loading ? <Spinner className="w-4 h-4 mr-2" /> : <Icon svg={ICONS.search} className="w-4 h-4 mr-2" />}
                    Buscar Tendencias
                </Button>
            </div>
        </div>
    );
};
