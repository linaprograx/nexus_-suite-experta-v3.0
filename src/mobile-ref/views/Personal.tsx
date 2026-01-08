
import React from 'react';
import { PageName, UserProfile } from '../types';

interface Props {
   onNavigate: (page: PageName) => void;
   user: UserProfile;
   setUser: (user: UserProfile) => void;
   notify: (msg: string) => void;
}

const Personal: React.FC<Props> = ({ onNavigate, user, notify }) => {
   return (
      <div className="flex-1 bg-transparent relative overflow-hidden flex flex-col">
         <header className="px-6 pt-10 pb-4 flex items-center justify-between z-10">
            <button onClick={() => onNavigate(PageName.Dashboard)} className="w-10 h-10 rounded-2xl neu-btn flex items-center justify-center text-neu-sec hover:text-neu-main active:scale-90 transition-all">
               <span className="material-symbols-outlined text-lg">arrow_back</span>
            </button>
            <div className="flex gap-2">
               <div className="h-1.5 w-8 neu-pressed rounded-full bg-slate-300"></div>
               <div className="h-1.5 w-8 neu-pressed rounded-full"></div>
            </div>
         </header>

         <main className="flex-1 overflow-y-auto scrollbar-hide px-6 py-2 space-y-6 pb-32 z-10">

            {/* Jupiter Internal Pass Card - Neumorphic Style */}
            <div className="w-full aspect-[4/5] neu-flat rounded-[2.5rem] p-8 relative overflow-hidden flex flex-col justify-between">

               {/* Top Header */}
               <div className="relative z-10 flex justify-between items-start">
                  <div>
                     <p className="text-[9px] font-black text-neu-sec uppercase tracking-[0.3em] mb-1">Nexus ID</p>
                     <h2 className="text-3xl font-black text-neu-main uppercase tracking-tighter leading-none">Jupiter<br />Internal Pass</h2>
                  </div>
                  <div className="w-14 h-14 rounded-2xl neu-pressed flex items-center justify-center text-neu-main">
                     <span className="material-symbols-outlined text-3xl">qr_code_2</span>
                  </div>
               </div>

               {/* Stats Row */}
               <div className="relative z-10 flex justify-between px-2">
                  <div className="text-center">
                     <p className="text-[8px] font-black text-neu-sec uppercase tracking-widest mb-2">Recipes</p>
                     <div className="w-16 h-16 rounded-full neu-pressed flex items-center justify-center mx-auto">
                        <p className="text-xl font-black text-neu-main">15</p>
                     </div>
                  </div>
                  <div className="text-center">
                     <p className="text-[8px] font-black text-neu-sec uppercase tracking-widest mb-2">Avg. Score</p>
                     <div className="w-16 h-16 rounded-full neu-pressed flex items-center justify-center mx-auto">
                        <p className="text-xl font-black text-[#10B981]">54%</p>
                     </div>
                  </div>
                  <div className="text-center">
                     <p className="text-[8px] font-black text-neu-sec uppercase tracking-widest mb-2">Contrib</p>
                     <div className="w-16 h-16 rounded-full neu-pressed flex items-center justify-center mx-auto">
                        <p className="text-xl font-black text-neu-main">4</p>
                     </div>
                  </div>
               </div>

               {/* Bottom Footer */}
               <div className="relative z-10">
                  <div className="flex justify-between items-end mb-4">
                     <div>
                        <p className="text-[8px] font-mono text-neu-sec mb-2">ID: 884-291-NEX</p>
                        <span className="neu-pressed text-cyan-600 px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest">Nexus Expert</span>
                     </div>
                     <span className="neu-btn text-neu-sec px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest">Verified</span>
                  </div>
               </div>
            </div>

            {/* Dashboard Grid */}
            <div className="grid grid-cols-2 gap-4">
               <div className="neu-flat rounded-[2rem] p-5 flex flex-col justify-between h-44">
                  <div className="w-12 h-12 neu-btn rounded-xl flex items-center justify-center text-[#F59E0B] mb-2">
                     <span className="material-symbols-outlined">monitoring</span>
                  </div>
                  <div>
                     <p className="text-[9px] font-black text-neu-sec uppercase tracking-widest mb-1.5">Recent Activity</p>
                     <p className="text-sm font-bold text-neu-main leading-tight">Created recipe "Blue Lagoon"</p>
                     <p className="text-[9px] text-neu-sec mt-2">2 hours ago</p>
                  </div>
               </div>

               <div className="neu-flat rounded-[2rem] p-5 flex flex-col justify-between h-44">
                  <div className="w-12 h-12 neu-btn rounded-xl flex items-center justify-center text-[#3B82F6] mb-2">
                     <span className="material-symbols-outlined">military_tech</span>
                  </div>
                  <div>
                     <p className="text-[9px] font-black text-neu-sec uppercase tracking-widest mb-1.5">Next Goal</p>
                     <p className="text-sm font-bold text-neu-main leading-tight">Master of Gin</p>
                     <div className="w-full h-2 neu-pressed rounded-full mt-3 overflow-hidden p-[2px]">
                        <div className="w-[70%] h-full bg-[#3B82F6] rounded-full shadow-sm"></div>
                     </div>
                  </div>
               </div>
            </div>

            {/* Strategic Action */}
            <div className="neu-flat rounded-[2rem] p-6 flex items-center justify-between">
               <div className="flex items-center gap-4">
                  <div className="w-14 h-14 neu-pressed rounded-2xl flex items-center justify-center text-[#10B981]">
                     <span className="material-symbols-outlined">inventory</span>
                  </div>
                  <div>
                     <h4 className="font-bold text-neu-main text-sm">Stock Audit</h4>
                     <p className="text-[10px] text-neu-sec font-bold uppercase tracking-wide">Pending Review</p>
                  </div>
               </div>
               <button className="w-12 h-12 rounded-xl neu-btn text-neu-sec hover:text-[#10B981] transition-colors flex items-center justify-center active:scale-90">
                  <span className="material-symbols-outlined">arrow_forward</span>
               </button>
            </div>

            {/* Master Tip */}
            <div className="neu-flat rounded-[2rem] p-8 relative overflow-hidden">
               <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-4">
                     <span className="material-symbols-outlined text-[#F59E0B] text-lg">lightbulb</span>
                     <span className="text-[9px] font-black text-[#F59E0B] uppercase tracking-widest">Master Tip</span>
                  </div>
                  <p className="text-sm font-medium italic text-neu-main leading-relaxed">"El hielo es el alma del cóctel. Nunca subestimes la importancia de la dilución controlada y la temperatura perfecta."</p>
                  <div className="flex items-center gap-3 mt-6">
                     <div className="w-10 h-10 rounded-full neu-pressed flex items-center justify-center text-[10px] font-black text-neu-sec">JD</div>
                     <span className="text-[10px] font-bold text-neu-sec uppercase tracking-widest">John Doe, Mixologist</span>
                  </div>
               </div>
            </div>

            {/* Settings Section */}
            <section className="neu-flat rounded-[2.5rem] p-8">
               <h3 className="text-[10px] font-black text-neu-sec uppercase tracking-[0.3em] mb-8">Configuration</h3>
               <div className="space-y-8">
                  <div className="flex items-center justify-between">
                     <span className="text-sm font-bold text-neu-main">Notifications</span>
                     {/* Neumorphic Toggle - ON */}
                     <div className="w-14 h-7 neu-pressed rounded-full relative cursor-pointer">
                        <div className="absolute right-1 top-1 w-5 h-5 bg-[#6D28D9] rounded-full shadow-md"></div>
                     </div>
                  </div>
                  <div className="flex items-center justify-between">
                     <span className="text-sm font-bold text-neu-main">Compact Mode</span>
                     {/* Neumorphic Toggle - OFF */}
                     <div className="w-14 h-7 neu-pressed rounded-full relative cursor-pointer">
                        <div className="absolute left-1 top-1 w-5 h-5 bg-[#EFEEEE] border border-slate-300 rounded-full shadow-md"></div>
                     </div>
                  </div>
                  <div className="flex items-center justify-between">
                     <span className="text-sm font-bold text-neu-main">System Sounds</span>
                     {/* Neumorphic Toggle - ON */}
                     <div className="w-14 h-7 neu-pressed rounded-full relative cursor-pointer">
                        <div className="absolute right-1 top-1 w-5 h-5 bg-[#6D28D9] rounded-full shadow-md"></div>
                     </div>
                  </div>
               </div>
            </section>

         </main>
      </div>
   );
};

export default Personal;
