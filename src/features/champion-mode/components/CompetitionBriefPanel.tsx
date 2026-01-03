import React, { useState, useRef } from 'react';
import { Icon } from '../../../components/ui/Icon';
import { ICONS } from '../../../components/ui/icons';
import { useChampionContext } from '../context/ChampionContext';

export const CompetitionBriefPanel: React.FC = () => {
    const { state, actions } = useChampionContext();
    const { brief } = state;

    const [isOpen, setIsOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const compTypes = ['Signature Serve', 'Sustainable Challenge', 'Speed Round', 'Storytelling'];

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.length) {
            console.log("File selected:", e.target.files[0].name);
            // Simulate parsing
            actions.setBrief({ constraints: ['Max 5 Ingredientes', 'Base: Gin', 'No Artesanales'] });
        }
    };

    // Brand Modal State
    const [showBrandModal, setShowBrandModal] = useState(false);
    const [newBrandName, setNewBrandName] = useState('');
    const [newBrandDesc, setNewBrandDesc] = useState('');

    // Rule Modal State
    const [showRuleModal, setShowRuleModal] = useState(false);
    const [newRuleText, setNewRuleText] = useState('');

    return (
        <div className="h-full flex flex-col gap-5 text-slate-800 font-sans max-w-2xl mx-auto w-full relative">
            {/* Sponsor Section */}
            <div className="relative z-30">
                <h3 className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-[2px] mb-3 flex items-center gap-2">
                    <Icon svg={ICONS.book} className="w-3 h-3 text-cyan-500" />
                    MARCA SPONSOR
                </h3>

                <div className="relative">
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="w-full bg-white border border-slate-200 rounded-[16px] p-4 flex items-center justify-between shadow-sm hover:shadow-md hover:border-cyan-200 transition-all group"
                    >
                        <span className="font-bold text-slate-700 text-sm">{brief.brand}</span>
                        <div className={`text-slate-400 group-hover:text-cyan-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                            <Icon svg={ICONS.chevronDown} className="w-4 h-4" />
                        </div>
                    </button>

                    {isOpen && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-[16px] shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                            {state.availableBrands.map(b => (
                                <div key={b} className="flex items-center hover:bg-slate-50 border-b border-slate-50 last:border-0 group/item">
                                    <button
                                        onClick={() => { actions.setBrief({ brand: b }); setIsOpen(false); }}
                                        className={`flex-1 text-left px-4 py-3 text-xs font-bold transition-colors flex items-center justify-between ${brief.brand === b ? 'text-cyan-600 bg-cyan-50' : 'text-slate-600'}`}
                                    >
                                        {b}
                                        {brief.brand === b && <Icon svg={ICONS.check} className="w-3 h-3" />}
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); actions.removeBrand(b); }}
                                        className="p-3 text-slate-300 hover:text-rose-500 opacity-0 group-hover/item:opacity-100 transition-opacity"
                                        title="Eliminar Marca"
                                    >
                                        <Icon svg={ICONS.x} className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                            <div className="p-2 border-t border-slate-100 bg-slate-50/50">
                                <button
                                    onClick={() => { setIsOpen(false); setShowBrandModal(true); }}
                                    className="w-full py-2 border border-dashed border-slate-300 text-slate-400 rounded-lg text-[10px] font-bold uppercase hover:border-cyan-400 hover:text-cyan-600 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Icon svg={ICONS.plus} className="w-3 h-3" />
                                    Añadir Marca
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>


            {/* Type Section */}
            <div className="relative z-20">
                <h3 className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-[2px] mb-3 flex items-center gap-2">
                    TIPO DE COMPETENCIA
                </h3>
                <div className="grid grid-cols-2 gap-2">
                    {compTypes.map(t => (
                        <button
                            key={t}
                            onClick={() => actions.setBrief({ competitionType: t })}
                            className={`px-3 py-2 rounded-xl text-[10px] font-bold border transition-all ${brief.competitionType === t ? 'bg-cyan-50 border-cyan-400 text-cyan-700' : 'bg-white border-slate-200 text-slate-500 hover:border-cyan-300'}`}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            </div>


            {/* Rules Summary - Clean List */}
            <div className="flex-1 flex flex-col min-h-0 bg-white/50 rounded-[20px] border border-white/60 p-1">
                <div className="p-4 pb-2">
                    <h4 className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-[2px] flex items-center justify-between">
                        Reglas Detectadas
                        <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-[9px] font-black tracking-wide border border-emerald-200 shadow-sm">{brief.constraints.length} OK</span>
                    </h4>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
                    {brief.constraints.map((rule, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-[14px] border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors bg-emerald-50 text-emerald-600">
                                <Icon svg={ICONS.check} className="w-4 h-4" />
                            </div>
                            <span className="text-xs font-bold text-slate-600 group-hover:text-slate-800 transition-colors flex-1">{rule}</span>
                            <button
                                onClick={() => actions.removeRule(i)}
                                className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-rose-500 transition-all"
                            >
                                <Icon svg={ICONS.x} className="w-3 h-3" />
                            </button>
                        </div>
                    ))}
                    {brief.constraints.length === 0 && <p className="text-center text-xs text-slate-400 py-4 italic">Sube las bases para extraer reglas.</p>}
                </div>

                {/* Add Rule Manual Button */}
                <div className="p-2 border-t border-slate-100/50 mt-1">
                    <button
                        onClick={() => setShowRuleModal(true)}
                        className="w-full py-3 border border-dashed border-emerald-200 bg-emerald-50/30 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-50 hover:border-emerald-300 transition-all flex items-center justify-center gap-2"
                    >
                        <Icon svg={ICONS.plus} className="w-3 h-3" />
                        Agregar Regla Manual
                    </button>
                </div>
            </div>

            {/* Upload Button */}
            <div className="mt-auto pt-2">
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileChange}
                />
                <button
                    onClick={handleUploadClick}
                    className="w-full py-4 border border-dashed border-slate-300 bg-slate-50 hover:bg-white hover:border-cyan-400 rounded-[18px] text-[10px] font-bold text-slate-400 hover:text-cyan-600 hover:shadow-md transition-all flex items-center justify-center gap-2 group uppercase tracking-widest"
                >
                    <Icon svg={ICONS.upload} className="w-4 h-4 group-hover:-translate-y-1 transition-transform duration-300" />
                    Subir Bases (PDF)
                </button>
            </div>

            {/* CUSTOM RULE MODAL */}
            {showRuleModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-emerald-950/20 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                    <div className="w-full max-w-sm bg-gradient-to-br from-emerald-500/90 to-emerald-600/0 backdrop-blur-xl border border-white/40 rounded-[30px] shadow-2xl p-8 relative overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

                        <h3 className="text-lg font-black text-white mb-6 drop-shadow-sm">Nueva Regla Manual</h3>

                        <div className="space-y-4 relative z-10">
                            <div>
                                <label className="block text-[10px] font-bold text-white/70 uppercase tracking-widest mb-1.5">Regla / Restricción</label>
                                <input
                                    autoFocus
                                    type="text"
                                    className="w-full bg-white/20 border border-white/30 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/50 text-sm font-bold backdrop-blur-md"
                                    placeholder="Ej: Debe tener Eneldo"
                                    value={newRuleText}
                                    onChange={e => setNewRuleText(e.target.value)}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter' && newRuleText.trim()) {
                                            actions.addRule(newRuleText.trim());
                                            setShowRuleModal(false);
                                            setNewRuleText('');
                                        }
                                    }}
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-8">
                            <button
                                onClick={() => { setShowRuleModal(false); setNewRuleText(''); }}
                                className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors border border-white/10"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => {
                                    if (newRuleText.trim()) {
                                        actions.addRule(newRuleText.trim());
                                        setShowRuleModal(false);
                                        setNewRuleText('');
                                    }
                                }}
                                className="flex-1 py-3 rounded-xl bg-white text-emerald-600 hover:bg-emerald-50 text-xs font-black uppercase tracking-wider shadow-lg transition-all transform hover:scale-105 active:scale-95"
                            >
                                Guardar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* CUSTOM BRAND MODAL */}
            {showBrandModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-emerald-950/20 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                    <div className="w-full max-w-sm bg-gradient-to-br from-emerald-500/90 to-emerald-600/0 backdrop-blur-xl border border-white/40 rounded-[30px] shadow-2xl p-8 relative overflow-hidden animate-in zoom-in-95 duration-300">
                        {/* Decorative glow */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

                        <h3 className="text-lg font-black text-white mb-6 drop-shadow-sm">Nueva Marca Sponsor</h3>

                        <div className="space-y-4 relative z-10">
                            <div>
                                <label className="block text-[10px] font-bold text-white/70 uppercase tracking-widest mb-1.5">Nombre de la Marca</label>
                                <input
                                    autoFocus
                                    type="text"
                                    className="w-full bg-white/20 border border-white/30 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/50 text-sm font-bold backdrop-blur-md"
                                    placeholder="Ej: Ron Abuelo"
                                    value={newBrandName}
                                    onChange={e => setNewBrandName(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-white/70 uppercase tracking-widest mb-1.5">Descripción (Opcional)</label>
                                <input
                                    type="text"
                                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-white/40 text-xs backdrop-blur-md"
                                    placeholder="Ej: Premium Panamanian Rum"
                                    value={newBrandDesc}
                                    onChange={e => setNewBrandDesc(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-8">
                            <button
                                onClick={() => { setShowBrandModal(false); setNewBrandName(''); }}
                                className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors border border-white/10"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => {
                                    if (newBrandName.trim()) {
                                        actions.addBrand(newBrandName.trim());
                                        setShowBrandModal(false);
                                        setNewBrandName('');
                                        setNewBrandDesc('');
                                    }
                                }}
                                className="flex-1 py-3 rounded-xl bg-white text-emerald-600 hover:bg-emerald-50 text-xs font-black uppercase tracking-wider shadow-lg transition-all transform hover:scale-105 active:scale-95"
                            >
                                Guardar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
};
