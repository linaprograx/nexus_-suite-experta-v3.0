import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from './Icon';
import { ICONS } from './icons';
import { Button } from './Button';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export const Drawer: React.FC<DrawerProps> = ({ isOpen, onClose, title, children, className }) => {
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      {/* Drawer Content */}
      <div 
        ref={drawerRef}
        className={`
          relative w-full max-w-md h-full 
          bg-white/80 dark:bg-slate-900/80 
          backdrop-blur-xl border-l border-white/20 dark:border-slate-700/30
          shadow-2xl transform transition-transform duration-300 ease-in-out
          flex flex-col
          animate-in slide-in-from-right
          ${className || ''}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200/50 dark:border-slate-700/50">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">{title}</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-slate-200/50 dark:hover:bg-slate-800/50">
            <Icon svg={ICONS.x} className="w-5 h-5 text-slate-500" />
          </Button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};
