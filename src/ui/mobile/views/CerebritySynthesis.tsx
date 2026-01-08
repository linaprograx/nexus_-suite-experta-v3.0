import React, { useState } from 'react';
import { PageName, UserProfile } from '../types';
import AnimatedPage from '../components/AnimatedPage';
import NeuCard from '../components/NeuCard';
import NeuButton from '../components/NeuButton';
import { motion } from 'framer-motion';

interface Props {
    onNavigate: (page: PageName) => void;
    user?: UserProfile;
    notify?: (msg: string, type?: 'success' | 'error' | 'loading') => void;
}

const CerebritySynthesis: React.FC<Props> = ({ onNavigate, notify }) => {
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

                <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
                    <NeuButton onClick={() => { }} variant="pressed" className="px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shrink-0 text-amber-500 bg-amber-50/50">
                        Synthesis
                    </NeuButton>
                    <NeuButton onClick={() => onNavigate(PageName.CerebrityCritic)} variant="flat" className="px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shrink-0 text-neu-sec">
                        Critic
                    </NeuButton>
                    <NeuButton onClick={() => onNavigate(PageName.CerebrityLab)} variant="flat" className="px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shrink-0 text-neu-sec">
                        Lab
                    </NeuButton>
                    <NeuButton onClick={() => onNavigate(PageName.CerebrityTrend)} variant="flat" className="px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shrink-0 text-neu-sec">
                        Trend
                    </NeuButton>
                    <NeuButton onClick={() => onNavigate(PageName.CerebrityMakeMenu)} variant="flat" className="px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shrink-0 text-neu-sec">
                        Make
                    </NeuButton>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto scrollbar-hide px-6 py-4 pb-32">
                {/* --- SYNTHESIS --- */}
                <div className="space-y-6">
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
                    <NeuButton className="w-full py-5 rounded-2xl bg-slate-900 text-white font-black text-[10px] uppercase tracking-[0.2em]" onClick={() => notify?.("Synthesizing...", 'loading')}>
                        Generate Concept
                    </NeuButton>
                </div>
            </main>

        </AnimatedPage>
    );
};

export default CerebritySynthesis;
