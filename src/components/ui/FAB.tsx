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
  panelOpen?: boolean;
}

export const FAB: React.FC<FABProps> = ({ actions = [], onMainClick, mainIcon = ICONS.plus, hidden = false, className, panelOpen = false }) => {
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
    <div 
        className={`fixed right-6 z-[90] flex flex-col items-end transition-all duration-300 ${className || ''}`}
        style={{ bottom: panelOpen ? '110px' : '24px' }}
    >
      {/* Menu Items */}
      {isOpen && actions.length > 0 && (
          <div className="mb-3 w-[160px] rounded-xl bg-white/80 dark:bg-white/10 backdrop-blur-md py-2 shadow-xl border dark:border-white/10 animate-fadeIn flex flex-col overflow-hidden">
            {actions.map((action, index) => (
              <button
                key={index}
                onClick={() => {
                  action.onClick();
                  setIsOpen(false);
                }}
                className="flex items-center gap-3 px-4 py-2 hover:bg-black/5 dark:hover:bg-white/10 transition-colors w-full text-left"
              >
                <div className="text-slate-600 dark:text-slate-300 flex-shrink-0">
                    <Icon svg={action.icon} className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                  {action.label}
                </span>
              </button>
            ))}
          </div>
      )}

      {/* Main Button */}
      <button
        onClick={toggleOpen}
        className={`
            w-[42px] h-[42px] rounded-full 
            bg-indigo-500 shadow-xl 
            flex items-center justify-center 
            transition-all hover:scale-110 active:scale-95
            ${isOpen ? 'rotate-45 bg-slate-700 hover:bg-slate-800 text-white' : 'text-white'}
        `}
      >
        <Icon svg={mainIcon} className="w-5 h-5" strokeWidth={1.5} />
      </button>
    </div>
  );
};
