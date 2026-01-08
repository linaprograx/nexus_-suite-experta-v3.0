
import React from 'react';
import { PageName, UserProfile } from '../types';
import AnimatedPage from '../components/AnimatedPage';
import NeuCard from '../components/NeuCard';
import NeuButton from '../components/NeuButton';

interface DashboardProps {
  onNavigate: (page: PageName) => void;
  user: UserProfile;
  notify: (message: string, type?: 'success' | 'error' | 'loading') => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate, user, notify }) => {

  const stats = [
    { label: 'Margin', value: '78%', color: 'text-emerald-500', icon: 'trending_up' },
    { label: 'Waste', value: '1.2%', color: 'text-rose-500', icon: 'delete_outline' },
    { label: 'Guests', value: '142', color: 'text-indigo-500', icon: 'groups' },
    { label: 'Rating', value: '4.9', color: 'text-amber-500', icon: 'star' },
  ];

  const updates = [
    { title: 'New Stock Alert', desc: 'Mint supply low', time: '10m', type: 'alert' },
    { title: 'Menu Synthesis', desc: 'Summer V2 ready', time: '1h', type: 'info' },
    { title: 'Staff Briefing', desc: 'Checklists updated', time: '3h', type: 'info' },
  ];

  return (
    <AnimatedPage className="px-6 py-6 pb-32 overflow-y-auto scrollbar-hide">

      {/* 1. Header & Daily State */}
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-neu-main tracking-tight">Dashboard</h1>
          <p className="text-[10px] font-black text-neu-sec uppercase tracking-widest mt-1">Status: Operational</p>
        </div>
        <div className="w-12 h-12 rounded-full neu-btn p-1" onClick={() => onNavigate(PageName.Personal)}>
          <img src={user.photo} className="w-full h-full rounded-full object-cover grayscale opacity-90" alt="Profile" />
        </div>
      </header>

      {/* 2. Overview Stats (Grid) */}
      <section className="grid grid-cols-2 gap-4 mb-8">
        {stats.map((stat, i) => (
          <NeuCard key={i} className="p-5 rounded-[2rem] flex flex-col items-start justify-between min-h-[110px]" delay={i * 0.1}>
            <div className={`w-8 h-8 rounded-full neu-pressed flex items-center justify-center ${stat.color} mb-2`}>
              <span className="material-symbols-outlined text-sm">{stat.icon}</span>
            </div>
            <div>
              <span className="text-2xl font-black text-neu-main block">{stat.value}</span>
              <span className="text-[9px] font-black text-neu-sec uppercase tracking-wider">{stat.label}</span>
            </div>
          </NeuCard>
        ))}
      </section>

      {/* 3. Primary Action (Prism reduced) */}
      <section className="mb-8">
        <NeuCard className="p-6 rounded-[2.5rem] bg-indigo-600 text-white relative overflow-hidden" delay={0.2} onClick={() => onNavigate(PageName.CerebritySynthesis)}>
          <div className="absolute top-0 right-0 p-6 opacity-20">
            <span className="material-symbols-outlined text-6xl">auto_awesome</span>
          </div>
          <span className="px-3 py-1 bg-white/20 rounded-full text-[8px] font-black uppercase tracking-widest backdrop-blur-md">Focus</span>
          <h2 className="text-xl font-black mt-4 mb-1">Synthesize Menu</h2>
          <p className="text-xs font-medium opacity-80 mb-4">AI suggests 3 new cocktails.</p>
          <NeuButton className="w-full py-3 bg-white text-indigo-600 font-black text-[10px] uppercase tracking-widest rounded-xl">
            Open Cerebrity
          </NeuButton>
        </NeuCard>
      </section>

      {/* 4. Live Feed (Vertical List) */}
      <section className="space-y-4">
        <div className="flex justify-between items-end px-2">
          <h3 className="text-[10px] font-black text-neu-sec uppercase tracking-widest">Live Updates</h3>
          <span className="text-[9px] font-bold text-indigo-500">View All</span>
        </div>
        {updates.map((update, i) => (
          <NeuCard key={i} className="p-4 rounded-3xl flex items-center gap-4" delay={0.3 + (i * 0.1)}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${update.type === 'alert' ? 'bg-rose-100/50 text-rose-500' : 'bg-indigo-50/50 text-indigo-500'}`}>
              <span className="material-symbols-outlined">{update.type === 'alert' ? 'warning' : 'notifications'}</span>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-neu-main">{update.title}</h4>
              <p className="text-[10px] text-neu-sec font-medium">{update.desc}</p>
            </div>
            <span className="text-[9px] font-bold text-neu-sec opacity-60">{update.time}</span>
          </NeuCard>
        ))}
      </section>

    </AnimatedPage>
  );
};

export default Dashboard;
