import React, { useState } from 'react';
import { Icon } from './Icon';
import { ICONS } from './icons';

export interface FABAction {
  label: string;
  icon: any; // SVG string
  onClick: () => void;
}

interface FABProps {
  actions?: FABAction[];
  onMainClick?: () => void; // If no actions, main click works
  mainIcon?: any;
  hidden?: boolean;
  className?: string;
}

export const FAB: React.FC<FABProps> = ({ actions = [], onMainClick, mainIcon = ICONS.plus, hidden = false, className }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOpen = () => {
    if (actions.length > 0) {
      setIsOpen(!isOpen);
    } else if (onMainClick) {
      onMainClick();
    }
  };

  if (hidden) return null;

  return (
    <div className={`fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 transition-all duration-300 ${className || ''}`}>
      {/* Radial Menu Items */}
      <div className={`flex flex-col gap-3 transition-all duration-300 origin-bottom-right ${isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-90 translate-y-4 pointer-events-none'}`}>
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={() => {
              action.onClick();
              setIsOpen(false);
            }}
            className="group flex items-center gap-3 justify-end w-full"
          >
            <span className="bg-slate-800/90 text-white px-3 py-1.5 rounded-lg text-xs font-medium shadow-xl backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0">
              {action.label}
            </span>
            <div className="w-10 h-10 rounded-full bg-white/90 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 shadow-lg backdrop-blur-md flex items-center justify-center transition-transform hover:scale-110 border border-slate-200/50 dark:border-slate-700/50">
              <Icon svg={action.icon} className="w-4 h-4" />
            </div>
          </button>
        ))}
      </div>

      {/* Main Button */}
      <button
        onClick={toggleOpen}
        className={`
            w-[42px] h-[42px] rounded-full 
            bg-indigo-500/90 hover:bg-indigo-600/90 text-white 
            shadow-xl shadow-indigo-500/20 backdrop-blur-md
            flex items-center justify-center 
            transition-all duration-300 
            hover:scale-105 active:scale-95
            ${isOpen ? 'rotate-45 bg-slate-700/90 hover:bg-slate-800/90' : 'rotate-0'}
        `}
      >
        <Icon svg={mainIcon} className="w-5 h-5" />
      </button>
    </div>
  );
};
