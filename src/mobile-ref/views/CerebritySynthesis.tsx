
import React, { useState } from 'react';
import { PageName, UserProfile } from '../types';
import AnimatedPage from '../components/AnimatedPage';
import NeuCard from '../components/NeuCard';
import NeuButton from '../components/NeuButton';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  onNavigate: (page: PageName) => void;
  user?: UserProfile;
  notify: (msg: string, type?: 'success' | 'error' | 'loading') => void;
}

type CerebrityTab = 'Synthesis' | 'Critic' | 'Lab' | 'Trend' | 'Make';

const CerebritySynthesis: React.FC<Props> = ({ onNavigate, notify }) => {
  const [activeTab, setActiveTab] = useState<CerebrityTab>('Synthesis');
  const tabs: CerebrityTab[] = ['Synthesis', 'Critic', 'Lab', 'Trend', 'Make'];

  const [inputQuery, setInputQuery] = useState('');

  return (
    <AnimatedPage className="bg-transparent relative overflow-hidden flex flex-col h-full">

      {/* Header with 5-Tab Navigation */}
      <header className="px-6 pt-6 pb-2">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-black text-amber-500 tracking-tight">Cerebrity</h1>
            <p className="text-[10px] font-black text-neu-sec uppercase tracking-[0.3em]">AI Protocol</p>
          </div>
          <NeuButton onClick={() => onNavigate(PageName.Dashboard)} className="w-10 h-10 rounded-xl text-neu-sec"><span className="material-symbols-outlined">close</span></NeuButton>
        </div>

        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest shrink-0 transition-all border-2
                            ${activeTab === tab
                  ? 'bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-200'
                  : 'bg-transparent text-neu-sec border-transparent hover:bg-black/5'}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto scrollbar-hide px-6 py-4 pb-32">
        <AnimatePresence mode="wait">

          {/* --- SYNTHESIS --- */}
          {activeTab === 'Synthesis' && (
            <motion.div key="Synthesis" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <NeuCard className="p-8 rounded-[2.5rem] flex flex-col justify-center text-center border-2 border-transparent focus-within:border-amber-500/50 transition-colors">
                <span className="material-symbols-outlined text-6xl text-amber-500 opacity-20 mb-6">auto_awesome</span>
                <h3 className="text-lg font-black text-neu-main mb-2">Synthesis Engine</h3>
                <input
                  type="text"
                  className="w-full text-center bg-transparent text-xl font-bold text-neu-main placeholder-neu-sec outline-none border-b-2 border-dashed border-neu-sec/20 pb-2 focus:border-amber-500"
                  placeholder="e.g., Spicy Mezcal..."
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                />
              </NeuCard>
              <NeuButton className="w-full py-5 rounded-2xl bg-slate-900 text-white font-black text-[10px] uppercase tracking-[0.2em]" onClick={() => notify("Synthesizing...")}>
                Generate Concept
              </NeuButton>
            </motion.div>
          )}

          {/* --- CRITIC --- */}
          {activeTab === 'Critic' && (
            <motion.div key="Critic" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <NeuCard className="p-8 rounded-[2.5rem] bg-rose-50 border-l-4 border-rose-500">
                <h2 className="text-2xl font-black text-rose-500 mb-2">The Critic</h2>
                <p className="text-xs font-medium text-slate-600 mb-6">Upload a menu or recipe for ruthless feedback.</p>
                <NeuButton className="w-full py-4 bg-white text-rose-500 font-bold uppercase text-[10px] tracking-widest">
                  Upload for Review
                </NeuButton>
              </NeuCard>
            </motion.div>
          )}

          {/* --- LAB --- */}
          {activeTab === 'Lab' && (
            <motion.div key="Lab" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <NeuCard className="p-8 rounded-[2.5rem] bg-emerald-50 border-emerald-500 border-2 border-dashed">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-2xl font-black text-emerald-600">The Lab</h2>
                  <span className="material-symbols-outlined text-emerald-600 text-3xl">science</span>
                </div>
                <p className="text-xs font-medium text-slate-600">Experimental flavor combinations and molecule mapping.</p>
              </NeuCard>
              <NeuButton className="w-full py-5 rounded-2xl text-emerald-600 font-black text-[10px] uppercase tracking-[0.2em]" variant="pressed" onClick={() => notify("Lab Mode Active")}>
                Start Experiment
              </NeuButton>
            </motion.div>
          )}

          {/* --- TREND --- */}
          {activeTab === 'Trend' && (
            <motion.div key="Trend" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <h3 className="text-[10px] font-black text-neu-sec uppercase tracking-widest pl-2">Global Signals</h3>
              {[1, 2, 3].map(i => (
                <NeuCard key={i} className="p-4 rounded-2xl flex items-center gap-4">
                  <span className="text-2xl font-black text-amber-500">#{i}</span>
                  <div>
                    <h4 className="font-bold text-neu-main text-sm">Fermented Honey</h4>
                    <span className="text-[9px] font-bold text-neu-sec uppercase">+45% Vol</span>
                  </div>
                </NeuCard>
              ))}
            </motion.div>
          )}

          {/* --- MAKE --- */}
          {activeTab === 'Make' && (
            <motion.div key="Make" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <NeuCard className="p-8 rounded-[2.5rem] bg-indigo-50 border-l-4 border-indigo-500">
                <h2 className="text-2xl font-black text-indigo-500 mb-2">Make Menu</h2>
                <p className="text-xs font-medium text-slate-600">Compile synthesized items into a final menu layout.</p>
              </NeuCard>
              <div className="grid grid-cols-2 gap-4">
                <NeuCard className="h-32 rounded-3xl neu-pressed flex items-center justify-center">
                  <span className="material-symbols-outlined text-3xl text-neu-sec opacity-40">add</span>
                </NeuCard>
                <NeuCard className="h-32 rounded-3xl neu-pressed flex items-center justify-center">
                  <span className="material-symbols-outlined text-3xl text-neu-sec opacity-40">add</span>
                </NeuCard>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

    </AnimatedPage>
  );
};

export default CerebritySynthesis;
