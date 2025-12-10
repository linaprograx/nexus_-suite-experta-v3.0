import React, { useState, useRef } from 'react';
import { Icon } from '../../../components/ui/Icon';
import { ICONS } from '../../../components/ui/icons';

export const CompetitionBriefPanel: React.FC = () => {
    const [brand, setBrand] = useState('Nexus Spirits');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.length) {
            console.log("File selected:", e.target.files[0].name);
            // logic to parse would go here
        }
    };

    return (
        <div className="h-full flex flex-col gap-4 text-slate-800 font-sans">
            {/* Header */}
            <div className="p-5 bg-white/80 dark:bg-slate-800/40 backdrop-blur-xl rounded-[22px] border border-white/40 dark:border-white/10 shadow-sm relative z-20">
                <h3 className="text-[0.7rem] font-bold text-slate-400 uppercase tracking-[2px] mb-3 flex items-center gap-2">
                    <Icon svg={ICONS.book} className="w-3 h-3 text-cyan-500" />
                    MARCA SPONSOR
                </h3>
                <div className="relative group">
                    {/* Custom Select Styling */}
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-cyan-500 transition-colors">
                        <Icon svg={ICONS.chevronRight} className="w-4 h-4 rotate-90" />
                    </div>
                    <select
                        value={brand}
                        onChange={(e) => setBrand(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-[14px] p-4 pr-10 text-sm font-bold text-slate-700 dark:text-slate-200 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 appearance-none shadow-sm cursor-pointer transition-all"
                    >
                        <option>Nexus Spirits</option>
                        <option>Aether Gin</option>
                        <option>Solaris Rum</option>
                    </select>
                </div>
            </div>

            {/* Rules Summary */}
            <div className="flex-1 bg-white/40 dark:bg-slate-800/20 backdrop-blur-md rounded-[22px] border border-white/40 dark:border-white/10 p-5 overflow-y-auto custom-scrollbar">
                <h4 className="text-[0.7rem] font-bold text-slate-400 uppercase tracking-[2px] mb-4 flex items-center justify-between">
                    Reglas Detectadas
                    <span className="bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded text-[10px] font-black">3 OK</span>
                </h4>
                <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-white/60 dark:bg-slate-800/60 rounded-xl border border-white/60 dark:border-white/5 shadow-sm hover:translate-x-1 transition-transform">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                            <Icon svg={ICONS.check} className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">Max 5 Ingredientes</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-white/60 dark:bg-slate-800/60 rounded-xl border border-white/60 dark:border-white/5 shadow-sm hover:translate-x-1 transition-transform">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                            <Icon svg={ICONS.check} className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">Base: Gin</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-white/60 dark:bg-slate-800/60 rounded-xl border border-white/60 dark:border-white/5 shadow-sm hover:translate-x-1 transition-transform">
                        <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                            <Icon svg={ICONS.warning} className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        </div>
                        <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">No Artesanales</span>
                    </div>
                </div>
            </div>

            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
            />
            <button
                onClick={handleUploadClick}
                className="w-full py-4 border-2 border-dashed border-slate-300 hover:border-indigo-400 rounded-[22px] text-xs font-bold text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all flex items-center justify-center gap-2 group"
            >
                <Icon svg={ICONS.upload} className="w-4 h-4 group-hover:-translate-y-1 transition-transform" />
                SUBIR PDF BASES
            </button>
        </div>
    );
};
