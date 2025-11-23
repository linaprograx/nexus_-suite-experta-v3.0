import React from 'react';
import { UIContextType } from '../../types';

const UIContext = React.createContext<UIContextType | undefined>(undefined);

export const useUI = (): UIContextType => {
  const context = React.useContext(UIContext);
  if (!context) throw new Error('useUI must be used within a UIProvider');
  return context;
};

const applyTheme = (theme: string) => {
    localStorage.setItem('theme', theme);
    let isDark;
    if (theme === 'dark') {
        isDark = true;
    } else if (theme === 'light') {
        isDark = false;
    } else {
        isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    if (isDark) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
};

export const UIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = React.useState<string>(() => {
    if (typeof window !== 'undefined') {
        const savedTheme = localStorage.getItem('theme');
        return savedTheme || 'system';
    }
    return 'system';
  });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('isSidebarCollapsed');
      return saved ? JSON.parse(saved) : false;
    }
    return false;
  });
  const [compactMode, setCompactMode] = React.useState<boolean>(false);

  React.useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  React.useEffect(() => {
    localStorage.setItem('isSidebarCollapsed', JSON.stringify(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  const toggleSidebar = () => setIsSidebarCollapsed(prev => !prev);
  const toggleCompactMode = () => setCompactMode(prev => !prev);

  return (
    <UIContext.Provider value={{ theme, setTheme, isSidebarCollapsed, toggleSidebar, compactMode, toggleCompactMode }}>
      {children}
    </UIContext.Provider>
  );
};
