
import React from 'react';
import { PageName } from '../types';

interface Props {
   onNavigate: (page: PageName) => void;
}

const CerebrityTrend: React.FC<Props> = ({ onNavigate }) => {
   const trends = [
      { title: 'Cyber-Organic Fusion', volume: '1.2M', growth: '+24%', tags: ['Future', 'Design'], color: 'pink' },
      { title: 'Neural Interfaces', volume: '840K', growth: '+12%', tags: ['Tech', 'Bio'], color: 'rose' },
      { title: 'Sustainable Voidtech', volume: '420K', growth: '+8%', tags: ['Eco', 'Industrial'], color: 'fuchsia' },
   ];

   return (
      <div className="flex-1 bg-transparent relative overflow-hidden flex flex-col pt-4">

         <nav className="px-6 pt-12 pb-4 flex gap-4 overflow-x-auto scrollbar-hide z-10 border-b border-slate-50/10">
            <button onClick={() => onNavigate(PageName.CerebritySynthesis)} className="neu-flat text-neu-sec px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shrink-0 active:scale-95 transition-all">Synthesis</button>
            <button onClick={() => onNavigate(PageName.CerebrityMakeMenu)} className="neu-flat text-neu-sec px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shrink-0 active:scale-95 transition-all">Make Menu</button>
            <button onClick={() => onNavigate(PageName.CerebrityCritic)} className="neu-flat text-neu-sec px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shrink-0 active:scale-95 transition-all">The Critic</button>
            <button onClick={() => onNavigate(PageName.CerebrityLab)} className="neu-flat text-neu-sec px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shrink-0 active:scale-95 transition-all">The Lab</button>
            <button onClick={() => onNavigate(PageName.CerebrityTrend)} className="neu-pressed text-[#ec4899] px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shrink-0">Trends</button>
         </nav>

         <main className="flex-1 overflow-y-auto scrollbar-hide px-6 py-6 space-y-8 pb-32 z-10 pt-2">
            <div className="neu-flat rounded-[2.5rem] p-8 relative overflow-hidden text-neu-main">
               <div className="absolute top-[-20px] right-[-20px] opacity-10 pointer-events-none">
                  <span className="material-symbols-outlined text-[120px] text-[#ec4899]">trending_up</span>
               </div>
               <h3 className="text-4xl font-black text-neu-main leading-none mb-3">Global<br />Pulse</h3>
               <p className="text-xs text-neu-sec mb-8 max-w-[70%] font-medium">Tracking aesthetic shifts and technical breakthroughs in real-time.</p>
               <button className="neu-btn text-[#ec4899] px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-wider active:scale-95 transition-all">Start Scanning</button>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="neu-pressed rounded-3xl p-5">
                  <span className="text-[9px] font-black text-[#ec4899] uppercase tracking-widest">Engagement</span>
                  <p className="text-2xl font-black text-neu-main mt-2">4.2B</p>
                  <div className="h-2 w-full bg-slate-200/50 rounded-full mt-4 overflow-hidden">
                     <div className="h-full w-[70%] bg-[#ec4899] rounded-full shadow-sm"></div>
                  </div>
               </div>
               <div className="neu-pressed rounded-3xl p-5">
                  <span className="text-[9px] font-black text-[#ec4899] uppercase tracking-widest">Active nodes</span>
                  <p className="text-2xl font-black text-neu-main mt-2">12.8K</p>
                  <div className="h-2 w-full bg-slate-200/50 rounded-full mt-4 overflow-hidden">
                     <div className="h-full w-[45%] bg-[#ec4899] rounded-full shadow-sm"></div>
                  </div>
               </div>
            </div>

            <div className="space-y-4">
               <h3 className="text-xs font-black text-neu-sec uppercase tracking-widest px-1">Trending Topics</h3>
               {trends.map((trend, i) => (
                  <div key={i} className="neu-flat rounded-3xl p-6 flex items-center justify-between group active:scale-[0.98] transition-all cursor-pointer">
                     <div className="flex-1">
                        <h4 className="font-bold text-neu-main text-lg leading-tight mb-3">{trend.title}</h4>
                        <div className="flex gap-2">
                           {trend.tags.map(tag => (
                              <span key={tag} className="text-[8px] font-black uppercase tracking-wider neu-pressed text-[#ec4899] px-3 py-1.5 rounded-lg bg-transparent">
                                 {tag}
                              </span>
                           ))}
                        </div>
                     </div>
                     <div className="text-right">
                        <p className="text-xl font-black text-neu-main">{trend.volume}</p>
                        <p className="text-[9px] font-bold text-[#10B981] mt-1">{trend.growth}</p>
                     </div>
                  </div>
               ))}
            </div>
         </main>
      </div>
   );
};

export default CerebrityTrend;
