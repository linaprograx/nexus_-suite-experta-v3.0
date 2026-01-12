import React from 'react';
import { PageName, UserProfile } from '../types';
import { useApp } from '../../../context/AppContext';
import { signOut } from 'firebase/auth';

interface Props {
    onNavigate: (page: PageName) => void;
    user?: UserProfile;
}

const Personal: React.FC<Props> = ({ onNavigate, user }) => {
    const { auth } = useApp();

    const handleLogout = async () => {
        if (auth) {
            await signOut(auth);
            // MobileShell will handle redirect, but we can nudge it
            onNavigate(PageName.Login);
        }
    };

    return (
        <div className="flex-1 bg-transparent relative overflow-hidden flex flex-col">
            <header className="px-6 pt-10 pb-4 flex items-center justify-between z-10">
                <button onClick={() => onNavigate(PageName.Dashboard)} className="w-10 h-10 rounded-2xl neu-btn flex items-center justify-center text-neu-sec hover:text-neu-main active:scale-90 transition-all">
                    <span className="material-symbols-outlined text-lg">arrow_back</span>
                </button>
                <h1 className="text-xl font-black text-slate-700 uppercase tracking-widest">Personal</h1>
                <div className="flex gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-slate-400"></div>
                    <div className="h-1.5 w-1.5 rounded-full bg-slate-300"></div>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto scrollbar-hide px-6 py-2 space-y-6 pb-32 z-10">

                {/* Jupiter Internal Pass Card - Premium Glass Style */}
                <div className="w-full aspect-[4/5] rounded-[2.5rem] p-8 relative overflow-hidden flex flex-col justify-between shadow-2xl">
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 z-0"></div>
                    {/* Glass Shine */}
                    <div className="absolute -top-[50%] -left-[50%] w-[200%] h-[200%] bg-white/5 rotate-45 pointer-events-none blur-3xl"></div>

                    {/* Top Header */}
                    <div className="relative z-10 flex justify-between items-start">
                        <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1">Nexus ID</p>
                            <h2 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">Jupiter<br />Internal Pass</h2>
                        </div>
                        <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-lg">
                            <span className="material-symbols-outlined text-3xl">qr_code_2</span>
                        </div>
                    </div>

                    {/* Stats Row */}
                    <div className="relative z-10 flex justify-between px-2">
                        <div className="text-center">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">Recipes</p>
                            <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto backdrop-blur-sm">
                                <p className="text-xl font-black text-white">15</p>
                            </div>
                        </div>
                        <div className="text-center">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">Avg. Score</p>
                            <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto backdrop-blur-sm">
                                <p className="text-xl font-black text-emerald-400">54%</p>
                            </div>
                        </div>
                        <div className="text-center">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">Contrib</p>
                            <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto backdrop-blur-sm">
                                <p className="text-xl font-black text-white">4</p>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Footer */}
                    <div className="relative z-10">
                        <div className="flex justify-between items-end mb-4">
                            <div>
                                <p className="text-[8px] font-mono text-slate-400 mb-2">ID: 884-291-NEX</p>
                                <span className="bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-2 rounded-lg text-[9px] font-black text-white uppercase tracking-widest shadow-lg shadow-cyan-500/20">Nexus Expert</span>
                            </div>
                            <span className="bg-white/10 backdrop-blur border border-white/10 text-slate-300 px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest">Verified</span>
                        </div>
                    </div>
                </div>

                {/* Dashboard Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white rounded-[2rem] p-5 flex flex-col justify-between h-44 shadow-sm border border-slate-100">
                        <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500 mb-2">
                            <span className="material-symbols-outlined">monitoring</span>
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Recent Activity</p>
                            <p className="text-sm font-bold text-slate-800 leading-tight">Created recipe "Blue Lagoon"</p>
                            <p className="text-[9px] text-slate-400 mt-2">2 hours ago</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-[2rem] p-5 flex flex-col justify-between h-44 shadow-sm border border-slate-100">
                        <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500 mb-2">
                            <span className="material-symbols-outlined">military_tech</span>
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Next Goal</p>
                            <p className="text-sm font-bold text-slate-800 leading-tight">Master of Gin</p>
                            <div className="w-full h-2 bg-slate-100 rounded-full mt-3 overflow-hidden">
                                <div className="w-[70%] h-full bg-blue-500 rounded-full shadow-sm"></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Strategic Action */}
                <div className="bg-white rounded-[2rem] p-6 flex items-center justify-between shadow-sm border border-slate-100">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500">
                            <span className="material-symbols-outlined">inventory</span>
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-800 text-sm">Stock Audit</h4>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Pending Review</p>
                        </div>
                    </div>
                    <button className="w-12 h-12 rounded-xl bg-slate-50 text-slate-400 hover:text-emerald-500 transition-colors flex items-center justify-center active:scale-90">
                        <span className="material-symbols-outlined">arrow_forward</span>
                    </button>
                </div>

                {/* Master Tip */}
                <div className="relative overflow-hidden rounded-[2rem] p-8 bg-slate-900 text-white shadow-xl">
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-black z-0"></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="material-symbols-outlined text-amber-400 text-lg">lightbulb</span>
                            <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest">Master Tip</span>
                        </div>
                        <p className="text-sm font-medium italic text-slate-200 leading-relaxed">"El hielo es el alma del cóctel. Nunca subestimes la importancia de la dilución controlada y la temperatura perfecta."</p>
                        <div className="flex items-center gap-3 mt-6">
                            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-black text-slate-400">JD</div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">John Doe, Mixologist</span>
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

                        {/* Logout Button */}
                        <button
                            onClick={handleLogout}
                            className="w-full mt-8 neu-btn text-rose-500 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined text-sm">logout</span>
                            Log Out
                        </button>
                    </div>
                </section>

            </main>
        </div>
    );
};

export default Personal;
