import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '../../components/GlassCard';
import { AvatarType, AvatarConfig, Tone, ResearchAxis } from '../../../../hooks/useAvatarCognition';
import { AvatarHeader } from '../../components/AvatarHeader';
import { PageName } from '../../types';

interface Props {
    activeAvatarType: AvatarType;
    avatarConfigs: Record<AvatarType, AvatarConfig>;
    setActiveAvatarType: (type: AvatarType) => void;
    updateConfig: (avatar: AvatarType, updates: Partial<AvatarConfig>) => void;
    createNewAvatar: (type: AvatarType, name?: string, emoji?: string) => { success: boolean; error?: string };
    unlockedSlots: number;
    accentColor: string;
}

// --- Internal Modal Components ---

const ConfigModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    avatarType: AvatarType;
    config: AvatarConfig;
    onSave: (updates: Partial<AvatarConfig>) => void;
}> = ({ isOpen, onClose, avatarType, config, onSave }) => {
    const [localName, setLocalName] = useState(config.name);
    const [localEmoji, setLocalEmoji] = useState(config.emoji);
    const [localTone, setLocalTone] = useState<Tone>(config.tone);
    const [localAxis, setLocalAxis] = useState<ResearchAxis[]>(config.researchAxis);

    const EMOJIS = ['🧑‍🍳', '👨‍🔬', '🧙‍♂️', '🧛‍♂️', '🤖', '👽', '🦄', '🐙', '🦁', '🦉', '🦅', '🐺'];
    const TONES: Tone[] = ['Técnico', 'Creativo', 'Vanguardista', 'Michelin-grade', 'Eficiente', 'Exclusivo'];
    const AXES: ResearchAxis[] = ['Precisión', 'Creatividad', 'Competición', 'Coste', 'Alta cocina', 'Sostenibilidad'];

    const handleSave = () => {
        onSave({
            name: localName,
            emoji: localEmoji,
            tone: localTone,
            researchAxis: localAxis
        });
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center px-6">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl"
                    />
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="relative w-full max-w-sm bg-[#0B0F19] border border-white/10 rounded-[2.5rem] shadow-2xl flex flex-col max-h-[80vh] overflow-hidden"
                    >
                        <div className="p-8 space-y-8 overflow-y-auto no-scrollbar">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-3xl shadow-inner">
                                    {localEmoji}
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xs font-black text-white/40 uppercase tracking-widest mb-1">Configurar</h3>
                                    <h2 className="text-xl font-black text-white uppercase tracking-tighter">{avatarType}</h2>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-3 block px-1">Identidad Visual</label>
                                    <input
                                        type="text"
                                        value={localName}
                                        onChange={(e) => setLocalName(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:border-indigo-500/50 transition-all mb-4"
                                    />
                                    <div className="flex flex-wrap gap-2">
                                        {EMOJIS.map(e => (
                                            <button
                                                key={e}
                                                onClick={() => setLocalEmoji(e)}
                                                className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all ${localEmoji === e ? 'bg-indigo-500/20 border border-indigo-500/50 scale-110' : 'bg-white/5 border border-white/5 hover:bg-white/10'}`}
                                            >
                                                {e}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-3 block px-1">Perfil Cognitivo</label>
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {TONES.map(t => (
                                            <button
                                                key={t}
                                                onClick={() => setLocalTone(t)}
                                                className={`px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${localTone === t ? 'bg-indigo-500 text-white shadow-lg' : 'bg-white/5 text-white/40'}`}
                                            >
                                                {t}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {AXES.map(a => (
                                            <button
                                                key={a}
                                                onClick={() => {
                                                    setLocalAxis(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);
                                                }}
                                                className={`px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${localAxis.includes(a) ? 'bg-emerald-500 text-white shadow-lg' : 'bg-white/5 text-white/40'}`}
                                            >
                                                {a}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4 pb-4">
                                <button
                                    onClick={onClose}
                                    className="flex-1 py-4 bg-white/5 text-white/40 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
                                >
                                    Cerrar
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="flex-2 px-8 py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-900/20 transition-all active:scale-95"
                                >
                                    Guardar
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

const ConsciousnessMapModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    currentTier: string;
}> = ({ isOpen, onClose, currentTier }) => {
    const [flippedId, setFlippedId] = useState<string | null>(null);

    const THTERS = [
        { id: 'FREE', name: 'Génesis', desc: 'La chispa inicial de la consciencia digital.', feat: '1 Entidad', detail: 'Manifestación singular para el dominio técnico vertical.', color: '#4F46E5' },
        { id: 'PRO', name: 'Ascendente', desc: 'Dualidad cognitiva y expansión operativa.', feat: '2 Entidades', detail: 'Conecta disciplinas y gestiona sinergias operativas.', color: '#7C3AED' },
        { id: 'EXPERT', name: 'Platinum', desc: 'Dominio arquitectónico y orquestación.', feat: '4 Entidades', detail: 'Dirección creativa sobre un consejo de inteligencias.', color: '#6366F1' },
        { id: 'STUDIO', name: 'Jupiter', desc: 'Omnipresencia cognitiva ilimitada.', feat: '∞ Infinito', detail: 'Tú defines las reglas de la física de tu negocio.', color: '#8B5CF6' }
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center px-6">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-950/95 backdrop-blur-2xl"
                    />
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="relative w-full max-w-sm flex flex-col gap-6"
                    >
                        <div className="text-center space-y-1 mb-2">
                            <h3 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em]">Evolución Avatar</h3>
                            <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Consciencia</h2>
                        </div>

                        <div className="grid grid-cols-1 gap-4 max-h-[60vh] overflow-y-auto no-scrollbar py-4 px-2">
                            {THTERS.map((tier, i) => {
                                const isCurrent = tier.id === (currentTier === 'Génesis' ? 'FREE' : currentTier === 'Ascendente' ? 'PRO' : currentTier === 'Platinum' ? 'EXPERT' : 'STUDIO');
                                const isFlipped = flippedId === tier.id;

                                return (
                                    <div
                                        key={tier.id}
                                        onClick={() => setFlippedId(isFlipped ? null : tier.id)}
                                        className="relative h-32 perspective-1000"
                                    >
                                        {/* Desktop-style Halo Effect for Current Tier */}
                                        {isCurrent && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{
                                                    opacity: [0.4, 0.7, 0.4],
                                                    scale: [1, 1.05, 1],
                                                }}
                                                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                                className="absolute -inset-4 rounded-[2.5rem] blur-2xl z-0"
                                                style={{ background: `radial-gradient(circle, ${tier.color}40 0%, transparent 70%)` }}
                                            />
                                        )}

                                        <div className={`relative w-full h-full transition-all duration-700 preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
                                            {/* Front */}
                                            <div className={`absolute inset-0 backface-hidden rounded-[2rem] p-6 flex items-center justify-between border transition-all z-10 ${isCurrent
                                                ? 'bg-zinc-900 border-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.3)]'
                                                : 'bg-white/5 border-white/10 opacity-60'
                                                }`}>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className={`text-[8px] font-black uppercase tracking-widest ${isCurrent ? 'text-indigo-400' : 'text-white/20'}`}>Fase {i + 1}</span>
                                                        {isCurrent && <div className="h-[1px] w-8 bg-indigo-500/50" />}
                                                    </div>
                                                    <h4 className={`text-xl font-black uppercase tracking-tight ${isCurrent ? 'text-white' : 'text-white/60'}`}>{tier.name}</h4>
                                                    <p className={`text-[9px] font-medium leading-tight max-w-[160px] ${isCurrent ? 'text-white/60' : 'text-white/30'}`}>{tier.desc}</p>
                                                </div>
                                                <div className="flex flex-col items-end justify-between h-full">
                                                    <div className={`px-3 py-1 rounded-full text-[8px] font-black tracking-widest uppercase flex items-center gap-1 ${isCurrent ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40' : 'bg-white/5 text-white/30'}`}>
                                                        {isCurrent && <span className="material-symbols-outlined text-[10px] fill-1 text-white">grade</span>}
                                                        {tier.feat}
                                                    </div>
                                                    <span className={`material-symbols-outlined text-sm ${isCurrent ? 'text-indigo-400' : 'text-white/10'}`}>info</span>
                                                </div>
                                            </div>

                                            {/* Back */}
                                            <div className={`absolute inset-0 backface-hidden rotate-y-180 rounded-[2rem] p-6 flex flex-col justify-center bg-zinc-900 border ${isCurrent ? 'border-indigo-400/50' : 'border-white/10'}`}>
                                                <p className="text-[11px] text-indigo-200 font-bold leading-relaxed italic text-center">"{tier.detail}"</p>
                                                <div className="mt-4 flex justify-center">
                                                    <span className="text-[7px] font-black text-indigo-400 uppercase tracking-widest">Capacidad Cognitiva Expandida</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <button
                            onClick={onClose}
                            className="w-full py-5 bg-white text-zinc-900 rounded-[2rem] text-[10px] font-black uppercase tracking-widest shadow-2xl transition-all active:scale-95"
                        >
                            Cerrar Mapa
                        </button>
                    </motion.div>
                </div>
            )}
            <style>{`
                .perspective-1000 { perspective: 1000px; }
                .preserve-3d { transform-style: preserve-3d; }
                .backface-hidden { backface-visibility: hidden; }
                .rotate-y-180 { transform: rotateY(180deg); }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </AnimatePresence>
    );
};

const CreateAvatarModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    avatarConfigs: Record<AvatarType, AvatarConfig>;
    onCreate: (type: AvatarType) => void;
    unlockedSlots: number;
}> = ({ isOpen, onClose, avatarConfigs, onCreate, unlockedSlots }) => {
    const TYPES: AvatarType[] = ['Mixologist', 'Chef', 'Patissier', 'Sommelier', 'Barista', 'Concierge', 'Manager', 'Owner'];

    // Count manifestation capacity
    const existingCount = Object.values(avatarConfigs).filter(c => c.profiles.length > 0).length;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center px-6">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-950/95 backdrop-blur-2xl"
                    />
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="relative w-full max-w-sm flex flex-col gap-6"
                    >
                        <div className="text-center space-y-1 mb-2">
                            <h3 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em]">Capacidad: {existingCount}/{unlockedSlots}</h3>
                            <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Manifestación</h2>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            {TYPES.map(type => {
                                const exists = avatarConfigs[type].profiles.length > 0;
                                return (
                                    <button
                                        key={type}
                                        disabled={exists}
                                        onClick={() => { onCreate(type); onClose(); }}
                                        className={`flex flex-col items-center justify-center p-4 rounded-3xl border transition-all ${exists ? 'bg-white/5 border-white/5 opacity-20' : 'bg-white/10 border-white/10 hover:bg-white/20 active:scale-95'}`}
                                    >
                                        <span className="text-3xl mb-1 opacity-80">
                                            {exists ? '🔒' : type === 'Mixologist' ? '🍸' : type === 'Chef' ? '👨‍🍳' : type === 'Patissier' ? '🍰' : type === 'Sommelier' ? '🍷' : type === 'Barista' ? '☕' : type === 'Concierge' ? '🛎️' : type === 'Manager' ? '💼' : '👑'}
                                        </span>
                                        <span className="text-[8px] font-black text-white/60 uppercase tracking-widest">{type}</span>
                                    </button>
                                );
                            })}
                        </div>

                        <button
                            onClick={onClose}
                            className="w-full py-5 bg-white/5 border border-white/10 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
                        >
                            Cancelar
                        </button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

// --- Main Component ---

const AvatarCore: React.FC<Props> = ({
    activeAvatarType,
    avatarConfigs,
    setActiveAvatarType,
    updateConfig,
    createNewAvatar,
    unlockedSlots,
    accentColor
}) => {
    const [configModalType, setConfigModalType] = useState<AvatarType | null>(null);
    const [isMapOpen, setIsMapOpen] = useState(false);
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    const AVATARS: AvatarType[] = ['Mixologist', 'Chef', 'Patissier', 'Sommelier', 'Barista', 'Concierge', 'Manager', 'Owner'];
    const activeConfigs = AVATARS.filter(type => avatarConfigs[type].profiles.length > 0);
    const currentTier = unlockedSlots === 1 ? 'Génesis' : unlockedSlots === 2 ? 'Ascendente' : unlockedSlots === 4 ? 'Platinum' : 'Jupiter';

    return (
        <div className="space-y-6">
            <AvatarHeader currentPage={PageName.AvatarCore} />

            {/* Legend / Status Bar */}
            <div className="flex gap-3 mb-2 px-1">
                <GlassCard rounded="2xl" padding="none" className="flex-1 bg-white/60 border-white/40 backdrop-blur-xl transition-all active:scale-[0.98] cursor-pointer shadow-sm" onClick={() => setIsMapOpen(true)}>
                    <div className="flex flex-col items-center justify-center py-3">
                        <span className="text-[7px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-1">Estado de Consciencia</span>
                        <span className="text-xs font-black text-zinc-800 tracking-widest">{currentTier.toUpperCase()}</span>
                    </div>
                </GlassCard>
                <GlassCard rounded="2xl" padding="none" className="flex-1 bg-white/60 border-white/40 backdrop-blur-xl transition-all active:scale-[0.98] cursor-pointer shadow-sm" onClick={() => setIsCreateOpen(activeConfigs.length < unlockedSlots)}>
                    <div className="flex flex-col items-center justify-center py-3">
                        <span className="text-[7px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-1">Capacidad de Manifestación</span>
                        <span className="text-xs font-black text-zinc-800 tracking-widest uppercase">{unlockedSlots >= 99 ? '∞' : unlockedSlots} Avatares</span>
                    </div>
                </GlassCard>
            </div>

            {/* Avatar Cards */}
            <div className="space-y-4">
                {activeConfigs.map((type, index) => {
                    const config = avatarConfigs[type];
                    const isActive = activeAvatarType === type;

                    return (
                        <motion.div
                            key={type}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <GlassCard
                                rounded="3xl"
                                padding="none"
                                className={`relative transition-all cursor-pointer overflow-hidden ${isActive ? 'ring-2' : ''
                                    }`}
                                onClick={() => setActiveAvatarType(type)}
                                style={isActive ? { borderColor: `${accentColor}40` } : {}}
                            >
                                <div className="p-5 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div
                                            className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-inner ${isActive
                                                ? 'bg-zinc-900 text-white shadow-lg'
                                                : 'bg-zinc-200/50 text-zinc-500'
                                                }`}
                                        >
                                            {config.emoji}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="text-lg font-black text-zinc-900 uppercase tracking-tight">
                                                    {config.name || type}
                                                </h3>
                                                {isActive && (
                                                    <span className="px-2 py-0.5 bg-indigo-100 text-indigo-600 rounded-sm text-[7px] font-black uppercase tracking-widest border border-indigo-200">
                                                        MANIFESTADO
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-[10px] text-zinc-500 font-medium leading-tight max-w-[180px]">
                                                {type === 'Mixologist' ? 'Arquitecto de sabores líquidos. Domina la alquimia de los espirituosos.' : 'Maestro de la materia prima. Transforma ingredientes en experiencias.'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end">
                                        {isActive ? (
                                            <span className="material-symbols-outlined text-indigo-500 fill-1">check_circle</span>
                                        ) : (
                                            <button className="text-[8px] font-bold text-zinc-400 hover:text-zinc-900 uppercase tracking-widest">Manifestar</button>
                                        )}
                                    </div>
                                </div>

                                {isActive && (
                                    <div className="px-5 pb-5 pt-2 flex gap-2">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setConfigModalType(type); }}
                                            className="w-full py-4 bg-zinc-100 text-zinc-600 border border-zinc-200 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 hover:bg-zinc-200"
                                        >
                                            CONFIGURAR AVATAR
                                        </button>
                                    </div>
                                )}
                            </GlassCard>
                        </motion.div>
                    );
                })}

                {activeConfigs.length < unlockedSlots && (
                    <button
                        onClick={() => setIsCreateOpen(true)}
                        className="w-full py-6 border-2 border-dashed border-zinc-300/50 bg-white/40 rounded-[2.5rem] flex flex-col items-center justify-center gap-2 opacity-60 hover:opacity-100 transition-all active:scale-[0.98]"
                    >
                        <span className="material-symbols-outlined text-zinc-400">add_circle</span>
                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Nueva Manifestación</span>
                    </button>
                )}
            </div>

            {/* Mind Map Section */}
            <div className="pt-4">
                <div className="flex justify-between items-center mb-4 px-2">
                    <h3 className="text-xs font-black text-white/80 uppercase tracking-[0.2em]">Mapa de Evolución</h3>
                    <span className="text-[8px] font-bold text-white/40">SISTEMA COGNITIVO ACTIVO</span>
                </div>

                <GlassCard rounded="3xl" padding="lg" className="bg-gradient-to-br from-indigo-900/40 to-transparent border-white/5 transition-all active:scale-[0.98] cursor-pointer" onClick={() => setIsMapOpen(true)}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full border-2 border-indigo-500/30 flex items-center justify-center">
                                <span className="material-symbols-outlined text-indigo-400">psychology</span>
                            </div>
                            <div>
                                <h4 className="text-sm font-black text-white uppercase mb-0.5">Estados de Consciencia</h4>
                                <p className="text-[9px] text-white/50 uppercase tracking-widest">Nivel Actual: {currentTier}</p>
                            </div>
                        </div>
                        <button className="px-4 py-2 bg-white/10 rounded-full text-[9px] font-black text-white uppercase tracking-widest border border-white/10">Ver Mapa</button>
                    </div>
                </GlassCard>
            </div>

            {/* Modals Rendering */}
            <ConsciousnessMapModal
                isOpen={isMapOpen}
                onClose={() => setIsMapOpen(false)}
                currentTier={currentTier}
            />

            {configModalType && (
                <ConfigModal
                    isOpen={!!configModalType}
                    onClose={() => setConfigModalType(null)}
                    avatarType={configModalType}
                    config={avatarConfigs[configModalType]}
                    onSave={(updates) => updateConfig(configModalType, updates)}
                />
            )}

            <CreateAvatarModal
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                avatarConfigs={avatarConfigs}
                unlockedSlots={unlockedSlots}
                onCreate={(type) => createNewAvatar(type)}
            />
        </div>
    );
};

export default AvatarCore;
