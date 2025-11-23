import React from 'react';
import { Drawer } from '../ui/Drawer';
import { Icon } from '../ui/Icon';
import { ICONS } from '../ui/icons';
import { PizarronTask } from '../../../types';
import { AnalyticsPanel } from './AnalyticsPanel';

interface StatsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: PizarronTask[];
}

export const StatsDrawer: React.FC<StatsDrawerProps> = ({ isOpen, onClose, tasks }) => {
  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Estadísticas" side="right">
      <div className="h-full overflow-y-auto">
        <AnalyticsPanel tasks={tasks} />
        
        <div className="mt-4 mx-4 p-4 rounded-xl border border-white/20 dark:border-slate-700/30 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 backdrop-blur-md mb-8">
            <h3 className="text-lg font-semibold mb-2">Insights IA</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">
                Tu ritmo de creación ha aumentado un 15% esta semana. ¡Sigue así!
                Recomendamos enfocar esfuerzos en las tareas de "Desarrollo" pendientes.
            </p>
        </div>
      </div>
    </Drawer>
  );
};
