import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useUI } from '../../context/UIContext';
import { Icon } from '../ui/Icon';
import { ICONS } from '../ui/icons';
import { Button } from '../ui/Button';
import { NexusOrb } from '../ui/NexusOrb';
import { APP_SECTIONS } from '../../config/appSections';
import { useSectionsStore } from '../../store/sectionsStore';

interface NavLinkProps {
  view: string; // Changed from ViewName to string for router paths
  label: string;
  icon: string;
  currentPath: string; // Changed from currentView
  onNavigate: (path: string) => void; // Changed from setCurrentView
  isCollapsed: boolean;
}

const NavLink: React.FC<NavLinkProps> = ({ view, label, icon, currentPath, onNavigate, isCollapsed }) => {
  const path = view === 'dashboard' ? '/' : `/${view}`;
  const isActive = currentPath === path || (path !== '/' && currentPath.startsWith(path));

  // Tech Futurista Styles (Ultra Premium)
  const baseClasses = "group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-300 relative overflow-hidden";

  const activeClasses =
    "text-white bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 shadow-lg shadow-orange-500/30 " +
    "border border-white/20 dark:border-white/30";

  const inactiveClasses =
    "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 " +
    "hover:bg-slate-100/50 dark:hover:bg-white/5 transition-colors";

  return (
    <button
      onClick={() => onNavigate(path)}
      className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses} ${isCollapsed ? 'justify-center' : ''}`}
    >
      <Icon svg={icon} className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-500 group-hover:text-slate-900 dark:group-hover:text-slate-200'}`} />
      {!isCollapsed && <span className="truncate">{label}</span>}
      {isActive && <div className="absolute inset-0 bg-white/10 blur-sm rounded-xl pointer-events-none hidden dark:block" />}
    </button>
  );
};

interface SidebarProps {
  // Legacy props removed or made optional/ignored
  currentView?: any;
  setCurrentView?: any;
  onShowNotifications: () => void;
  unreadNotifications: boolean;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onShowNotifications,
  unreadNotifications,
  isMobileOpen,
  onCloseMobile
}) => {
  const { auth, userProfile } = useApp();
  const { theme, setTheme, isSidebarCollapsed, toggleSidebar } = useUI();
  const isEnabled = useSectionsStore(s => s.isEnabled);
  const hiddenSections = useSectionsStore(s => s.hiddenSections); // subscribe so nav re-renders on toggle

  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigate = (path: string) => {
    navigate(path);
    onCloseMobile();
  };

  if (!auth) return null;

  // Common content for both Desktop and Mobile
  const SidebarContent = () => (
    <>
      {/* Header */}
      <div className={`h-20 flex items-center px-4 ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
        <div className={`flex items-center gap-3 ${isSidebarCollapsed ? 'justify-center w-full' : ''}`}>
          {/* Nexus brand mark (unified) */}
          <div className="group-hover:scale-110 transition-transform duration-500">
            <NexusOrb size={40} />
          </div>

          {!isSidebarCollapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-slate-900 dark:text-white leading-tight tracking-tight">Nexus Suite</span>
              <span className="text-[10px] font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-yellow-400 uppercase tracking-wider">
                Suite Experta v3.0
              </span>
            </div>
          )}
        </div>

        {/* Toggle Button (Desktop only) */}
        <div className="hidden md:block">
          {!isSidebarCollapsed && (
            <Button variant="ghost" size="icon" onClick={toggleSidebar} className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
              <Icon svg={ICONS.chevronLeft} />
            </Button>
          )}
        </div>
      </div>

      {/* If collapsed, show expand button at top/center */}
      {isSidebarCollapsed && (
        <div className="hidden md:flex justify-center mb-4">
          <Button variant="ghost" size="icon" onClick={toggleSidebar} className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
            <Icon svg={ICONS.chevronRight} />
          </Button>
        </div>
      )}

      {/* Nav Items */}
      <nav className="flex-1 px-3 space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        {APP_SECTIONS.filter(section => isEnabled(section.id)).map(section => (
          <NavLink
            key={section.id}
            view={section.id}
            label={section.label}
            icon={section.icon}
            currentPath={location.pathname}
            onNavigate={handleNavigate}
            isCollapsed={isSidebarCollapsed}
          />
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 mt-2 space-y-1 bg-white/40 dark:bg-slate-950/40 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800">
        <NavLink
          view="personal"
          label={userProfile?.displayName || "Mi Perfil"}
          icon={ICONS.user}
          currentPath={location.pathname}
          onNavigate={handleNavigate}
          isCollapsed={isSidebarCollapsed}
        />

        <button
          onClick={() => { onShowNotifications(); onCloseMobile(); }}
          className={`flex items-center gap-3 rounded-xl py-2 px-3 text-sm font-medium transition text-slate-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white dark:hover:shadow-[0_0_20px_rgba(15,23,42,0.6)] ${isSidebarCollapsed ? 'justify-center' : ''}`}
          title={isSidebarCollapsed ? "Notificaciones" : ""}
        >
          <div className="relative flex items-center justify-center">
            <Icon svg={ICONS.bell} className="h-5 w-5 text-slate-500 group-hover:text-slate-900 dark:group-hover:text-slate-200" />
            {unreadNotifications && <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full shadow-sm" />}
          </div>
          {!isSidebarCollapsed && <span>Notificaciones</span>}
        </button>

        <button
          onClick={() => setTheme((prevTheme: string) => prevTheme === 'dark' ? 'light' : 'dark')}
          className={`flex items-center gap-3 rounded-xl py-2 px-3 text-sm font-medium transition text-slate-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white dark:hover:shadow-[0_0_20px_rgba(15,23,42,0.6)] ${isSidebarCollapsed ? 'justify-center' : ''}`}
          title={isSidebarCollapsed ? "Cambiar Tema" : ""}
        >
          <div className="flex items-center justify-center">
            <Icon svg={theme === 'dark' ? ICONS.sun : ICONS.moon} className="h-5 w-5 text-slate-500 group-hover:text-slate-900 dark:group-hover:text-slate-200" />
          </div>
          {!isSidebarCollapsed && <span>{theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}</span>}
        </button>

        <button
          onClick={() => auth.signOut()}
          className={`flex items-center gap-3 rounded-xl py-2 px-3 text-sm font-medium transition text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 ${isSidebarCollapsed ? 'justify-center' : ''}`}
          title={isSidebarCollapsed ? "Cerrar Sesión" : ""}
        >
          <div className="flex items-center justify-center">
            <Icon svg={ICONS.logOut} className="h-5 w-5" />
          </div>
          {!isSidebarCollapsed && <span>Cerrar Sesión</span>}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* DESKTOP SIDEBAR */}
      <aside
        className={`
            hidden lg:flex flex-col fixed left-0 top-0 h-screen z-40
            bg-[#f8fafc]/80 backdrop-blur-2xl border-r border-slate-200/60
            dark:bg-[#0f172a]/80 dark:backdrop-blur-2xl dark:border-slate-800/60
            transition-all duration-300 ease-in-out
            ${isSidebarCollapsed ? 'w-20' : 'w-64'}
        `}
      >
        <SidebarContent />
      </aside>

      {/* MOBILE SIDEBAR (DRAWER) */}
      {/* Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Drawer Panel */}
      <div
        className={`
            lg:hidden fixed inset-y-0 left-0 z-50 w-64
            bg-[#f8fafc]/90 backdrop-blur-2xl border-r border-slate-200/60
            dark:bg-[#0f172a]/90 dark:backdrop-blur-2xl dark:border-slate-800/60
            transform transition-transform duration-300 ease-in-out
            ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <SidebarContent />
      </div>
    </>
  );
};
