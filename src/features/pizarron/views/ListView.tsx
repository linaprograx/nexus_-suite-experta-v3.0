import React from 'react';
import { PizarronTask } from '../../../../types';
import { Icon } from '../../../components/ui/Icon';
import { ICONS } from '../../../components/ui/icons';
import { getCategoryColor } from '../../../components/pizarron/helpers';

interface ListViewProps {
  tasks: PizarronTask[];
  onTaskClick: (task: PizarronTask) => void;
}

export const ListView: React.FC<ListViewProps> = ({ tasks, onTaskClick }) => {
  return (
    <div className="w-full h-full overflow-y-auto px-4 pb-4">
      <div className="bg-white/50 dark:bg-white/10 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-lg rounded-2xl overflow-hidden">
        <table className="w-full text-sm text-left">
           <thead className="bg-white/20 dark:bg-white/5 text-slate-600 dark:text-slate-300">
             <tr>
               <th className="p-4 font-semibold">Nombre</th>
               <th className="p-4 font-semibold">Categoría</th>
               <th className="p-4 font-semibold">Prioridad</th>
               <th className="p-4 font-semibold">Estado</th>
               <th className="p-4 font-semibold">Fecha</th>
               <th className="p-4 font-semibold">Responsable</th>
               <th className="p-4 font-semibold">Adjuntos</th>
             </tr>
           </thead>
           <tbody className="divide-y divide-white/10 dark:divide-white/10">
             {tasks.map(task => (
                <tr key={task.id} 
                    onClick={() => onTaskClick(task)}
                    className="hover:bg-white/20 dark:hover:bg-white/5 transition-colors cursor-pointer group"
                >
                    <td className="p-4 font-medium text-slate-800 dark:text-slate-100">{task.texto}</td>
                    <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getCategoryColor(task.category)}`}>
                            {task.category}
                        </span>
                    </td>
                    <td className="p-4">
                         <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                             task.priority === 'alta' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                             task.priority === 'baja' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                             'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                         }`}>
                            {task.priority || 'media'}
                         </span>
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-400 capitalize">{task.status}</td>
                    <td className="p-4 text-slate-600 dark:text-slate-400">
                        {task.dueDate ? task.dueDate.toDate().toLocaleDateString() : '-'}
                    </td>
                    <td className="p-4">
                        {task.authorPhotoURL ? (
                             <img src={task.authorPhotoURL} alt="Author" className="w-6 h-6 rounded-full" />
                        ) : (
                             <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs">
                                 {task.authorName ? task.authorName[0] : 'U'}
                             </div>
                        )}
                    </td>
                    <td className="p-4">
                        {task.attachments && task.attachments.length > 0 && (
                             <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                                 <Icon svg={ICONS.paperclip} className="w-4 h-4" />
                                 <span>{task.attachments.length}</span>
                             </div>
                        )}
                    </td>
                </tr>
             ))}
           </tbody>
        </table>
      </div>
    </div>
  );
};
