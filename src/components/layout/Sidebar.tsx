import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useUI } from '../../context/UIContext';
import { Icon } from '../ui/Icon';
import { ICONS } from '../ui/icons';
import { Button } from '../ui/Button';
import { NexusOrb } from '../ui/NexusOrb';
import { APP_SECTIONS, colorDeRuta } from '../../config/appSections';
import { useAcento } from '../../store/acentoStore';
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

  /**
   * El resaltado lleva el COLOR DE LA SECCIÓN, no el arcoíris del logo.
   *
   * Antes todo elemento activo se rellenaba con el degradado de la marca. Eso
   * tenía dos problemas: el color no decía **cuál** de las secciones estabas
   * mirando —todas se veían igual—, y convertía cada fila activa en un
   * mini-logo, que diluye la marca en vez de reforzarla. Un logo funciona
   * porque aparece en un sitio.
   *
   * Ahora el verde es Grimorio y el rosa es CerebrIty, y son los mismos
   * valores que usa la barra inferior de móvil, así que las dos navegaciones
   * dicen lo mismo.
   *
   * ## Por qué el degradado va en HORIZONTAL
   *
   * Las cabeceras de sección desvanecen de arriba abajo, y ahí funciona porque
   * miden 200 px o más. Una fila de esta barra mide 38: repartir un degradado
   * en vertical sobre 38 px son tres o cuatro píxeles por parada, y no se lee
   * como un haz, se lee como una mancha. En horizontal tiene 200 px para
   * desvanecerse de verdad.
   *
   * ## Un solo degradado, sin barrita aparte
   *
   * La primera versión ponía una barrita sólida de 3 px a la izquierda y el
   * degradado detrás. Se veían como **dos cosas**: un borde duro y, pegada, una
   * mancha que no casaba con él. El corte se notaba justo donde no debía.
   *
   * Ahora es un único degradado que **empieza en el color puro** y decae hasta
   * desaparecer antes de la mitad. Los primeros píxeles a plena saturación
   * hacen el trabajo de la barrita —el ojo sigue teniendo su ancla en el borde
   * izquierdo— pero sin ningún borde: el paso de color a nada es continuo.
   */
  /**
   * El acento vigente manda sobre el color fijo de la sección.
   *
   * CerebrIty cambia de identidad en cada pestaña, y la barra está fuera de esa
   * vista: sin esto, se quedaría en el magenta de Synthesis mientras miras
   * Trends en naranja. Solo aplica al elemento activo; los demás no pintan
   * degradado, así que su color da igual.
   */
  const acentoVigente = useAcento();
  const color = (isActive && acentoVigente) || colorDeRuta(path);

  const baseClasses = "group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-300 overflow-hidden";

  const activeStyle = isActive ? {
    // Muchas paradas y juntas al principio: así el color cae deprisa desde el
    // borde sin que se vea ni una sola frontera. Con dos paradas, el ojo
    // encuentra la línea; con seis, no hay línea que encontrar.
    background: `linear-gradient(90deg, ${color} 0%, ${color}d9 3%, ${color}8c 10%, ${color}4d 22%, ${color}21 36%, ${color}0a 46%, transparent 56%)`,
  } : undefined;

  const activeClasses = "text-slate-900 dark:text-white";
  const inactiveClasses =
    "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 " +
    "hover:bg-slate-100/50 dark:hover:bg-white/5 transition-colors";

  return (
    <button
      onClick={() => onNavigate(path)}
      className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses} ${isCollapsed ? 'justify-center' : ''}`}
      style={activeStyle}
    >
      {/* El icono toma el color de la sección a plena saturación: refuerza la
          barrita sin necesidad de más relleno. Va envuelto porque `Icon` no
          acepta `style`; el SVG hereda `currentColor`. */}
      <span className="flex-shrink-0" style={isActive ? { color } : undefined}>
        <Icon svg={icon} className={`h-5 w-5 transition-colors ${isActive ? '' : 'text-slate-500 dark:text-slate-500 group-hover:text-slate-900 dark:group-hover:text-slate-200'}`} />
      </span>
      {!isCollapsed && <span className="truncate">{label}</span>}
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
  const { isDarkMode, toggleTheme, isSidebarCollapsed, toggleSidebar } = useUI();
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
          onClick={toggleTheme}
          className={`flex items-center gap-3 rounded-xl py-2 px-3 text-sm font-medium transition text-slate-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white dark:hover:shadow-[0_0_20px_rgba(15,23,42,0.6)] ${isSidebarCollapsed ? 'justify-center' : ''}`}
          title={isSidebarCollapsed ? "Cambiar Tema" : ""}
        >
          <div className="flex items-center justify-center">
            <Icon svg={isDarkMode ? ICONS.sun : ICONS.moon} className="h-5 w-5 text-slate-500 group-hover:text-slate-900 dark:group-hover:text-slate-200" />
          </div>
          {!isSidebarCollapsed && <span>{isDarkMode ? 'Modo Claro' : 'Modo Oscuro'}</span>}
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
