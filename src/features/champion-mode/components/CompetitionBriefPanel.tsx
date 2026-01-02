import React, { useState, useRef } from 'react';
import { Icon } from '../../../components/ui/Icon';
import { ICONS } from '../../../components/ui/icons';
import { useChampionContext } from '../context/ChampionContext';

export const CompetitionBriefPanel: React.FC = () => {
    const { state, actions } = useChampionContext();
    const { brief } = state;

    const [isOpen, setIsOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const brands = ['Nexus Spirits', 'Aether Gin', 'Solaris Rum', 'Vortex Vodka'];
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

    return (
        <div className="h-full flex flex-col gap-5 text-slate-800 font-sans max-w-2xl mx-auto w-full">
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
                            {brands.map(b => (
                                <button
                                    key={b}
                                    onClick={() => { actions.setBrief({ brand: b }); setIsOpen(false); }}
                                    className={`w-full text-left px-4 py-3 text-xs font-bold hover:bg-slate-50 transition-colors flex items-center justify-between ${brief.brand === b ? 'text-cyan-600 bg-cyan-50' : 'text-slate-600'}`}
                                >
                                    {b}
                                    {brief.brand === b && <Icon svg={ICONS.check} className="w-3 h-3" />}
                                </button>
                            ))}
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
                            <span className="text-xs font-bold text-slate-600 group-hover:text-slate-800 transition-colors">{rule}</span>
                        </div>
                    ))}
                    {brief.constraints.length === 0 && <p className="text-center text-xs text-slate-400 py-4 italic">Sube las bases para extraer reglas.</p>}
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
        </div>
    );
};
