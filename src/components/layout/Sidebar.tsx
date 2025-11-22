import React from 'react';
import { ViewName } from '../../../types';
import { useApp } from '../../context/AppContext';
import { useUI } from '../../context/UIContext';
import { Icon } from '../ui/Icon';
import { ICONS } from '../ui/icons';
import { Button } from '../ui/Button';

const APP_ROUTES: { view: ViewName; label: string; icon: string }[] = [
    { view: 'dashboard', label: 'Dashboard', icon: ICONS.grid },
    { view: 'grimorium', label: 'Grimorium', icon: ICONS.book },
    { view: 'pizarron', label: 'Pizarrón', icon: ICONS.layoutGrid },
    { view: 'cerebrIty', label: 'CerebrIty', icon: ICONS.brain },
    { view: 'escandallator', label: 'Escandallator', icon: ICONS.calculator },
    { view: 'trendLocator', label: 'Trend Locator', icon: ICONS.trending },
    { view: 'zeroWaste', label: 'Zero Waste Chef', icon: ICONS.recycle },
    { view: 'makeMenu', label: 'MakeMenu', icon: ICONS.menu },
    { view: 'colegium', label: 'Colegium', icon: ICONS.school },
];

const NavLink: React.FC<{
  view: ViewName;
  label: string;
  icon: string;
  currentView: ViewName;
  setCurrentView: (view: ViewName) => void;
  isCollapsed: boolean;
}> = ({ view, label, icon, currentView, setCurrentView, isCollapsed }) => {
  const isActive = currentView === view;
  return (
    <button
      onClick={() => setCurrentView(view)}
      className={`flex items-center p-2 rounded-lg transition-colors ${
        isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
      } ${isCollapsed ? 'justify-center' : ''}`}
    >
      <Icon svg={icon} className="h-5 w-5" />
      {!isCollapsed && <span className="ml-3">{label}</span>}
    </button>
  );
};

export const Sidebar: React.FC<{
  currentView: ViewName;
  setCurrentView: (view: ViewName) => void;
  onShowNotifications: () => void;
  unreadNotifications: boolean;
}> = ({ currentView, setCurrentView, onShowNotifications, unreadNotifications }) => {
  const { auth, userProfile } = useApp();
  const { theme, setTheme, isSidebarCollapsed, toggleSidebar } = useUI();
  
  if (!auth) return null;

  return (
    <aside className={`flex flex-col bg-card border-r transition-all duration-300 ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}>
      <div className={`p-4 flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
        {!isSidebarCollapsed && <h1 className="font-bold text-lg">Nexus Suite</h1>}
        <Button variant="ghost" size="icon" onClick={toggleSidebar}>
          <Icon svg={isSidebarCollapsed ? ICONS.chevronRight : ICONS.chevronLeft} />
        </Button>
      </div>
      <nav className="flex-1 p-2 space-y-1">
        {APP_ROUTES.map(route => (
          <NavLink key={route.view} {...route} currentView={currentView} setCurrentView={setCurrentView} isCollapsed={isSidebarCollapsed} />
        ))}
      </nav>
      <div className="p-2 border-t">
        <NavLink view="personal" label={userProfile?.displayName || auth.currentUser?.email || "Mi Perfil"} icon={ICONS.user} currentView={currentView} setCurrentView={setCurrentView} isCollapsed={isSidebarCollapsed} />
        <button
          onClick={onShowNotifications}
          className={`flex items-center p-2 rounded-lg hover:bg-accent transition-colors w-full relative ${isSidebarCollapsed ? 'justify-center' : ''}`}
        >
          <Icon svg={ICONS.bell} className="h-5 w-5" />
          {!isSidebarCollapsed && <span className="ml-3">Notificaciones</span>}
          {unreadNotifications && (
            <span className={`absolute ${isSidebarCollapsed ? 'top-2 right-2' : 'ml-auto'} w-2 h-2 bg-red-500 rounded-full`} />
          )}
        </button>
        <button onClick={() => setTheme(prevTheme => prevTheme === 'dark' ? 'light' : 'dark')} className={`flex items-center p-2 rounded-lg hover:bg-accent transition-colors w-full ${isSidebarCollapsed ? 'justify-center' : ''}`}>
           <Icon svg={theme === 'dark' ? ICONS.sun : ICONS.moon} className="h-5 w-5" />
          {!isSidebarCollapsed && <span className="ml-3">{theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}</span>}
        </button>
        <button onClick={() => auth.signOut()} className={`flex items-center p-2 rounded-lg hover:bg-accent transition-colors w-full ${isSidebarCollapsed ? 'justify-center' : ''}`}>
          <Icon svg={ICONS.logOut} className="h-5 w-5" />
          {!isSidebarCollapsed && <span className="ml-3">Cerrar Sesión</span>}
        </button>
      </div>
    </aside>
  );
};
