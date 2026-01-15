import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '../../../components/GlassCard';
import { useChampionContext } from '../../../../../features/champion-mode/context/ChampionContext';

interface PremiumModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    placeholder: string;
    value: string;
    onChange: (val: string) => void;
    onConfirm: () => void;
    icon: string;
}

const PremiumActionModal: React.FC<PremiumModalProps> = ({ isOpen, onClose, title, placeholder, value, onChange, onConfirm, icon }) => (
    <AnimatePresence>
        {isOpen && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center px-6">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-emerald-950/80 backdrop-blur-md"
                />
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="relative w-full max-w-sm bg-white rounded-[2.5rem] shadow-[0_32px_64px_rgba(0,0,0,0.4)] overflow-hidden"
                >
                    <div className="p-8 space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center">
                                <span className="material-symbols-outlined text-emerald-600">{icon}</span>
                            </div>
                            <h3 className="text-sm font-black text-emerald-950 uppercase tracking-widest">{title}</h3>
                        </div>

                        <div className="relative">
                            <input
                                autoFocus
                                type="text"
                                value={value}
                                onChange={(e) => onChange(e.target.value)}
                                placeholder={placeholder}
                                className="w-full bg-emerald-50 border border-emerald-950/5 rounded-2xl p-5 text-sm font-bold text-emerald-950 placeholder-emerald-950/20 outline-none focus:border-emerald-500 transition-all"
                                onKeyDown={(e) => e.key === 'Enter' && onConfirm()}
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className="flex-1 py-4 bg-emerald-50 text-emerald-950/40 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={onConfirm}
                                className="flex-2 py-4 bg-emerald-950 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-950/20 transition-all active:scale-95 px-8"
                            >
                                Confirmar
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        )}
    </AnimatePresence>
);

export const MobileChampionBriefing: React.FC = () => {
    const { state, actions } = useChampionContext();
    const { brief } = state;
    const [isSponsorOpen, setIsSponsorOpen] = useState(false);
    const [isTypeOpen, setIsTypeOpen] = useState(false);
    const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
    const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
    const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
    const [ruleValue, setRuleValue] = useState('');
    const [brandValue, setBrandValue] = useState('');
    const [typeValue, setTypeValue] = useState('');

    const handleAddRule = () => {
        if (ruleValue.trim()) {
            actions.addRule(ruleValue.trim());
            setRuleValue('');
            setIsRuleModalOpen(false);
        }
    };

    const handleAddBrand = () => {
        if (brandValue.trim()) {
            actions.addBrand(brandValue.trim());
            setBrandValue('');
            setIsBrandModalOpen(false);
        }
    };

    const handleAddType = () => {
        if (typeValue.trim()) {
            actions.addCompetitionType(typeValue.trim());
            setTypeValue('');
            setIsTypeModalOpen(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            {/* Sponsor Selection */}
            <div className="space-y-3">
                <h3 className="text-[10px] font-black text-emerald-950/60 uppercase tracking-[0.2em] px-2">Marca Sponsor</h3>
                <div className="relative">
                    <button
                        onClick={() => { setIsSponsorOpen(!isSponsorOpen); setIsTypeOpen(false); }}
                        className="w-full bg-white/40 backdrop-blur-md border border-emerald-900/10 rounded-2xl p-4 flex items-center justify-between shadow-sm transition-all active:scale-[0.98]"
                    >
                        <span className="font-bold text-emerald-950 text-sm">{brief.brand}</span>
                        <span className={`material-symbols-outlined text-emerald-900/40 transition-transform ${isSponsorOpen ? 'rotate-180' : ''}`}>
                            expand_more
                        </span>
                    </button>

                    <AnimatePresence>
                        {isSponsorOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-xl border border-emerald-900/10 rounded-2xl shadow-2xl overflow-hidden z-[60]"
                            >
                                <div className="max-h-60 overflow-y-auto">
                                    {state.availableBrands.map(brand => (
                                        <div key={brand} className="flex items-center border-b border-emerald-900/5 last:border-0 group">
                                            <button
                                                onClick={() => {
                                                    actions.setBrief({ brand });
                                                    setIsSponsorOpen(false);
                                                }}
                                                className={`flex-1 text-left px-5 py-4 text-xs font-bold transition-colors ${brief.brand === brand ? 'text-emerald-600 bg-emerald-50/50' : 'text-emerald-900/70 hover:bg-emerald-50'
                                                    }`}
                                            >
                                                {brand}
                                            </button>
                                            {brand !== 'Nexus Spirits' && (
                                                <button
                                                    onClick={() => actions.removeBrand(brand)}
                                                    className="px-4 py-4 text-emerald-900/20 hover:text-rose-500 transition-colors"
                                                >
                                                    <span className="material-symbols-outlined text-sm">delete</span>
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <button
                                    onClick={() => {
                                        setIsBrandModalOpen(true);
                                        setIsSponsorOpen(false);
                                    }}
                                    className="w-full py-4 bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                                >
                                    <span className="material-symbols-outlined text-sm">add_circle</span>
                                    Añadir Marca Personalizada
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Competition Type */}
            <div className="space-y-3">
                <h3 className="text-[10px] font-black text-emerald-950/60 uppercase tracking-[0.2em] px-2">Tipo de Competencia</h3>
                <div className="relative">
                    <button
                        onClick={() => { setIsTypeOpen(!isTypeOpen); setIsSponsorOpen(false); }}
                        className="w-full bg-white/40 backdrop-blur-md border border-emerald-900/10 rounded-2xl p-4 flex items-center justify-between shadow-sm transition-all active:scale-[0.98]"
                    >
                        <span className="font-bold text-emerald-950 text-sm">{brief.competitionType}</span>
                        <span className={`material-symbols-outlined text-emerald-900/40 transition-transform ${isTypeOpen ? 'rotate-180' : ''}`}>
                            expand_more
                        </span>
                    </button>

                    <AnimatePresence>
                        {isTypeOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-xl border border-emerald-900/10 rounded-2xl shadow-2xl overflow-hidden z-[60]"
                            >
                                <div className="max-h-60 overflow-y-auto">
                                    {state.availableCompetitionTypes.map(type => (
                                        <div key={type} className="flex items-center border-b border-emerald-900/5 last:border-0 group">
                                            <button
                                                onClick={() => {
                                                    actions.setBrief({ competitionType: type });
                                                    setIsTypeOpen(false);
                                                }}
                                                className={`flex-1 text-left px-5 py-4 text-xs font-bold transition-colors ${brief.competitionType === type ? 'text-emerald-600 bg-emerald-50/50' : 'text-emerald-900/70 hover:bg-emerald-50'
                                                    }`}
                                            >
                                                {type}
                                            </button>
                                            {!['Signature Serve', 'Sustainable Challenge', 'Speed Round', 'Storytelling'].includes(type) && (
                                                <button
                                                    onClick={() => actions.removeCompetitionType(type)}
                                                    className="px-4 py-4 text-emerald-900/20 hover:text-rose-500 transition-colors"
                                                >
                                                    <span className="material-symbols-outlined text-sm">delete</span>
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <button
                                    onClick={() => {
                                        setIsTypeModalOpen(true);
                                        setIsTypeOpen(false);
                                    }}
                                    className="w-full py-4 bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                                >
                                    <span className="material-symbols-outlined text-sm">add_circle</span>
                                    Nuevo Tipo de Desafío
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Rules Section */}
            <GlassCard rounded="3xl" padding="lg" className="bg-emerald-950/5 border-emerald-900/10">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                        <h3 className="text-[10px] font-black text-emerald-950 uppercase tracking-widest">Reglas Detectadas</h3>
                    </div>
                    <span className="bg-emerald-600 text-white px-2 py-0.5 rounded-full text-[8px] font-black">
                        {brief.constraints.length || 0}
                    </span>
                </div>

                <div className="space-y-3 mb-6">
                    {brief.constraints.map((rule, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 bg-white/60 rounded-xl border border-emerald-900/5 shadow-sm group">
                            <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined !text-[12px]">check</span>
                            </div>
                            <span className="text-[11px] font-bold text-emerald-950 flex-1">{rule}</span>
                            <button
                                onClick={() => actions.removeRule(i)}
                                className="p-1 text-emerald-900/20 hover:text-rose-500 transition-colors"
                            >
                                <span className="material-symbols-outlined !text-sm">close</span>
                            </button>
                        </div>
                    ))}
                    {brief.constraints.length === 0 && (
                        <p className="text-center text-[10px] text-emerald-950/40 py-4 italic">Sube las bases para extraer reglas o añádela manualmente.</p>
                    )}
                </div>

                <button
                    onClick={() => setIsRuleModalOpen(true)}
                    className="w-full py-4 border border-dashed border-emerald-950/20 rounded-2xl text-[9px] font-black text-emerald-950/40 uppercase tracking-widest hover:bg-emerald-600/5 transition-all"
                >
                    + AGREGAR REGLA MANUAL
                </button>
            </GlassCard>

            {/* Upload Bases */}
            <button className="w-full py-5 border border-dashed border-emerald-950/20 bg-emerald-950/5 rounded-[2rem] text-[9px] font-black text-emerald-950/50 uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-emerald-950/10 transition-all">
                <span className="material-symbols-outlined">upload_file</span>
                Subir Bases (PDF)
            </button>

            {/* Modals */}
            <PremiumActionModal
                isOpen={isRuleModalOpen}
                onClose={() => setIsRuleModalOpen(false)}
                title="Nueva Regla"
                placeholder="Ej: Prohibido usar jarabes..."
                value={ruleValue}
                onChange={setRuleValue}
                onConfirm={handleAddRule}
                icon="gavel"
            />

            <PremiumActionModal
                isOpen={isBrandModalOpen}
                onClose={() => setIsBrandModalOpen(false)}
                title="Nueva Marca"
                placeholder="Nombre del Sponsor..."
                value={brandValue}
                onChange={setBrandValue}
                onConfirm={handleAddBrand}
                icon="workspace_premium"
            />

            <PremiumActionModal
                isOpen={isTypeModalOpen}
                onClose={() => setIsTypeModalOpen(false)}
                title="Nuevo Desafío"
                placeholder="Ej: Mystery Box..."
                value={typeValue}
                onChange={setTypeValue}
                onConfirm={handleAddType}
                icon="trophy"
            />
        </div>
    );
};
