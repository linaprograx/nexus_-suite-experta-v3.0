import React from 'react';
import { Icon } from '../ui/Icon';
import { ICONS } from '../ui/icons';
import { Button } from '../ui/Button';
import { useUI } from '../../context/UIContext';

interface TopbarProps {
  onToggleMobileSidebar: () => void;
  onShowNotifications?: () => void;
  unreadNotifications?: boolean;
  title?: string;
}

export const Topbar: React.FC<TopbarProps> = ({ 
  onToggleMobileSidebar, 
  onShowNotifications,
  unreadNotifications = false,
  title = "Nexus Suite"
}) => {
  const { toggleCompactMode, compactMode } = useUI();
  const [isCompactHeader, setIsCompactHeader] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setIsCompactHeader(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`sticky top-0 z-30 flex items-center justify-between bg-white/70 border-b border-slate-200 shadow-sm dark:bg-slate-950/60 dark:border-slate-800 dark:shadow-[0_0_20px_rgba(0,0,0,0.4)] px-4 transition-all duration-300 ${isCompactHeader ? 'h-12 backdrop-blur-xl shadow-md' : 'h-16 backdrop-blur'}`}>
      {/* Left: Workspace Badge / Title */}
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="md:hidden text-slate-400 hover:text-slate-200"
          onClick={onToggleMobileSidebar}
        >
          <Icon svg={ICONS.menu} className="h-6 w-6" />
        </Button>

        {/* Workspace Name Badge */}
        <div className="inline-flex items-center gap-2 rounded-full bg-slate-900/70 border border-slate-700/70 px-3 py-1 text-xs font-medium text-slate-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          {title}
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className={`text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 ${compactMode ? 'text-blue-400' : ''}`}
          onClick={toggleCompactMode}
          title="Modo Compacto"
        >
          <Icon svg={ICONS.slidersHorizontal} className="h-5 w-5" />
        </Button>

        <Button 
          variant="ghost" 
          size="icon" 
          className="relative text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
          onClick={onShowNotifications}
        >
          <Icon svg={ICONS.bell} className="h-5 w-5" />
          {unreadNotifications && (
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
          )}
        </Button>
        
        {/* Placeholder for User Avatar or other actions could go here */}
      </div>
    </header>
  );
};
