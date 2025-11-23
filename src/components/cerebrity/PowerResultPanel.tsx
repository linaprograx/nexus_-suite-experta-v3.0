import React from 'react';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { ICONS } from '../ui/icons';

type PowerResultPanelProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: React.ReactNode;
};

const PowerResultPanel: React.FC<PowerResultPanelProps> = ({ isOpen, onClose, title, content }) => {
  return (
    <div
      className={`
        fixed top-0 right-0 h-full w-[400px] bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg shadow-2xl
        transition-transform duration-300 ease-in-out z-50
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      `}
    >
      <div className="flex flex-col h-full">
        <div className="p-4 flex justify-between items-center border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold">{title}</h2>
          <Button onClick={onClose} variant="ghost" size="icon">
            <Icon svg={ICONS.x} className="w-6 h-6" />
          </Button>
        </div>
        <div className="p-6 flex-1 overflow-y-auto">
          {content}
        </div>
        <div className="p-4 border-t border-slate-200 dark:border-slate-700">
          <Button onClick={onClose} variant="secondary" className="w-full">
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PowerResultPanel;
