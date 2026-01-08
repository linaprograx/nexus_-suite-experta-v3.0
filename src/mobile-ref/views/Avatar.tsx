
import React, { useState } from 'react';
import { PageName, UserProfile } from '../types';
import AnimatedPage from '../components/AnimatedPage';
import NeuCard from '../components/NeuCard';
import NeuButton from '../components/NeuButton';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
   onNavigate: (page: PageName) => void;
   user?: UserProfile;
   initialTab?: 'Core' | 'Intelligence' | 'Competition';
   notify: (msg: string, type?: 'success' | 'error' | 'loading') => void;
}

const Avatar: React.FC<Props> = ({ onNavigate, initialTab = 'Core', notify }) => {
   const [activeTab, setActiveTab] = useState<'Core' | 'Intelligence' | 'Competition'>(initialTab);

   const TABS = ['Core', 'Intelligence', 'Competition'];

   const getAccentColor = () => {
      switch (activeTab) {
         case 'Core': return 'text-slate-800';
         case 'Intelligence': return 'text-rose-600';
         case 'Competition': return 'text-emerald-600';
      }
   };

   const getBgAccent = () => {
      switch (activeTab) {
         case 'Core': return 'bg-slate-800';
         case 'Intelligence': return 'bg-rose-600';
         case 'Competition': return 'bg-emerald-600';
      }
   };

   return (
      <AnimatedPage className="bg-transparent relative overflow-hidden flex flex-col h-full">

         {/* Header with Navigation */}
         <header className="px-6 pt-6 pb-2">
            <div className="flex justify-between items-center mb-6">
               <h1 className={`text-2xl font-black tracking-tight ${getAccentColor()}`}>Avatar</h1>
               <NeuButton onClick={() => onNavigate(PageName.Dashboard)} className="w-10 h-10 rounded-xl text-neu-sec"><span className="material-symbols-outlined">close</span></NeuButton>
            </div>

            <div className="neu-pressed p-1 rounded-2xl flex relative">
               {TABS.map(tab => (
                  <button
                     key={tab}
                     onClick={() => setActiveTab(tab as any)}
                     className={`flex-1 py-3 text-[9px] font-black uppercase tracking-widest z-10 transition-colors
                            ${activeTab === tab ? getAccentColor() : 'text-neu-sec'}`}
                  >
                     {tab}
                  </button>
               ))}
               <motion.div
                  className="absolute top-1 bottom-1 w-1/3 bg-white shadow-sm rounded-xl"
                  layoutId="avatarTab"
                  animate={{ left: activeTab === 'Core' ? '4px' : activeTab === 'Intelligence' ? '33.3%' : '65.5%' }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
               />
            </div>
         </header>

         <main className="flex-1 overflow-y-auto scrollbar-hide px-6 py-6 pb-32">
            <AnimatePresence mode="wait">

               {/* --- CORE SECTION (Graphite/Black) --- */}
               {activeTab === 'Core' && (
                  <motion.div
                     key="Core"
                     initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                     className="space-y-6"
                  >
                     <NeuCard className="p-8 rounded-[3rem] flex flex-col items-center justify-center text-center bg-slate-800 text-white">
                        <div className="w-24 h-24 rounded-full border-4 border-white/10 p-1 mb-4 relative">
                           <img src="https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400&h=400&fit=crop" className="w-full h-full rounded-full object-cover" />
                        </div>
                        <h2 className="text-2xl font-black">Lian Alviz</h2>
                        <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest mt-1">Bar Manager • Level 4</p>

                        <div className="h-px w-full bg-white/10 my-6"></div>

                        <div className="grid grid-cols-3 gap-6 w-full">
                           <div className="flex flex-col items-center">
                              <span className="text-xl font-black">142</span>
                              <span className="text-[8px] uppercase font-bold opacity-40">Shifts</span>
                           </div>
                           <div className="flex flex-col items-center">
                              <span className="text-xl font-black">4.9</span>
                              <span className="text-[8px] uppercase font-bold opacity-40">Rating</span>
                           </div>
                           <div className="flex flex-col items-center">
                              <span className="text-xl font-black">8</span>
                              <span className="text-[8px] uppercase font-bold opacity-40">Badges</span>
                           </div>
                        </div>
                     </NeuCard>

                     <div className="space-y-2">
                        <h3 className="text-[10px] font-black text-neu-sec uppercase tracking-widest pl-2 mb-2">Active Shifts</h3>
                        {[1, 2].map(i => (
                           <NeuCard key={i} className="p-4 rounded-2xl flex justify-between items-center">
                              <div>
                                 <h4 className="text-sm font-bold text-slate-800">Dinner Service</h4>
                                 <p className="text-[10px] text-neu-sec">Today • 18:00 - 02:00</p>
                              </div>
                              <span className="px-3 py-1 bg-emerald-100 text-emerald-600 text-[9px] font-black uppercase rounded-lg">Active</span>
                           </NeuCard>
                        ))}
                     </div>
                  </motion.div>
               )}

               {/* --- INTELLIGENCE SECTION (Vivid Red) --- */}
               {activeTab === 'Intelligence' && (
                  <motion.div
                     key="Intelligence"
                     initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                     className="space-y-6"
                  >
                     <NeuCard className="p-8 rounded-[2.5rem] bg-rose-600 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-20">
                           <span className="material-symbols-outlined text-[100px]">psychology</span>
                        </div>
                        <span className="px-3 py-1 bg-white/20 rounded-full text-[9px] font-black uppercase tracking-widest backdrop-blur-md">Cognitive Load</span>
                        <h2 className="text-4xl font-black mt-4 mb-2">High</h2>
                        <p className="text-xs font-medium opacity-80 max-w-[80%]">System is prioritizing creative tasks. Operational load is balanced.</p>
                     </NeuCard>

                     <div className="grid grid-cols-2 gap-4">
                        <NeuCard className="p-6 rounded-[2rem] flex flex-col items-center justify-center text-center border-2 border-rose-100">
                           <span className="text-3xl font-black text-rose-600 mb-1">92%</span>
                           <p className="text-[9px] text-rose-600/60 uppercase font-black tracking-widest">Creativity</p>
                        </NeuCard>
                        <NeuCard className="p-6 rounded-[2rem] flex flex-col items-center justify-center text-center border-2 border-slate-100">
                           <span className="text-3xl font-black text-neu-main mb-1">85%</span>
                           <p className="text-[9px] text-neu-sec uppercase font-black tracking-widest">Efficiency</p>
                        </NeuCard>
                     </div>
                  </motion.div>
               )}

               {/* --- COMPETITION SECTION (Green) --- */}
               {activeTab === 'Competition' && (
                  <motion.div
                     key="Competition"
                     initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                     className="space-y-4"
                  >
                     <div className="bg-emerald-600 rounded-[2.5rem] p-8 text-white mb-4">
                        <h2 className="text-2xl font-black mb-1">Season 4</h2>
                        <p className="text-xs font-medium opacity-80 mb-6">Global Bartender League</p>
                        <div className="flex justify-between items-end">
                           <div>
                              <span className="text-[9px] uppercase font-black tracking-widest opacity-60 block">Your Rank</span>
                              <span className="text-3xl font-black">#42</span>
                           </div>
                           <div className="text-right">
                              <span className="text-[9px] uppercase font-black tracking-widest opacity-60 block">Points</span>
                              <span className="text-xl font-black">8,450</span>
                           </div>
                        </div>
                     </div>

                     <h3 className="text-[10px] font-black text-neu-sec uppercase tracking-widest pl-2">Leaderboard</h3>
                     {[1, 2, 3, 4, 5].map((pos, i) => (
                        <NeuCard key={pos} className="p-4 rounded-3xl flex items-center gap-4" delay={i * 0.1}>
                           <div className={`w-8 h-8 flex items-center justify-center font-black rounded-lg ${pos <= 3 ? 'bg-emerald-100 text-emerald-600' : 'neu-pressed text-neu-sec'}`}>
                              {pos}
                           </div>
                           <div className="w-10 h-10 rounded-full bg-slate-200">
                              <img src={`https://i.pravatar.cc/150?u=${pos}`} className="w-full h-full rounded-full object-cover" />
                           </div>
                           <div className="flex-1">
                              <h4 className="text-sm font-bold text-neu-main">User_{882 + pos}</h4>
                              <p className="text-[9px] font-black text-neu-sec uppercase tracking-wider">Tokyo, JP</p>
                           </div>
                           <span className="text-sm font-black text-neu-sec">{9850 - (pos * 150)}</span>
                        </NeuCard>
                     ))}
                  </motion.div>
               )}
            </AnimatePresence>
         </main>

      </AnimatedPage>
   );
};

export default Avatar;
