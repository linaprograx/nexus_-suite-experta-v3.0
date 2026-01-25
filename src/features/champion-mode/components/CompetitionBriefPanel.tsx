import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
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
                        className="w-full bg-white/70 border border-white/40 rounded-[16px] p-4 flex items-center justify-between shadow-sm hover:shadow-lg hover:border-cyan-400/50 transition-all group backdrop-blur-md"
                    >
                        <span className="font-bold text-slate-800 text-sm">{brief.brand}</span>
                        <div className={`text-slate-500 group-hover:text-cyan-600 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                            <Icon svg={ICONS.chevronDown} className="w-4 h-4" />
                        </div>
                    </button>

                    {isOpen && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white/90 border border-white/20 rounded-[16px] shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-50 backdrop-blur-xl">
                            {state.availableBrands.map(b => (
                                <div key={b} className="flex items-center hover:bg-slate-100/50 border-b border-slate-200/50 last:border-0 group/item">
                                    <button
                                        onClick={() => { actions.setBrief({ brand: b }); setIsOpen(false); }}
                                        className={`flex-1 text-left px-4 py-3 text-xs font-bold transition-colors flex items-center justify-between ${brief.brand === b ? 'text-cyan-700 bg-cyan-50' : 'text-slate-600 group-hover/item:text-slate-900'}`}
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
                            <div className="p-2 border-t border-slate-200/50 bg-slate-50/50">
                                <button
                                    onClick={() => { setIsOpen(false); setShowBrandModal(true); }}
                                    className="w-full py-2 border border-dashed border-slate-300 text-slate-500 rounded-lg text-[10px] font-bold uppercase hover:border-cyan-400/50 hover:text-cyan-600 transition-colors flex items-center justify-center gap-2"
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
                            className={`px-3 py-2 rounded-xl text-[10px] font-bold border transition-all ${brief.competitionType === t ? 'bg-cyan-100 border-cyan-300 text-cyan-800 shadow-sm' : 'bg-white/40 border-white/60 text-slate-600 hover:border-cyan-300/50 hover:text-cyan-700 hover:bg-white/60'}`}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            </div>


            {/* Rules Summary - Clean List */}
            <div className="flex-1 flex flex-col min-h-0 bg-white/40 rounded-[20px] border border-white/40 p-1 backdrop-blur-md shadow-sm">
                <div className="p-4 pb-2">
                    <h4 className="text-[0.65rem] font-bold text-slate-500 uppercase tracking-[2px] flex items-center justify-between">
                        Reglas Detectadas
                        <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-[9px] font-black tracking-wide border border-emerald-200/50 shadow-sm">{brief.constraints.length} OK</span>
                    </h4>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
                    {brief.constraints.map((rule, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 bg-white/80 rounded-[14px] border border-white/60 shadow-sm hover:shadow-md transition-all group hover:bg-white">
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
                <div className="p-2 border-t border-slate-200/30 mt-1">
                    <button
                        onClick={() => setShowRuleModal(true)}
                        className="w-full py-3 border border-dashed border-emerald-200 bg-emerald-50/50 text-emerald-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-100/50 hover:border-emerald-300 transition-all flex items-center justify-center gap-2"
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
                    className="w-full py-4 border border-dashed border-slate-300/50 bg-white/40 hover:bg-white/70 hover:border-cyan-400/50 rounded-[18px] text-[10px] font-bold text-slate-500 hover:text-cyan-700 hover:shadow-lg transition-all flex items-center justify-center gap-2 group uppercase tracking-widest backdrop-blur-sm"
                >
                    <Icon svg={ICONS.upload} className="w-4 h-4 group-hover:-translate-y-1 transition-transform duration-300" />
                    Subir Bases (PDF)
                </button>
            </div>

            {/* CUSTOM RULE MODAL */}
            {showRuleModal && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="absolute inset-0 bg-slate-900/10" onClick={() => setShowRuleModal(false)} />
                    <div className="w-full max-w-sm bg-white/95 border border-white/60 rounded-[30px] shadow-2xl p-8 transform animate-in zoom-in-95 duration-200 backdrop-blur-xl relative z-10">

                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 border border-emerald-200 shadow-sm">
                                <Icon svg={ICONS.plus} className="w-5 h-5" />
                            </div>
                            <h3 className="text-lg font-black text-slate-800 uppercase tracking-wider">Nueva Regla Manual</h3>
                        </div>

                        <div className="space-y-4 relative z-10">
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Regla / Restricción</label>
                                <input
                                    autoFocus
                                    type="text"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
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
                                className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wider transition-colors"
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
                                className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-emerald-500/30 transition-all"
                            >
                                Guardar
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* CUSTOM BRAND MODAL */}
            {showBrandModal && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="absolute inset-0 bg-slate-900/10" onClick={() => setShowBrandModal(false)} />
                    <div className="w-full max-w-md bg-white/95 border border-white/60 rounded-[30px] shadow-2xl p-8 transform animate-in zoom-in-95 duration-200 backdrop-blur-xl relative z-10">

                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 border border-emerald-200 shadow-sm">
                                <Icon svg={ICONS.plus} className="w-5 h-5" />
                            </div>
                            <h3 className="text-lg font-black text-slate-800 uppercase tracking-wider">Nueva Marca Sponsor</h3>
                        </div>

                        <div className="space-y-4 relative z-10">
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Nombre de la Marca</label>
                                <input
                                    autoFocus
                                    type="text"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
                                    placeholder="Ej: Ron Abuelo"
                                    value={newBrandName}
                                    onChange={e => setNewBrandName(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Descripción (Opcional)</label>
                                <input
                                    type="text"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
                                    placeholder="Ej: Premium Panamanian Rum"
                                    value={newBrandDesc}
                                    onChange={e => setNewBrandDesc(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-8">
                            <button
                                onClick={() => { setShowBrandModal(false); setNewBrandName(''); }}
                                className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wider transition-colors"
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
                                className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-emerald-500/30 transition-all"
                            >
                                Guardar
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div >
    );
};
