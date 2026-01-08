import React from 'react';
import { PageName } from '../types';
import NeuButton from '../components/NeuButton';

interface Props {
    onNavigate: (page: PageName) => void;
}

const CerebrityMakeMenu: React.FC<Props> = ({ onNavigate }) => {
    return (
        <div className="flex-1 bg-transparent relative overflow-hidden flex flex-col">
            {/* Tabs Superiores */}
            <header className="px-6 pt-6 pb-2">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-black text-[#6D28D9] tracking-tight">Cerebrity</h1>
                        <p className="text-[10px] font-black text-neu-sec uppercase tracking-[0.3em]">AI Protocol</p>
                    </div>
                    <NeuButton onClick={() => onNavigate(PageName.Dashboard)} className="w-10 h-10 rounded-xl text-neu-sec"><span className="material-symbols-outlined">close</span></NeuButton>
                </div>

                <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
                    <NeuButton onClick={() => onNavigate(PageName.CerebritySynthesis)} variant="flat" className="px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shrink-0 text-neu-sec">
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
                    <NeuButton onClick={() => { }} variant="pressed" className="px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shrink-0 text-[#6D28D9] bg-violet-50/50">
                        Make
                    </NeuButton>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto scrollbar-hide px-6 py-4 space-y-8 pb-32 z-10">
                <header>
                    <h1 className="text-3xl font-black text-neu-main leading-none">Menu Builder</h1>
                    <p className="text-[11px] text-neu-sec font-bold mt-2 uppercase tracking-widest">Ingeniería de Menús Proactiva</p>
                </header>

                {/* BCG Matrix / Menu Engineering Summary */}
                <section className="neu-flat rounded-[2.5rem] p-6 text-neu-main relative overflow-hidden">
                    <div className="grid grid-cols-2 gap-4 relative z-10">
                        <div className="neu-pressed rounded-2xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="w-2 h-2 rounded-full bg-[#10B981] shadow-sm"></span>
                                <span className="text-[8px] font-black uppercase text-neu-sec tracking-widest">Estrellas</span>
                            </div>
                            <p className="text-2xl font-black text-neu-main">12</p>
                        </div>
                        <div className="neu-pressed rounded-2xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="w-2 h-2 rounded-full bg-[#F59E0B] shadow-sm"></span>
                                <span className="text-[8px] font-black uppercase text-neu-sec tracking-widest">Caballos</span>
                            </div>
                            <p className="text-2xl font-black text-neu-main">8</p>
                        </div>
                    </div>
                    <button className="w-full mt-6 py-4 rounded-xl neu-btn text-[#6D28D9] font-black text-[9px] uppercase tracking-widest active:scale-95 transition-all">Optimizar Menú Activo</button>
                </section>

                {/* Secciones del Menú */}
                <section className="space-y-4">
                    <div className="flex justify-between items-center px-2">
                        <h3 className="text-[10px] font-black text-neu-sec uppercase tracking-widest">Carta Activa</h3>
                        <button className="w-10 h-10 rounded-full neu-btn flex items-center justify-center text-neu-sec active:scale-90 transition-all">
                            <span className="material-symbols-outlined text-sm">add</span>
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div className="neu-flat rounded-[1.75rem] p-4 flex items-center justify-between group cursor-pointer active:scale-[0.98] transition-all">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl neu-pressed flex items-center justify-center text-neu-sec">
                                    <span className="material-symbols-outlined">restaurant_menu</span>
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm text-neu-main">Entrantes de Verano</h4>
                                    <p className="text-[9px] text-neu-sec font-bold uppercase">6 Platos • Margen 68%</p>
                                </div>
                            </div>
                            <span className="material-symbols-outlined text-neu-sec">chevron_right</span>
                        </div>
                    </div>
                </section>

                {/* Recipe Pool */}
                <section className="neu-pressed rounded-[2.5rem] p-6">
                    <h3 className="text-[10px] font-black text-neu-sec uppercase tracking-widest mb-6">Recetario Disponibe</h3>
                    <div className="grid grid-cols-2 gap-4">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="neu-flat p-4 rounded-3xl flex flex-col items-center gap-3 active:scale-95 transition-all cursor-pointer">
                                <div className="w-full h-24 rounded-2xl neu-pressed p-1 overflow-hidden">
                                    <img src={`https://picsum.photos/seed/menu${i}/200/200`} className="w-full h-full object-cover rounded-xl opacity-80" alt="Receta" />
                                </div>
                                <span className="text-[10px] font-bold text-neu-main text-center leading-tight">Plato {i}</span>
                                <button className="w-full py-2.5 neu-btn text-[#6D28D9] rounded-xl text-[8px] font-black uppercase">Añadir</button>
                            </div>
                        ))}
                    </div>
                </section>
            </main>

            <button className="absolute bottom-28 right-8 w-16 h-16 neu-flat rounded-full flex items-center justify-center text-[#6D28D9] shadow-xl z-50 bg-[#EFEEEE]">
                <span className="material-symbols-outlined filled text-2xl">chat_bubble</span>
            </button>
        </div>
    );
};

export default CerebrityMakeMenu;
