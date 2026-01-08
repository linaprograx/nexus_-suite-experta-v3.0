import React from 'react';
import { PageName } from '../types';

interface Props {
    onNavigate: (page: PageName) => void;
}

const Colegium: React.FC<Props> = ({ onNavigate }) => {
    const modules = [
        { title: 'Neural Ethics 101', progress: 85, duration: '2h 15m', level: 'Basic', status: 'In Progress' },
        { title: 'Advanced Void Mechanics', progress: 30, duration: '12h 40m', level: 'Expert', status: 'Academic' },
        { title: 'The Human Interface', progress: 0, duration: '4h 20m', level: 'Intermediate', status: 'Locked' },
    ];

    return (
        <div className="flex-1 bg-transparent relative overflow-hidden flex flex-col pt-4">
            <header className="px-6 py-4 flex items-center justify-between z-10">
                <button onClick={() => onNavigate(PageName.Dashboard)} className="w-10 h-10 rounded-full neu-btn flex items-center justify-center text-neu-sec hover:text-neu-main transition-all">
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <div className="text-center">
                    <h2 className="text-[10px] text-[#6D28D9] font-black uppercase tracking-widest">Nexus System</h2>
                    <h1 className="text-xl font-bold text-neu-main">Colegium</h1>
                </div>
                <button className="w-10 h-10 rounded-full neu-btn flex items-center justify-center text-neu-sec hover:text-neu-main transition-all">
                    <span className="material-symbols-outlined">school</span>
                </button>
            </header>

            <main className="flex-1 overflow-y-auto scrollbar-hide px-6 py-4 space-y-8 pb-32 z-10">
                <div className="neu-flat rounded-[2.5rem] p-8 relative overflow-hidden text-neu-main group">
                    <div className="absolute top-[-20px] right-[-20px] opacity-[0.03] pointer-events-none">
                        <span className="material-symbols-outlined text-[140px]">menu_book</span>
                    </div>
                    <div className="relative z-10">
                        <span className="neu-pressed px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest text-[#6D28D9] mb-4 inline-block bg-transparent">Professional Path</span>
                        <h3 className="text-3xl font-black leading-tight mb-4 tracking-tight text-neu-main">Mastering the<br />Nexus Interface</h3>
                        <div className="flex items-center gap-4 text-neu-sec text-[10px] font-bold uppercase tracking-widest">
                            <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-sm">schedule</span> 14 Modules</span>
                            <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-sm">workspace_premium</span> 3 Certs</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-5">
                    <h3 className="text-xs font-black text-neu-sec uppercase tracking-widest px-1">Curriculum Modules</h3>
                    {modules.map((mod, i) => (
                        <div key={i} className={`neu-flat rounded-3xl p-6 relative overflow-hidden group transition-all
               ${mod.status === 'Locked' ? 'opacity-60 grayscale' : 'cursor-pointer active:scale-[0.99]'}`}>
                            <div className="flex justify-between items-start mb-5">
                                <div className="flex-1 pr-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-[9px] font-black text-[#6D28D9] uppercase tracking-widest">{mod.level}</span>
                                        <span className="text-neu-sec text-[9px]">•</span>
                                        <span className="text-[9px] font-black text-neu-sec uppercase tracking-widest">{mod.duration}</span>
                                    </div>
                                    <h4 className="font-bold text-neu-main text-lg leading-tight">{mod.title}</h4>
                                </div>
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${mod.status === 'Locked' ? 'neu-pressed text-neu-sec' : 'neu-btn text-[#6D28D9]'}`}>
                                    <span className="material-symbols-outlined">{mod.status === 'Locked' ? 'lock' : 'play_circle'}</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-neu-sec">
                                    <span>Progression</span>
                                    <span className="text-[#6D28D9]">{mod.progress}%</span>
                                </div>
                                <div className="h-2 w-full neu-pressed rounded-full overflow-hidden p-[2px]">
                                    <div style={{ width: `${mod.progress}%` }} className="h-full bg-[#6D28D9] rounded-full shadow-sm transition-all duration-1000"></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="neu-flat rounded-[2rem] p-6 text-center border-t-4 border-t-[#6D28D9]">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center text-[#6D28D9] mx-auto mb-4 neu-pressed">
                        <span className="material-symbols-outlined text-3xl">add_moderator</span>
                    </div>
                    <h4 className="text-neu-main font-bold text-lg mb-2">Request Advanced Access</h4>
                    <p className="text-sm text-neu-sec mb-6 leading-relaxed">Some academic modules require Tier 2 identity verification from your local Nexus node.</p>
                    <button className="w-full py-4 rounded-2xl neu-btn text-[#6D28D9] font-black text-xs uppercase tracking-widest active:scale-95 transition-all">Verify Now</button>
                </div>
            </main>
        </div>
    );
};

export default Colegium;
