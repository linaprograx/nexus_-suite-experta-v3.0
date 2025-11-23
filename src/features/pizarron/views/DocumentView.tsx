import React from 'react';
import { PizarronTask } from '../../../../types';
import { Button } from '../../../components/ui/Button';
import { Icon } from '../../../components/ui/Icon';
import { ICONS } from '../../../components/ui/icons';

interface DocumentViewProps {
  tasks: PizarronTask[];
  columns: string[];
  onTaskClick: (task: PizarronTask) => void;
}

export const DocumentView: React.FC<DocumentViewProps> = ({ tasks, columns, onTaskClick }) => {
  return (
    <div className="w-full h-full overflow-y-auto px-8 py-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Toolbar */}
        <div className="flex justify-end gap-2 mb-4 sticky top-0 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-md py-2 z-20">
            <Button variant="outline" size="sm">
                <Icon svg={ICONS.upload} className="mr-2 h-4 w-4" /> Exportar PDF
            </Button>
            <Button variant="secondary" size="sm" className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-300">
                <Icon svg={ICONS.brain} className="mr-2 h-4 w-4" /> Analizar con Cerebrity
            </Button>
        </div>

        <div className="bg-white dark:bg-slate-900 shadow-xl rounded-2xl p-8 border border-slate-200 dark:border-slate-800 min-h-[80vh]">
            <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-2">Documento de Proyecto</h1>
            <p className="text-slate-500 dark:text-slate-400 mb-8 border-b border-slate-100 dark:border-slate-800 pb-4">
                Generado automáticamente el {new Date().toLocaleDateString()}
            </p>

            {columns.map(col => {
                const colTasks = tasks.filter(t => t.status === col);
                if (colTasks.length === 0) return null;

                return (
                    <div key={col} className="mb-10">
                        <h2 className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mb-4 flex items-center gap-2">
                            <span className="w-2 h-8 rounded-full bg-indigo-500"></span>
                            {col}
                        </h2>
                        <div className="space-y-6 pl-4 border-l-2 border-slate-100 dark:border-slate-800">
                            {colTasks.map(task => (
                                <div 
                                    key={task.id} 
                                    className="group cursor-pointer p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-all"
                                    onClick={() => onTaskClick(task)}
                                >
                                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 transition-colors">
                                        {task.texto}
                                    </h3>
                                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-2 mb-2">
                                        <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700">{task.category}</span>
                                        {task.priority && <span className="capitalize">• Prioridad: {task.priority}</span>}
                                        {task.authorName && <span>• Por: {task.authorName}</span>}
                                        {task.dueDate && <span>• Fecha: {task.dueDate.toDate().toLocaleDateString()}</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
      </div>
    </div>
  );
};
