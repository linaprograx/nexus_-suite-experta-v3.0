import React from 'react';
import { Drawer } from '../ui/Drawer';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Icon } from '../ui/Icon';
import { ICONS } from '../ui/icons';

interface StatsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StatsDrawer: React.FC<StatsDrawerProps> = ({ isOpen, onClose }) => {
  // Dummy data as per requirements
  const stats = [
    { label: 'Total Tareas', value: '42', icon: ICONS.menu, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Tareas Hoy', value: '5', icon: ICONS.calendar, color: 'text-green-500', bg: 'bg-green-500/10' },
    { label: 'Completadas (Semana)', value: '12', icon: ICONS.check, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { label: 'Velocidad Creativa', value: '8.5/10', icon: ICONS.trendingUp, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  ];

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Estadísticas" side="right">
      <div className="space-y-4">
        {stats.map((stat, index) => (
          <div key={index} className="p-4 rounded-xl border border-white/20 dark:border-slate-700/30 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md shadow-sm">
            <div className="flex items-center space-x-4">
              <div className={`p-2 rounded-lg ${stat.bg}`}>
                <Icon svg={stat.icon} className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.label}</p>
                <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{stat.value}</h3>
              </div>
            </div>
          </div>
        ))}

        <div className="mt-8 p-4 rounded-xl border border-white/20 dark:border-slate-700/30 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 backdrop-blur-md">
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
