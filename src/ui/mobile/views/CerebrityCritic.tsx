import React from 'react';
import { PageName } from '../types';
import NeuButton from '../components/NeuButton';

interface Props {
    onNavigate: (page: PageName) => void;
}

const CerebrityCritic: React.FC<Props> = ({ onNavigate }) => {
    return (
        <div className="flex-1 bg-transparent relative overflow-hidden flex flex-col">

            <header className="px-6 pt-6 pb-2">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-black text-[#EA580C] tracking-tight">Cerebrity</h1>
                        <p className="text-[10px] font-black text-neu-sec uppercase tracking-[0.3em]">AI Protocol</p>
                    </div>
                    <NeuButton onClick={() => onNavigate(PageName.Dashboard)} className="w-10 h-10 rounded-xl text-neu-sec"><span className="material-symbols-outlined">close</span></NeuButton>
                </div>

                <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
                    <NeuButton onClick={() => onNavigate(PageName.CerebritySynthesis)} variant="flat" className="px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shrink-0 text-neu-sec">
                        Synthesis
                    </NeuButton>
                    <NeuButton onClick={() => { }} variant="pressed" className="px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shrink-0 text-[#EA580C] bg-orange-50/50">
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

            <main className="flex-1 overflow-y-auto scrollbar-hide px-6 py-6 space-y-8 pb-32 z-10 pt-2">
                {/* Panel Configuración Michelin */}
                <section className="neu-flat rounded-[2.5rem] p-8 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <span className="material-symbols-outlined text-[100px] text-[#EA580C]">rate_review</span>
                    </div>
                    <h3 className="text-[10px] font-black text-neu-sec uppercase tracking-[0.2em] mb-6">Configuración</h3>
                    <div className="space-y-6">
                        <div>
                            <label className="text-[9px] font-black text-neu-sec uppercase tracking-widest mb-4 block">Perfil del Crítico</label>
                            <div className="neu-pressed rounded-2xl p-4 flex justify-between items-center text-neu-main cursor-pointer active:scale-98 transition-all">
                                <span className="font-bold text-xs flex items-center gap-2">
                                    Inspector Michelin <span className="text-[#EA580C]">★</span>
                                </span>
                                <span className="material-symbols-outlined text-neu-sec">expand_more</span>
                            </div>
                            <p className="text-[8px] text-neu-sec font-bold mt-3 ml-1 opacity-70">Define la personalidad y severidad del análisis.</p>
                        </div>
                    </div>
                </section>

                {/* Estado Espera Material */}
                <div className="flex flex-col items-center justify-center py-6 text-center">
                    <div className="w-16 h-16 neu-pressed rounded-2xl flex items-center justify-center text-[#EA580C] mb-6">
                        <span className="material-symbols-outlined text-3xl">edit_note</span>
                    </div>
                    <h3 className="text-xl font-black text-neu-main mb-2">Esperando Material</h3>
                    <p className="text-xs text-neu-sec max-w-[70%] leading-relaxed font-medium">
                        Sube tu menú o escribe su contenido en el panel derecho para recibir un análisis profesional.
                    </p>
                </div>

                {/* Actions Section */}
                <section className="neu-pressed rounded-[2.5rem] p-6">
                    <h3 className="text-[11px] font-black text-neu-main uppercase tracking-widest mb-1">The Critic Eye</h3>
                    <p className="text-[9px] text-neu-sec font-bold mb-6 uppercase">Sube tu material para análisis</p>

                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { icon: 'search', label: 'Alérgenos', delay: 0 },
                            { icon: 'palette', label: 'Diseño', delay: 100 },
                            { icon: 'payments', label: 'Precios', delay: 200 },
                            { icon: 'spellcheck', label: 'Textos', delay: 300 }
                        ].map((btn, i) => (
                            <button key={i} className="neu-flat py-4 px-4 rounded-2xl flex items-center gap-3 text-[9px] font-black text-neu-main uppercase tracking-tight active:scale-95 transition-all">
                                <span className="material-symbols-outlined text-sm text-[#EA580C]">{btn.icon}</span>
                                {btn.label}
                            </button>
                        ))}
                    </div>
                </section>
            </main>

            <button className="absolute bottom-28 right-8 w-16 h-16 neu-btn rounded-full flex items-center justify-center text-[#EA580C] z-50 bg-[#EFEEEE]">
                <span className="material-symbols-outlined filled text-2xl">chat_bubble</span>
            </button>
        </div>
    );
};

export default CerebrityCritic;
