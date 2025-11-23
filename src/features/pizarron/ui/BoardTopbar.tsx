import React from 'react';
import { Button } from '../../../components/ui/Button';
import { Icon } from '../../../components/ui/Icon';
import { Input } from '../../../components/ui/Input';
import { ICONS } from '../../../components/ui/icons';
import { FiltersBar } from '../../../components/pizarron/FiltersBar';
import { Firestore } from 'firebase/firestore';
import { Tag } from '../../../../types';
import { usePizarraStore } from '../../../store/pizarraStore';

interface BoardTopbarProps {
  isLeftPanelOpen: boolean;
  onToggleLeftPanel: () => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  filters: any;
  setFilters: (filters: any) => void;
  db: Firestore;
  userId: string;
  tags: Tag[];
  compactMode: boolean;
  onToggleCompactMode: () => void;
  onShowStats: () => void;
  onShowTopIdeas: () => void;
  onShowSmartView: () => void;
  currentView: 'kanban' | 'list' | 'timeline' | 'document';
  onViewChange: (view: 'kanban' | 'list' | 'timeline' | 'document') => void;
}

export const BoardTopbar: React.FC<BoardTopbarProps> = ({
  isLeftPanelOpen,
  onToggleLeftPanel,
  searchQuery,
  onSearchChange,
  filters,
  setFilters,
  db,
  userId,
  tags,
  compactMode,
  onToggleCompactMode,
  onShowStats,
  onShowTopIdeas,
  onShowSmartView,
  currentView,
  onViewChange
}) => {
  const { focusMode, toggleFocusMode, automationsEnabled, toggleAutomationsEnabled } = usePizarraStore();

  return (
    <div className="flex flex-col md:flex-row justify-between items-center mb-4 px-4 lg:px-6 py-2 gap-4 border-b border-white/10 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-4 w-full md:w-auto">
            {!isLeftPanelOpen && <Button size="icon" variant="ghost" onClick={onToggleLeftPanel}><Icon svg={ICONS.chevronRight} /></Button>}
            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">Pizarrón</h1>
        </div>

        {/* View Switcher */}
        <div className="hidden md:flex bg-slate-100/50 dark:bg-slate-800/50 p-1 rounded-lg backdrop-blur-sm border border-white/10">
            <Button 
                variant={currentView === 'kanban' ? 'secondary' : 'ghost'} 
                size="icon" 
                className={`h-8 w-8 ${currentView === 'kanban' ? 'bg-white dark:bg-slate-700 shadow-sm' : ''}`}
                onClick={() => onViewChange('kanban')} 
                title="Kanban"
            >
                <Icon svg={ICONS.layoutGrid} className="h-4 w-4" />
            </Button>
            <Button 
                variant={currentView === 'list' ? 'secondary' : 'ghost'} 
                size="icon" 
                className={`h-8 w-8 ${currentView === 'list' ? 'bg-white dark:bg-slate-700 shadow-sm' : ''}`}
                onClick={() => onViewChange('list')} 
                title="Lista"
            >
                <Icon svg={ICONS.list} className="h-4 w-4" />
            </Button>
            <Button 
                variant={currentView === 'timeline' ? 'secondary' : 'ghost'} 
                size="icon" 
                className={`h-8 w-8 ${currentView === 'timeline' ? 'bg-white dark:bg-slate-700 shadow-sm' : ''}`}
                onClick={() => onViewChange('timeline')} 
                title="Timeline"
            >
                <Icon svg={ICONS.chart} className="h-4 w-4" />
            </Button>
            <Button 
                variant={currentView === 'document' ? 'secondary' : 'ghost'} 
                size="icon" 
                className={`h-8 w-8 ${currentView === 'document' ? 'bg-white dark:bg-slate-700 shadow-sm' : ''}`}
                onClick={() => onViewChange('document')} 
                title="Documento"
            >
                <Icon svg={ICONS.book} className="h-4 w-4" />
            </Button>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto flex-1 justify-center max-w-xl">
           <div className="relative w-full">
              <Icon svg={ICONS.search} className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Buscar tareas..." 
                className="pl-9 bg-white/50 dark:bg-slate-800/50 border-white/20 dark:border-slate-700/30 backdrop-blur-sm focus:ring-2 focus:ring-purple-500/50" 
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
              />
           </div>
        </div>

        <div className="flex gap-2 w-full md:w-auto justify-end items-center">
            <FiltersBar filters={filters} setFilters={setFilters} db={db} userId={userId} tags={tags} />
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1" />
            
            <Button 
                variant={automationsEnabled ? "default" : "ghost"} 
                size="sm" 
                onClick={toggleAutomationsEnabled} 
                title={`Automatización: Aprobar -> Receta (${automationsEnabled ? 'ON' : 'OFF'})`}
                className={automationsEnabled ? "bg-green-600 text-white hover:bg-green-700" : "bg-white text-gray-600 hover:bg-gray-100 dark:bg-transparent dark:text-slate-400 dark:hover:bg-slate-800"}
            >
                <Icon svg={ICONS.settings} className="h-4 w-4" />
            </Button>

            {/* Moved Compact Mode to filters or separate settings if needed, but keeping here for now */}
            <Button variant={compactMode ? "secondary" : "ghost"} size="sm" onClick={onToggleCompactMode} title="Modo Compacto">
                <Icon svg={ICONS.slidersHorizontal} className="h-4 w-4" />
            </Button>
            <Button 
                variant={focusMode ? "default" : "ghost"} 
                size="sm" 
                onClick={toggleFocusMode} 
                title="Modo Focus"
                className={focusMode ? "bg-indigo-600 text-white hover:bg-indigo-700" : "bg-white text-gray-600 hover:bg-gray-100 dark:bg-transparent dark:text-slate-400 dark:hover:bg-slate-800"}
            >
                <Icon svg={ICONS.eye} className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onShowStats} title="Estadísticas">
                <Icon svg={ICONS.trendingUp} className="h-5 w-5" />
            </Button>
             <Button variant="ghost" size="icon" onClick={onShowTopIdeas} title="Top Ideas">
                <Icon svg={ICONS.sparkles} className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onShowSmartView} title="Vista Inteligente" className="text-indigo-600 dark:text-indigo-400">
                <Icon svg={ICONS.activity} className="h-5 w-5" />
            </Button>
        </div>
    </div>
  );
};
