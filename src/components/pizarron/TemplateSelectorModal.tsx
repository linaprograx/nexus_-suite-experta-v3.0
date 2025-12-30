import React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { ICONS } from '../ui/icons';
import { PIZARRON_TEMPLATES, BoardTemplate } from '../../features/pizarron-templates/templates';

interface TemplateSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (templateId: string) => void;
}

export const TemplateSelectorModal: React.FC<TemplateSelectorModalProps> = ({ isOpen, onClose, onSelectTemplate }) => {
  const [selectedTemplate, setSelectedTemplate] = React.useState<string | null>(null);

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'beaker': return ICONS.beaker;
      case 'bookOpen': return ICONS.book;
      case 'recycle': return ICONS.recycle;
      case 'cube': return ICONS.box;
      case 'lightbulb': return ICONS.brain; // Using brain as substitute for lightbulb
      case 'plus': return ICONS.plus;
      default: return ICONS.layout;
    }
  };

  const handleSelect = () => {
    if (selectedTemplate) {
      onSelectTemplate(selectedTemplate);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="3xl" title={
      <span className="font-extrabold text-2xl bg-gradient-to-r from-orange-500 to-amber-600 bg-clip-text text-transparent">
        Crear Nuevo Tablero
      </span>
    }>
      <div className="flex flex-col h-[70vh]">
        <div className="mb-4">
          <p className="text-slate-600 dark:text-slate-400 mb-4 bg-orange-50/50 dark:bg-orange-900/10 p-3 rounded-lg border border-nexus-orange/20 text-sm flex gap-2 items-center backdrop-blur-sm">
            <Icon svg={ICONS.sparkles} className="text-nexus-orange w-4 h-4" />
            Elige una plantilla para comenzar rápidamente o crea un tablero en blanco.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4 p-2 custom-scrollbar">
          {PIZARRON_TEMPLATES.map((template) => (
            <div
              key={template.id}
              onClick={() => setSelectedTemplate(template.id)}
              className={`
                relative p-5 rounded-2xl cursor-pointer border transition-all duration-300 group
                ${selectedTemplate === template.id
                  ? 'border-nexus-orange bg-orange-50/50 dark:bg-orange-900/20 shadow-lg shadow-nexus-orange/10 ring-1 ring-nexus-orange'
                  : 'border-slate-200/50 dark:border-slate-700/50 hover:border-nexus-orange/50 hover:shadow-md bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm'
                }
              `}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`p-3.5 rounded-2xl shrink-0 shadow-sm transition-transform group-hover:scale-110 duration-300 ${selectedTemplate === template.id ? 'bg-white dark:bg-slate-800' : 'bg-white/50 dark:bg-slate-800/50'}`}
                  style={{ backgroundColor: selectedTemplate === template.id ? undefined : `${template.color}20`, color: template.color }}
                >
                  <Icon svg={getIcon(template.icon)} className="w-8 h-8" />
                </div>
                <div className="flex-1 min-w-0 pt-1">
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-1 group-hover:text-nexus-orange transition-colors break-words">
                    {template.name}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed break-words">
                    {template.description}
                  </p>

                  {template.linkedViews.length > 0 && (
                    <div className="flex gap-2 mt-3">
                      {template.linkedViews.map(view => (
                        <span key={view} className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-100/50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-300 border border-slate-200/50 dark:border-slate-600/50">
                          {view}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-1 mt-4 overflow-hidden opacity-60 group-hover:opacity-100 transition-opacity">
                    {template.columns.slice(0, 3).map((col, i) => (
                      <div key={i} className="h-1.5 flex-1 rounded-full bg-slate-200/50 dark:bg-slate-600/50 group-hover:bg-current" style={{ color: template.color }} />
                    ))}
                    {template.columns.length > 3 && (
                      <div className="h-1.5 w-1.5 rounded-full bg-slate-200/50 dark:bg-slate-600/50" />
                    )}
                  </div>
                </div>
              </div>

              {selectedTemplate === template.id && (
                <div className="absolute top-4 right-4 text-nexus-orange animate-in zoom-in duration-200 drop-shadow-sm">
                  <Icon svg={ICONS.check} className="w-6 h-6" />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="pt-6 mt-4 border-t border-slate-200/50 dark:border-slate-700/50 flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose} className="rounded-xl">
            Cancelar
          </Button>
          <Button
            disabled={!selectedTemplate}
            onClick={handleSelect}
            className="bg-gradient-to-r from-nexus-orange to-amber-600 text-white hover:opacity-90 transition-all shadow-lg shadow-nexus-orange/30 rounded-xl px-8 hover:scale-[1.02]"
          >
            Crear Tablero
          </Button>
        </div>
      </div>
    </Modal>
  );
};
