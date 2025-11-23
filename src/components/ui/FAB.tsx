import React, { useState } from 'react';
import { Icon } from './Icon';
import { ICONS } from './icons';

interface FABAction {
  label: string;
  icon: any; // SVG string
  onClick: () => void;
}

interface FABProps {
  actions: FABAction[];
}

export const FAB: React.FC<FABProps> = ({ actions }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOpen = () => setIsOpen(!isOpen);

  return (
    <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-4">
      {/* Radial Menu Items */}
      <div className={`flex flex-col gap-3 transition-all duration-300 ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
        {actions.map((action, index) => (
          <div key={index} className="flex items-center gap-3 group">
            <span className="bg-gray-900/80 text-white px-2 py-1 rounded text-xs font-medium shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
              {action.label}
            </span>
            <button
              onClick={() => {
                action.onClick();
                setIsOpen(false);
              }}
              className="w-12 h-12 rounded-full bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-center transition-all hover:scale-110 ring-1 ring-gray-200 dark:ring-gray-700"
              title={action.label}
            >
              <Icon svg={action.icon} className="w-5 h-5" />
            </button>
          </div>
        ))}
      </div>

      {/* Main Button */}
      <button
        onClick={toggleOpen}
        className={`w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-105 hover:shadow-blue-600/30 ${isOpen ? 'rotate-45' : 'rotate-0'}`}
      >
        <Icon svg={ICONS.plus} className="w-8 h-8" />
      </button>
    </div>
  );
};
