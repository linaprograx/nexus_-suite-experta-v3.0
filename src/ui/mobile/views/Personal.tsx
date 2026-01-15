import React from 'react';
import { PageName, UserProfile } from '../types';
import { useApp } from '../../../context/AppContext';
import { signOut } from 'firebase/auth';
import { motion } from 'framer-motion';
import GlassCard from '../components/GlassCard';

interface Props {
    onNavigate: (page: PageName) => void;
    user?: UserProfile;
}

const MembershipCard: React.FC<{
    tier: string;
    level: number;
    xp: number;
    maxXp: number;
    label: string;
    gradient: string;
    isActive?: boolean;
    isPremium?: boolean;
}> = ({ tier, level, xp, maxXp, label, gradient, isActive, isPremium }) => (
    <motion.div
        whileTap={{ scale: 0.98 }}
        className="relative group cursor-pointer"
    >
        {isActive && (
            <motion.div
                animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.02, 1] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute -inset-2 rounded-[2rem] blur-xl opacity-50 z-0"
                style={{ background: gradient.split(' ')[1] }} // Use the second color of gradient for glow
            />
        )}
        <div className={`relative z-10 w-full rounded-[1.8rem] p-5 overflow-hidden shadow-xl border ${isActive ? 'border-white/20' : 'border-white/5 opacity-60'}`} style={{ background: gradient }}>
            {/* Shimmer effect */}
            <div className="absolute top-0 -left-[100%] w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-[-20deg] group-hover:left-[100%] transition-all duration-1000"></div>

            <div className="flex justify-between items-start mb-6">
                <div>
                    <p className="text-[7px] font-black text-white/40 uppercase tracking-[0.3em] mb-0.5">Nexus ID</p>
                    <div className="flex items-center gap-2">
                        <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Nivel</h4>
                        <span className="text-2xl font-black text-white leading-none">{level}</span>
                    </div>
                </div>
                <div className={`px-2 py-0.5 rounded-sm text-[7px] font-black uppercase tracking-widest ${isPremium ? 'bg-indigo-500 text-white' : 'bg-white/10 text-white/60'}`}>
                    {label}
                </div>
            </div>

            <div className="space-y-2">
                <div className="flex justify-between items-end">
                    <span className="text-[7px] font-black text-white/40 uppercase tracking-widest">{xp} / {maxXp} XP</span>
                    {isActive && <span className="text-[6px] font-black text-indigo-300 uppercase tracking-tighter">Click to Preview</span>}
                </div>
                <div className="h-1.5 w-full bg-black/20 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(xp / maxXp) * 100}%` }}
                        className={`h-full rounded-full ${isPremium ? 'bg-indigo-400 shadow-[0_0_10px_rgba(129,140,248,0.5)]' : 'bg-white/40'}`}
                    />
                </div>
            </div>

            {/* Background Icon Watermark */}
            <span className="material-symbols-outlined absolute -bottom-2 -right-2 text-6xl text-white/5 pointer-events-none rotate-12">
                {isPremium ? 'workspace_premium' : 'stat_0'}
            </span>
        </div>
    </motion.div>
);

const Personal: React.FC<Props> = ({ onNavigate, user }) => {
    const { auth, userPlan } = useApp();

    const handleLogout = async () => {
        if (auth) {
            await signOut(auth);
            onNavigate(PageName.Login);
        }
    };

    const COMMERCIAL_PLANS = [
        { tier: 'FREE', level: 1, xp: 0, maxXp: 100, label: 'Génesis', gradient: 'linear-gradient(135deg, #334155 0%, #0f172a 100%)', isPremium: false },
        { tier: 'PRO', level: 12, xp: 3450, maxXp: 5000, label: 'Ascendant', gradient: 'linear-gradient(135deg, #0891b2 0%, #1e1b4b 100%)', isPremium: true },
        { tier: 'EXPERT', level: 24, xp: 0, maxXp: 10000, label: 'Platinum', gradient: 'linear-gradient(135deg, #7c3aed 0%, #1e1b4b 100%)', isPremium: true }
    ];

    return (
        <div className="flex-1 bg-transparent relative overflow-hidden flex flex-col">
            <header className="px-6 pt-10 pb-4 flex items-center justify-between z-10">
                <button onClick={() => onNavigate(PageName.Dashboard)} className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white active:scale-90 transition-all">
                    <span className="material-symbols-outlined text-lg">arrow_back</span>
                </button>
                <h1 className="text-[10px] font-black text-white/20 uppercase tracking-[0.5em] ml-4">Personal</h1>
                <div className="flex gap-1.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]"></div>
                    <div className="h-1.5 w-1.5 rounded-full bg-white/10"></div>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto scrollbar-hide px-6 py-2 space-y-8 pb-32 z-10 no-scrollbar">

                {/* Jupiter Internal Pass Card - Master Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full aspect-[16/10] rounded-[2.5rem] p-8 relative overflow-hidden flex flex-col justify-between shadow-2xl border border-white/10"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-[#1a1c2e] via-[#2d1b4d] to-[#1a1c2e] z-0"></div>
                    {/* Animated Glows */}
                    <div className="absolute -top-20 -right-20 w-60 h-60 bg-indigo-500/20 blur-[100px] rounded-full animate-pulse"></div>
                    <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-purple-500/10 blur-[100px] rounded-full"></div>

                    <div className="relative z-10 flex justify-between items-start">
                        <div>
                            <p className="text-[8px] font-black text-indigo-400 uppercase tracking-[0.4em] mb-2">Nexus ID</p>
                            <h2 className="text-3xl font-black text-white uppercase tracking-tighter leading-[0.9]">Jupiter<br />Internal Pass</h2>
                        </div>
                        <div className="w-14 h-14 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white/40 shadow-inner">
                            <span className="material-symbols-outlined text-3xl">memory</span>
                        </div>
                    </div>

                    <div className="relative z-10 flex justify-between items-end">
                        <div className="space-y-4">
                            <div className="flex gap-6">
                                <div className="text-center">
                                    <p className="text-[7px] font-black text-white/30 uppercase tracking-widest mb-1">Recipes</p>
                                    <p className="text-lg font-black text-white">17</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-[7px] font-black text-white/30 uppercase tracking-widest mb-1">Avg. Score</p>
                                    <p className="text-lg font-black text-emerald-400">54%</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-[7px] font-black text-white/30 uppercase tracking-widest mb-1">Contrib</p>
                                    <p className="text-lg font-black text-white">4</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <p className="text-[7px] font-mono text-white/20 tracking-wider">ID: 884-291-NEX</p>
                                <div className="px-3 py-1 bg-indigo-500/20 border border-indigo-500/30 rounded-full text-[7px] font-black text-indigo-300 uppercase tracking-widest">
                                    Nexus Expert
                                </div>
                            </div>
                        </div>
                        <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[8px] font-black text-white/40 uppercase tracking-widest backdrop-blur-md">
                            Verified
                        </div>
                    </div>
                </motion.div>

                {/* Commercial Plans Stack */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center px-2">
                        <h3 className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em]">Planes Comerciales</h3>
                        <span className="text-[7px] font-bold text-indigo-400">EXPLORAR BENEFICIOS</span>
                    </div>

                    {/* Master Jupiter Card In List Style */}
                    <MembershipCard
                        tier="STUDIO"
                        level={99}
                        xp={9999}
                        maxXp={9999}
                        label="Jupiter"
                        gradient="linear-gradient(135deg, #c026d3 0%, #1e1b4b 100%)"
                        isActive={userPlan === 'STUDIO' || true}
                        isPremium={true}
                    />

                    {COMMERCIAL_PLANS.map((plan, i) => (
                        <MembershipCard
                            key={plan.tier}
                            tier={plan.tier}
                            level={plan.level}
                            xp={plan.xp}
                            maxXp={plan.maxXp}
                            label={plan.label}
                            gradient={plan.gradient}
                            isActive={userPlan === plan.tier}
                            isPremium={plan.isPremium}
                        />
                    ))}
                </div>

                {/* Dashboard Grid & Settings - Refined Style with Neon Glows */}
                <div className="grid grid-cols-2 gap-4">
                    <motion.div
                        whileTap={{ scale: 0.95 }}
                        className="bg-gradient-to-br from-indigo-900/40 to-slate-900/80 rounded-[2rem] p-6 border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.1)] h-44 flex flex-col justify-between"
                    >
                        <div className="w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400 shadow-inner">
                            <span className="material-symbols-outlined text-2xl">insights</span>
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-indigo-300 uppercase tracking-widest mb-1">Reciente</p>
                            <p className="text-sm font-bold text-white leading-tight">Blue Lagoon<br /><span className="text-white/40 font-medium">Update</span></p>
                        </div>
                    </motion.div>

                    <motion.div
                        whileTap={{ scale: 0.95 }}
                        className="bg-gradient-to-br from-emerald-900/40 to-slate-900/80 rounded-[2rem] p-6 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)] h-44 flex flex-col justify-between"
                    >
                        <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-400 shadow-inner">
                            <span className="material-symbols-outlined text-2xl">military_tech</span>
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-emerald-300 uppercase tracking-widest mb-1">Logro</p>
                            <p className="text-sm font-bold text-white leading-tight">Gin Master<br /><span className="text-white/40 font-medium">70% Complete</span></p>
                        </div>
                    </motion.div>
                </div>

                <div className="space-y-4 pt-4 pb-12">
                    <button
                        onClick={handleLogout}
                        className="w-full py-5 bg-white/5 border border-white/10 text-rose-400 rounded-[2rem] text-[9px] font-black uppercase tracking-[0.2em] active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-outlined !text-sm">logout</span>
                        Cerrar Sesión
                    </button>
                </div>

            </main>
            <style>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
};

export default Personal;
