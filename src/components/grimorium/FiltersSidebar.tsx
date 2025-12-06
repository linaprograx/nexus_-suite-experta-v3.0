import React from 'react';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { ICONS } from '../ui/icons';
import { useUI } from '../../context/UIContext';

interface FiltersState {
  category: string;
  status: string;
}

interface FiltersSidebarProps {
  searchTerm: string;
  onSearchChange: (val: string) => void;
  filters: FiltersState;
  onFilterChange: (key: keyof FiltersState, val: string) => void;
  stats: {
    total: number;
    ideas: number;
    inProgress: number;
    done: number;
  };
  onOpenIngredients: () => void;
  onImportRecipes: () => void;
  onImportIngredients: () => void;
  onImportPdf: () => void;
}

export const FiltersSidebar: React.FC<FiltersSidebarProps> = ({
  searchTerm,
  onSearchChange,
  filters,
  onFilterChange,
  stats,
  onOpenIngredients,
  onImportRecipes,
  onImportIngredients,
  onImportPdf,
}) => {
  const { compactMode } = useUI();

  return (
    <div className={`h-full flex flex-col ${compactMode ? 'gap-3' : 'gap-6'}`}>
      {/* Search */}
      <div>
        <h3 className={`font-semibold text-slate-900 dark:text-slate-100 mb-2 ${compactMode ? 'text-sm' : 'text-base'}`}>Búsqueda</h3>
        <div className="relative">
          <Icon svg={ICONS.search} className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar receta..."
            className="pl-9 bg-white/50 dark:bg-slate-800/50"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-4 flex-1">
        <div>
          <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Estado</label>
          <Select
            value={filters.status}
            onChange={(e) => onFilterChange('status', e.target.value)}
            className="bg-white/50 dark:bg-slate-800/50"
          >
            <option value="all">Todos</option>
            <option value="Idea">Idea</option>
            <option value="En pruebas">En pruebas</option>
            <option value="Terminado">Lista para carta</option>
            <option value="Archivada">Archivada</option>
          </Select>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Categoría</label>
          <Select
            value={filters.category}
            onChange={(e) => onFilterChange('category', e.target.value)}
            className="bg-white/50 dark:bg-slate-800/50"
          >
            <option value="all">Todas</option>
            <option value="Coctel">Cóctel</option>
            <option value="Mocktail">Mocktail</option>
            <option value="Preparacion">Preparación</option>
            <option value="Otro">Otro</option>
          </Select>
        </div>
      </div>

      {/* Stats */}
      <div className={`bg-slate-50/80 dark:bg-slate-800/50 rounded-lg ${compactMode ? 'p-3' : 'p-4'}`}>
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Resumen</h4>
        <div className="grid grid-cols-2 gap-y-2 text-sm">
          <span className="text-slate-600 dark:text-slate-300">Total</span>
          <span className="text-right font-medium">{stats.total}</span>

          <span className="text-slate-600 dark:text-slate-300">Ideas</span>
          <span className="text-right font-medium">{stats.ideas}</span>

          <span className="text-slate-600 dark:text-slate-300">En pruebas</span>
          <span className="text-right font-medium">{stats.inProgress}</span>

          <span className="text-slate-600 dark:text-slate-300">Listas</span>
          <span className="text-right font-medium">{stats.done}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-2">
        <Button variant="outline" className="w-full justify-start" onClick={onOpenIngredients}>
          <Icon svg={ICONS.flask} className="mr-2 h-4 w-4" />
          Ver Ingredientes
        </Button>
        <Button variant="outline" className="w-full justify-start" onClick={onImportPdf}>
          <Icon svg={ICONS.fileText} className="mr-2 h-4 w-4" />
          Importar PDF PRO
        </Button>
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
          <Button variant="ghost" size="sm" className="justify-start text-xs" onClick={onImportRecipes}>
            <Icon svg={ICONS.upload} className="mr-2 h-3 w-3" /> Imp. TXT
          </Button>
          <Button variant="ghost" size="sm" className="justify-start text-xs" onClick={onImportIngredients}>
            <Icon svg={ICONS.upload} className="mr-2 h-3 w-3" /> Imp. CSV
          </Button>
        </div>
      </div>
    </div>
  );
};
