import React from 'react';
import { Drawer } from '../ui/Drawer';
import { Button } from '../ui/Button';
import { Label } from '../ui/Label';
import { Checkbox } from '../ui/Checkbox';
import { TaskCategory } from '../../types';

interface FiltersDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: any;
  setFilters: (filters: any) => void;
}

export const FiltersDrawer: React.FC<FiltersDrawerProps> = ({ isOpen, onClose, filters, setFilters }) => {
  const categories: TaskCategory[] = ['Ideas', 'Desarrollo', 'Marketing', 'Admin', 'Urgente'];
  const priorities = ['baja', 'media', 'alta'];

  const toggleCategory = (cat: string) => {
    const current = filters.categories || [];
    const updated = current.includes(cat)
      ? current.filter((c: string) => c !== cat)
      : [...current, cat];
    setFilters({ ...filters, categories: updated });
  };

  const togglePriority = (prio: string) => {
    const current = filters.priorities || [];
    const updated = current.includes(prio)
      ? current.filter((p: string) => p !== prio)
      : [...current, prio];
    setFilters({ ...filters, priorities: updated });
  };

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Filtros" side="left">
      <div className="space-y-6">
        <div>
          <Label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">Categorías</Label>
          <div className="space-y-2">
            {categories.map(cat => (
              <div key={cat} className="flex items-center space-x-2">
                <Checkbox 
                  id={`cat-${cat}`} 
                  checked={(filters.categories || []).includes(cat)} 
                  onChange={() => toggleCategory(cat)} 
                />
                <label htmlFor={`cat-${cat}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  {cat}
                </label>
              </div>
            ))}
          </div>
        </div>

        <div>
          <Label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">Prioridad</Label>
          <div className="space-y-2">
            {priorities.map(prio => (
              <div key={prio} className="flex items-center space-x-2">
                <Checkbox 
                  id={`prio-${prio}`} 
                  checked={(filters.priorities || []).includes(prio)} 
                  onChange={() => togglePriority(prio)} 
                />
                <label htmlFor={`prio-${prio}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 capitalize">
                  {prio}
                </label>
              </div>
            ))}
          </div>
        </div>
        
        <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
             <Button variant="outline" className="w-full" onClick={() => setFilters({})}>Limpiar Filtros</Button>
        </div>
      </div>
    </Drawer>
  );
};
