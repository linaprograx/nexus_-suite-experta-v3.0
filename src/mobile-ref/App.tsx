
import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { PageName, UserProfile, NotificationState } from './types';
import { PAGE_THEMES } from './constants';
import Login from './views/Login';
import Dashboard from './views/Dashboard';
import GrimorioRecipes from './views/GrimorioRecipes';
import GrimorioMarket from './views/GrimorioMarket';
import GrimorioStock from './views/GrimorioStock';
import Pizarron from './views/Pizarron';
import CerebritySynthesis from './views/CerebritySynthesis';
import CerebrityMakeMenu from './views/CerebrityMakeMenu';
import CerebrityCritic from './views/CerebrityCritic';
import CerebrityLab from './views/CerebrityLab';
import CerebrityTrend from './views/CerebrityTrend';
import Avatar from './views/Avatar';
import Colegium from './views/Colegium';
import Personal from './views/Personal';
import BottomNav from './components/BottomNav';
import Atmosphere from './components/Atmosphere';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<PageName>(PageName.Login);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [notification, setNotification] = useState<NotificationState>({ show: false, message: '', type: 'success' });
  const [user, setUser] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem('nexus_user');
      return saved ? JSON.parse(saved) : {
        name: 'Lian Alviz',
        photo: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400&h=400&fit=crop',
        role: 'Bar Manager'
      };
    } catch (e) {
      console.error("Failed to load user from local storage", e);
      return {
        name: 'Lian Alviz',
        photo: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400&h=400&fit=crop',
        role: 'Bar Manager'
      };
    }
  });

  const notify = (message: string, type: 'success' | 'error' | 'loading' = 'success') => {
    setNotification({ show: true, message, type });
    if (type !== 'loading') {
      setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 3000);
    }
  };

  const handleUnlock = () => {
    notify('Sincronizando Nexus Core...', 'loading');
    setTimeout(() => {
      setIsUnlocked(true);
      setCurrentPage(PageName.Dashboard);
      setNotification(prev => ({ ...prev, show: false }));
    }, 1200);
  };

  const currentTheme = PAGE_THEMES[currentPage];

  const renderPage = () => {
    const props = { onNavigate: setCurrentPage, user, setUser, notify };
    switch (currentPage) {
      case PageName.Login: return <Login onUnlock={handleUnlock} user={user} />;
      case PageName.Dashboard: return <Dashboard {...props} />;
      case PageName.GrimorioRecipes: return <GrimorioRecipes {...props} />;
      case PageName.GrimorioMarket: return <GrimorioMarket {...props} />;
      case PageName.GrimorioStock: return <GrimorioStock {...props} />;
      case PageName.Pizarron: return <Pizarron {...props} />;
      case PageName.CerebritySynthesis: return <CerebritySynthesis {...props} />;
      case PageName.CerebrityMakeMenu: return <CerebrityMakeMenu {...props} />;
      case PageName.CerebrityCritic: return <CerebrityCritic {...props} />;
      case PageName.CerebrityLab: return <CerebrityLab {...props} />;
      case PageName.CerebrityTrend: return <CerebrityTrend {...props} />;
      case PageName.AvatarCore: return <Avatar {...props} initialTab="Core" />;
      case PageName.AvatarIntelligence: return <Avatar {...props} initialTab="Intelligence" />;
      case PageName.AvatarCompetition: return <Avatar {...props} initialTab="Competition" />;
      case PageName.Colegium: return <Colegium {...props} />;
      case PageName.Personal: return <Personal {...props} />;
      default: return <Dashboard {...props} />;
    }
  };

  return (
    <div className="relative w-full max-w-[390px] h-full max-h-[844px] overflow-hidden shadow-2xl md:rounded-[3rem] border-[8px] border-[#EFEEEE] flex flex-col font-['Outfit'] bg-[#EFEEEE] neu-flat text-[#3E4E5E]">
      {/* Atmosphere Layer */}
      <Atmosphere currentPage={currentPage} />

      {/* Notch */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-7 bg-black rounded-b-2xl z-[100] flex items-center justify-center">
        <div className="w-10 h-1 bg-white/10 rounded-full"></div>
      </div>

      {/* Status Bar */}
      <div className={`px-8 pt-6 pb-1 flex justify-between items-center text-xs font-semibold z-[60] transition-colors duration-500 ${currentPage === PageName.Login ? 'text-white' : 'text-slate-800'}`}>
        <span>9:41</span>
        <div className="flex gap-1.5 items-center">
          <span className="material-symbols-outlined text-[16px]">signal_cellular_alt</span>
          <span className="material-symbols-outlined text-[16px]">wifi</span>
          <span className="material-symbols-outlined text-[16px]">battery_full</span>
        </div>
      </div>

      {/* Global Notification Toast */}
      {notification.show && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[200] w-[85%] animate-in fade-in slide-in-from-top-4 duration-300">
          <div className={`px-6 py-4 rounded-3xl shadow-2xl flex items-center gap-3 backdrop-blur-2xl border border-white/20
             ${notification.type === 'loading' ? 'bg-indigo-600/90 text-white' : 'bg-white/90 text-slate-800'}`}>
            {notification.type === 'loading' && <span className="material-symbols-outlined animate-spin text-[18px]">sync</span>}
            {notification.type === 'success' && <span className="material-symbols-outlined text-emerald-500 text-[20px]">check_circle</span>}
            <span className="text-[11px] font-black uppercase tracking-[0.1em]">{notification.message}</span>
          </div>
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 overflow-hidden relative z-10 flex flex-col">
        <AnimatePresence mode="wait">
          <div key={currentPage} className="h-full w-full">
            {renderPage()}
          </div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      {isUnlocked && currentPage !== PageName.Login && (
        <BottomNav currentPage={currentPage} onNavigate={setCurrentPage} />
      )}

      {/* Home Indicator */}
      {isUnlocked && <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-32 h-1 bg-slate-900/10 rounded-full z-[110]"></div>}
    </div>
  );
};

export default App;
