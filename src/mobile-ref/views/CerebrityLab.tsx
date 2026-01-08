
import React from 'react';
import { PageName } from '../types';

interface Props {
   onNavigate: (page: PageName) => void;
}

const CerebrityLab: React.FC<Props> = ({ onNavigate }) => {
   return (
      <div className="flex-1 bg-transparent relative overflow-hidden flex flex-col">
         {/* Tabs Superiores */}
         <nav className="px-6 pt-12 pb-4 flex gap-4 overflow-x-auto scrollbar-hide z-10 border-b border-slate-50/10">
            <button onClick={() => onNavigate(PageName.CerebritySynthesis)} className="neu-flat text-neu-sec px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shrink-0 active:scale-95 transition-all">Synthesis</button>
            <button onClick={() => onNavigate(PageName.CerebrityMakeMenu)} className="neu-flat text-neu-sec px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shrink-0 active:scale-95 transition-all">Make Menu</button>
            <button onClick={() => onNavigate(PageName.CerebrityCritic)} className="neu-flat text-neu-sec px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shrink-0 active:scale-95 transition-all">The Critic</button>
            <button onClick={() => onNavigate(PageName.CerebrityLab)} className="neu-pressed text-[#0891B2] px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shrink-0">The Lab</button>
            <button onClick={() => onNavigate(PageName.CerebrityTrend)} className="neu-flat text-neu-sec px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shrink-0 active:scale-95 transition-all">Trends</button>
         </nav>

         <header className="px-6 py-6 flex items-center justify-between z-10">
            <div>
               <h2 className="text-[9px] text-[#0891B2] font-black tracking-widest uppercase mb-1">Cerebrity Intelligence</h2>
               <h1 className="text-3xl font-black text-neu-main tracking-tight">The Lab</h1>
            </div>
            <div className="w-14 h-14 rounded-2xl neu-flat p-1 overflow-hidden">
               <img src="https://picsum.photos/seed/user-lab/100/100" className="w-full h-full rounded-xl object-cover grayscale" alt="User" />
            </div>
         </header>

         <main className="flex-1 overflow-y-auto scrollbar-hide px-6 py-2 space-y-8 pb-32 z-10">
            <div className="neu-flat rounded-[2.5rem] p-8 relative group overflow-hidden">
               <div className="absolute top-[-20px] right-[-20px] opacity-10 pointer-events-none">
                  <span className="material-symbols-outlined text-[100px] text-[#0891B2]">science</span>
               </div>
               <div className="flex justify-between items-start mb-6 relative z-10">
                  <span className="neu-pressed text-[#0891B2] text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-full bg-transparent">Processing v4</span>
                  <span className="text-[9px] font-mono text-neu-sec tracking-widest font-black uppercase">ID: #LAB-8842</span>
               </div>
               <h3 className="text-xl font-bold text-neu-main mb-2 relative z-10">Neural Compound V4</h3>
               <p className="text-xs text-neu-sec mb-8 leading-relaxed relative z-10 max-w-[90%]">Sintetizando potenciadores cognitivos para lógica de retención de memoria.</p>
               <div className="space-y-3 relative z-10">
                  <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-[#0891B2]">
                     <span>Synthesis Progression</span>
                     <span className="text-neu-main">78%</span>
                  </div>
                  <div className="h-4 w-full neu-pressed rounded-full overflow-hidden p-[3px]">
                     <div className="h-full bg-gradient-to-r from-[#06b6d4] to-[#3b82f6] w-[78%] rounded-full shadow-sm"></div>
                  </div>
               </div>
            </div>

            <section className="space-y-5">
               <h3 className="text-[10px] font-black text-neu-sec uppercase tracking-widest px-2">Ingredient Pool</h3>
               <div className="grid grid-cols-4 gap-3">
                  {[
                     { name: 'Alpha Leaf', icon: 'local_florist', color: 'purple' },
                     { name: 'Liquid N2', icon: 'water_drop', color: 'cyan', active: true },
                     { name: 'Synapse', icon: 'bolt', color: 'amber' },
                  ].map((ing, i) => (
                     <div key={i} className={`aspect-square rounded-2xl flex flex-col items-center justify-center p-2 relative group transition-all duration-300 cursor-pointer
                  ${ing.active ? 'neu-pressed' : 'neu-flat hover:scale-[1.02]'}`}>
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-1 ${ing.active ? 'text-[#0891B2] bg-cyan-100/50' : 'text-neu-sec'}`}>
                           <span className="material-symbols-outlined text-xl">{ing.icon}</span>
                        </div>
                        <span className={`text-[8px] font-black uppercase text-center leading-tight ${ing.active ? 'text-[#0891B2]' : 'text-neu-sec'}`}>{ing.name}</span>
                        {ing.active && <div className="absolute top-2 right-2 w-2 h-2 bg-[#0891B2] rounded-full shadow-[0_0_8px_rgba(8,145,178,0.5)]"></div>}
                     </div>
                  ))}
                  <button className="aspect-square rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-300 hover:border-[#0891B2] hover:text-[#0891B2] transition-all">
                     <span className="material-symbols-outlined text-2xl">add</span>
                  </button>
               </div>
            </section>

            <section className="neu-flat rounded-[2.5rem] p-6 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
                  <span className="material-symbols-outlined text-[80px]">analytics</span>
               </div>
               <h3 className="text-lg font-bold mb-6 relative z-10 flex items-center gap-2 text-neu-main">
                  Live Analysis <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></span>
               </h3>
               <div className="flex gap-3 h-32 items-end justify-between px-2 relative z-10">
                  {[40, 70, 50, 90, 60, 45].map((h, i) => (
                     <div key={i} className="flex-1 relative group cursor-pointer h-full flex flex-col justify-end">
                        <div style={{ height: `${h}%` }} className="bg-neu-pressed rounded-t-xl hover:bg-cyan-100 transition-all duration-500 relative">
                           <div className="absolute top-0 left-0 right-0 h-1 bg-[#0891B2] opacity-50"></div>
                        </div>
                        <span className="mt-3 text-[7px] font-black text-neu-sec uppercase tracking-widest text-center">
                           {['Bio', 'Neu', 'Syn', 'Chm', 'Phy', 'Atm'][i]}
                        </span>
                     </div>
                  ))}
               </div>
            </section>
         </main>

         <div className="absolute bottom-28 left-6 right-6 z-40 px-6">
            <button className="w-full py-5 rounded-2xl neu-btn text-[#0891B2] font-black text-sm uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-3">
               <span className="material-symbols-outlined text-lg">science</span>
               Execute Lab Scan
            </button>
         </div>
      </div>
   );
};

export default CerebrityLab;
