import React, { useState, useRef, useEffect } from 'react';
import { PageName, UserProfile } from '../types';
import { useApp } from '../../../context/AppContext';
import { useUI } from '../../../context/UIContext';
import { signOut } from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
    onNavigate: (page: PageName) => void;
    user?: UserProfile;
}

// --- SUB-COMPONENTS ---

/* 1. MEMBERSHIP FLIP CARD - Adjusted Height */
const MembershipFlipCard: React.FC<{
    tier: string;
    level: string;
    price: string;
    features: string[];
    gradient: string;
    isActive?: boolean;
    description?: string;
    onEvolve?: () => void;
}> = ({ tier, level, price, features = [], gradient, isActive, description, onEvolve }) => {
    const [isFlipped, setIsFlipped] = useState(false);

    return (
        <div className="relative w-full aspect-[16/9] perspective-[1000px] mb-4 group" onClick={() => setIsFlipped(!isFlipped)}>
            <motion.div
                className="w-full h-full relative preserve-3d transition-all duration-700"
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                style={{ transformStyle: 'preserve-3d' }}
            >
                {/* FRONT */}
                <div
                    className="absolute inset-0 backface-hidden rounded-[2rem] p-6 flex flex-col justify-between shadow-xl border border-white/10 overflow-hidden"
                    style={{ background: gradient }}
                >
                    {isActive && (
                        <div className="absolute top-4 right-4 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[8px] font-black text-white uppercase tracking-widest border border-white/10">
                            Plan Actual
                        </div>
                    )}
                    <div className="mt-2">
                        <p className="text-[8px] font-black text-white/40 uppercase tracking-[0.3em] mb-1">Membership</p>
                        <h2 className="text-3xl font-black text-white uppercase tracking-tighter leading-[0.9]">{tier}</h2>
                        <p className="text-xs font-bold text-white/60 mt-1">{level}</p>
                    </div>
                    <div className="flex justify-between items-end">
                        <span className="material-symbols-outlined text-4xl text-white/10">verified</span>
                        <span className="text-[8px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-1">
                            <span className="material-symbols-outlined text-[10px]">touch_app</span> Info
                        </span>
                    </div>
                </div>

                {/* BACK */}
                <div
                    className="absolute inset-0 backface-hidden rounded-[2rem] p-5 flex flex-col justify-between shadow-xl border border-white/10 overflow-hidden bg-slate-900 rotate-y-180"
                    style={{ transform: 'rotateY(180deg)' }}
                >
                    <div>
                        <div className="flex justify-between items-end mb-3 border-b border-white/10 pb-2">
                            <h3 className="text-lg font-bold text-white">{tier}</h3>
                            <h3 className="text-xl font-black text-white">{price}</h3>
                        </div>
                        <p className="text-[10px] text-white/70 mb-3 leading-tight font-medium">
                            {description || "Acceso profesional para creadores."}
                        </p>
                        <ul className="space-y-1.5">
                            {features.slice(0, 3).map((feat, i) => (
                                <li key={i} className="flex items-center gap-2 text-white/80 text-[10px] font-bold">
                                    <span className="material-symbols-outlined text-[12px] text-emerald-400">check</span>
                                    {feat}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onEvolve && onEvolve();
                        }}
                        className="w-full py-4 bg-white text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-slate-200 transition-colors shadow-lg"
                    >
                        {isActive ? 'Gestionar' : 'Evolucionar'}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

/* 2. MAIN VIEW */
const Personal: React.FC<Props> = ({ onNavigate, user }) => {
    // Hooks
    const { auth, userProfile: globalUserProfile } = useApp();
    const { theme, setTheme, compactMode, toggleCompactMode } = useUI();
    const [activeTab, setActiveTab] = useState<'profile' | 'memberships' | 'consciousness' | 'settings'>('profile');

    // Effective User Data (Merge prop with global context for PhotoURL stability)
    const effectiveUser = { ...user, ...globalUserProfile };
    const initialPhoto = effectiveUser?.photoURL || user?.photoURL;

    // Profile Edit State
    const [isEditing, setIsEditing] = useState(false);
    const [displayName, setDisplayName] = useState(effectiveUser?.displayName || 'Arquitecto');
    const [jobTitle, setJobTitle] = useState(effectiveUser?.role || 'Bar Manager');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Mock Settings State
    const [notifications, setNotifications] = useState(true);
    const [sounds, setSounds] = useState(true);
    const [twoFactor, setTwoFactor] = useState(true);

    const handleLogout = async () => {
        if (auth) {
            await signOut(auth);
            onNavigate(PageName.Login);
        }
    };

    const handleAvatarClick = () => {
        if (isEditing) {
            fileInputRef.current?.click();
        }
    };

    const TABS = [
        { id: 'profile', label: 'Perfil' },
        { id: 'memberships', label: 'Membresías' },
        { id: 'consciousness', label: 'Consciencia' },
        { id: 'settings', label: 'Ajustes' },
    ];

    return (
        <div className={`flex-1 relative overflow-hidden flex flex-col h-full transition-colors duration-300 ${theme === 'dark' ? 'bg-[#0f172a]' : 'bg-slate-50'}`}>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" />

            {/* A. HEADER & NAV */}
            <header className={`px-6 pt-10 pb-2 z-10 shadow-[0_4px_30px_rgba(0,0,0,0.02)] rounded-b-[2.5rem] transition-colors duration-300 ${theme === 'dark' ? 'bg-[#1e293b]' : 'bg-white'}`}>
                {/* User Context */}
                <div className="flex items-center gap-4 mb-6">
                    <div
                        onClick={handleAvatarClick}
                        className={`w-14 h-14 rounded-full p-[2px] bg-gradient-to-tr from-indigo-500 to-purple-500 shadow-md ${isEditing ? 'cursor-pointer animate-pulse' : ''}`}
                    >
                        <div className={`w-full h-full rounded-full flex items-center justify-center overflow-hidden border-2 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-white'}`}>
                            {initialPhoto ? (
                                <img src={initialPhoto} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-lg font-bold text-indigo-600">{displayName.charAt(0)}</span>
                            )}
                        </div>
                    </div>
                    <div>
                        <h1 className={`text-lg font-bold leading-tight transition-colors ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{displayName}</h1>
                        <p className={`text-xs font-medium transition-colors ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{jobTitle}</p>
                    </div>
                    <div className="ml-auto">
                        <button
                            onClick={() => setIsEditing(!isEditing)}
                            className={`p-2 rounded-full transition-colors ${isEditing
                                ? 'bg-indigo-100 text-indigo-600'
                                : (theme === 'dark' ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-400')}`}
                        >
                            <span className="material-symbols-outlined text-xl">edit</span>
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 no-scrollbar">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${activeTab === tab.id
                                ? (theme === 'dark' ? 'bg-indigo-500 text-white shadow-lg' : 'bg-slate-900 text-white shadow-lg')
                                : (theme === 'dark' ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-400 hover:bg-slate-200')
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </header>

            {/* B. CONTENT AREA */}
            <main className="flex-1 overflow-y-auto scrollbar-hide px-5 py-6 pb-32 z-10">
                <AnimatePresence mode="wait">

                    {/* 1. PROFILE VIEW */}
                    {activeTab === 'profile' && (
                        <motion.div
                            key="profile"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            className="space-y-6"
                        >
                            {isEditing && (
                                <div className={`p-4 rounded-2xl shadow-sm border mb-4 animate-in fade-in slide-in-from-top-4 ${theme === 'dark' ? 'bg-[#1e293b] border-slate-700' : 'bg-white border-slate-100'}`}>
                                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">Nombre Visible</label>
                                    <input
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        className={`w-full border rounded-xl p-3 text-sm font-bold mb-4 focus:outline-none focus:border-indigo-500 transition-colors ${theme === 'dark' ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                                    />
                                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">Cargo / Título</label>
                                    <input
                                        value={jobTitle}
                                        onChange={(e) => setJobTitle(e.target.value)}
                                        className={`w-full border rounded-xl p-3 text-sm font-bold focus:outline-none focus:border-indigo-500 transition-colors ${theme === 'dark' ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                                    />
                                </div>
                            )}

                            {/* Jupiter Internal Pass - Hero */}
                            <div className="relative w-full aspect-[16/9] rounded-[2rem] p-6 overflow-hidden shadow-[0_20px_40px_-10px_rgba(124,58,237,0.3)] bg-gradient-to-br from-[#2e1065] via-[#4c1d95] to-[#581c87] text-white">
                                <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/30 blur-[60px] rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
                                <div className="relative z-10 flex justify-between items-start mb-6">
                                    <div>
                                        <p className="text-[9px] font-black text-white/50 uppercase tracking-[0.2em] mb-1">Nexus ID</p>
                                        <h2 className="text-3xl font-black text-white uppercase tracking-tight leading-none">Jupiter<br /><span className="text-purple-300">Internal</span></h2>
                                    </div>
                                    <span className="material-symbols-outlined text-4xl text-white/20">verified_user</span>
                                </div>
                                <div className="relative z-10 grid grid-cols-3 gap-4 border-t border-white/10 pt-4 mt-auto">
                                    <div><p className="text-[8px] font-bold text-purple-200 uppercase tracking-wider mb-1">Recipes</p><p className="text-xl font-black text-white">17</p></div>
                                    <div><p className="text-[8px] font-bold text-purple-200 uppercase tracking-wider mb-1">Score</p><p className="text-xl font-black text-emerald-400">98%</p></div>
                                    <div><p className="text-[8px] font-bold text-purple-200 uppercase tracking-wider mb-1">Modo</p><p className="text-xl font-black text-white">God</p></div>
                                </div>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className={`p-5 rounded-[2rem] shadow-sm border ${theme === 'dark' ? 'bg-[#1e293b] border-slate-700' : 'bg-white border-slate-100'}`}>
                                    <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500 mb-3"><span className="material-symbols-outlined">military_tech</span></div>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Logros</p>
                                    <p className={`text-2xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>24</p>
                                </div>
                                <div className={`p-5 rounded-[2rem] shadow-sm border ${theme === 'dark' ? 'bg-[#1e293b] border-slate-700' : 'bg-white border-slate-100'}`}>
                                    <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 mb-3"><span className="material-symbols-outlined">local_fire_department</span></div>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Racha</p>
                                    <p className={`text-2xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>12 días</p>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* 2. MEMBERSHIPS VIEW */}
                    {activeTab === 'memberships' && (
                        <motion.div
                            key="memberships"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            className="space-y-4"
                        >
                            {/* Jupiter Internal (Current User) */}
                            <MembershipFlipCard
                                tier="Jupiter Internal"
                                level="Developer Access"
                                price="N/A"
                                features={['Acceso Total', 'Debug Mode', 'Unlimited Resources']}
                                gradient="linear-gradient(135deg, #4f46e5 0%, #0f172a 100%)"
                                isActive={true}
                                description="Acceso maestro para desarrolladores y administradores del sistema."
                            />

                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2 pt-4">Planes Comerciales</h3>

                            <MembershipFlipCard
                                tier="Génesis"
                                level="Basic Access"
                                price="Free"
                                features={['Acceso a Recetas', 'Modo Lectura', 'Comunidad Global']}
                                gradient="linear-gradient(135deg, #64748b 0%, #334155 100%)"
                                description="El punto de partida ideal para explorar el universo Nexus."
                            />
                            <MembershipFlipCard
                                tier="Ascendant"
                                level="Pro Access"
                                price="$24.99"
                                features={['Creación Ilimitada', 'IA Básica', 'Exportación PDF']}
                                gradient="linear-gradient(135deg, #0891b2 0%, #164e63 100%)"
                                description="Herramientas profesionales para mixólogos en ascenso."
                            />
                            <MembershipFlipCard
                                tier="Platinum"
                                level="Expert Access"
                                price="$99.99"
                                features={['IA Avanzada', 'Análisis de Mercado', 'Soporte Prioritario', 'Multi-dispositivo']}
                                gradient="linear-gradient(135deg, #be185d 0%, #881337 100%)"
                                description="Potencia total para líderes de barra y consultores."
                            />
                            <MembershipFlipCard
                                tier="Jupiter"
                                level="Elite Access"
                                price="$149.99"
                                features={['Nexus Core Unlocked', 'Personal AI Model', 'White Label', 'API Access']}
                                gradient="linear-gradient(135deg, #7c3aed 0%, #4c1d95 100%)"
                                description="La experiencia definitiva sin límites."
                            />
                        </motion.div>
                    )}

                    {/* 3. SETTINGS VIEW */}
                    {activeTab === 'settings' && (
                        <motion.div
                            key="settings"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                        >
                            <div className={`rounded-[2rem] p-2 shadow-sm border mb-6 ${theme === 'dark' ? 'bg-[#1e293b] border-slate-700' : 'bg-white border-slate-100'}`}>
                                {/* Toggles */}
                                <div className={`flex items-center justify-between p-4 border-b ${theme === 'dark' ? 'border-slate-700' : 'border-slate-50'}`}>
                                    <span className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-700'}`}>Modo Oscuro</span>
                                    <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className={`w-11 h-6 rounded-full relative transition-colors ${theme === 'dark' ? 'bg-indigo-500' : 'bg-slate-200'}`}><div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all shadow-sm ${theme === 'dark' ? 'left-6' : 'left-1'}`} /></button>
                                </div>
                                <div className={`flex items-center justify-between p-4 border-b ${theme === 'dark' ? 'border-slate-700' : 'border-slate-50'}`}>
                                    <span className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-700'}`}>Modo Compacto</span>
                                    <button onClick={() => toggleCompactMode()} className={`w-11 h-6 rounded-full relative transition-colors ${compactMode ? 'bg-indigo-500' : 'bg-slate-200'}`}><div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all shadow-sm ${compactMode ? 'left-6' : 'left-1'}`} /></button>
                                </div>
                                <div className={`flex items-center justify-between p-4 border-b ${theme === 'dark' ? 'border-slate-700' : 'border-slate-50'}`}>
                                    <span className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-700'}`}>Notificaciones</span>
                                    <button onClick={() => setNotifications(!notifications)} className={`w-11 h-6 rounded-full relative transition-colors ${notifications ? 'bg-emerald-500' : 'bg-slate-200'}`}><div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${notifications ? 'left-6' : 'left-1'}`} /></button>
                                </div>
                                <div className="flex items-center justify-between p-4">
                                    <span className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-700'}`}>Sonidos</span>
                                    <button onClick={() => setSounds(!sounds)} className={`w-11 h-6 rounded-full relative transition-colors ${sounds ? 'bg-indigo-500' : 'bg-slate-200'}`}><div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${sounds ? 'left-6' : 'left-1'}`} /></button>
                                </div>
                            </div>

                            <button onClick={handleLogout} className="w-full py-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-2">
                                <span className="material-symbols-outlined !text-base">logout</span> Cerrar Sesión
                            </button>
                        </motion.div>
                    )}

                    {/* 4. CONSCIOUSNESS VIEW (Placeholder) */}
                    {activeTab === 'consciousness' && (
                        <motion.div
                            key="consciousness"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            className={`rounded-[2rem] p-8 text-center border shadow-sm ${theme === 'dark' ? 'bg-[#1e293b] border-slate-700' : 'bg-white border-slate-100'}`}
                        >
                            <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-500">
                                <span className="material-symbols-outlined text-4xl">psychology</span>
                            </div>
                            <h3 className={`text-lg font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Estados de Consciencia</h3>
                            <p className="text-xs text-slate-400 mb-6 px-4">Monitorea tu evolución cognitiva y desbloquea nuevos niveles de percepción creativa.</p>
                            <button
                                onClick={() => onNavigate(PageName.AvatarIntelligence)}
                                className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20 active:scale-95 transition-transform"
                            >
                                Ver Análisis
                            </button>
                        </motion.div>
                    )}

                </AnimatePresence>
            </main>

            <style>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                .preserve-3d { transform-style: preserve-3d; }
                .backface-hidden { backface-visibility: hidden; }
                .rotate-y-180 { transform: rotateY(180deg); }
            `}</style>
        </div>
    );
};

export default Personal;
