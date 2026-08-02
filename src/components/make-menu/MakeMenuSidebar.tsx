import React from 'react';

interface MakeMenuSidebarProps {
    style: string;
    onStyleChange: (s: string) => void;
    accentColor: string;
    onAccentChange: (c: string) => void;
}

const STYLES = ['Moderno', 'Clásico', 'Minimalista', 'Vanguardista', 'Lujo'];
// Curated professional palette (quick picks)
const ACCENTS = [
    { name: 'Tinta', value: '#0f172a' },
    { name: 'Grafito', value: '#475569' },
    { name: 'Rubí', value: '#dc2626' },
    { name: 'Rosa', value: '#ec4899' },
    { name: 'Naranja', value: '#ea580c' },
    { name: 'Ámbar', value: '#f59e0b' },
    { name: 'Oro', value: '#ca8a04' },
    { name: 'Lima', value: '#65a30d' },
    { name: 'Esmeralda', value: '#059669' },
    { name: 'Teal', value: '#0d9488' },
    { name: 'Cian', value: '#0891b2' },
    { name: 'Azul', value: '#2563eb' },
    { name: 'Índigo', value: '#4f46e5' },
    { name: 'Violeta', value: '#7c3aed' },
    { name: 'Borgoña', value: '#881337' },
    { name: 'Cobre', value: '#b45309' },
];

const MakeMenuSidebar: React.FC<MakeMenuSidebarProps> = ({ style, onStyleChange, accentColor, onAccentChange }) => {
    return (
        <div className="backdrop-blur-xl bg-white/40 dark:bg-slate-900/40 border border-white/20 shadow-lg rounded-2xl h-full flex flex-col overflow-hidden p-4 gap-6">
            <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 px-2">Personalización</h3>
                <div className="space-y-4">
                    {/* Style — drives the AI layout aesthetic */}
                    <div className="bg-white/40 dark:bg-white/5 p-3 rounded-xl border border-white/10">
                        <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-2">Estilo Base</label>
                        <select
                            value={style}
                            onChange={e => onStyleChange(e.target.value)}
                            className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg p-2 text-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-rose-500/30"
                        >
                            {STYLES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>

                    {/* Accent — professional color picker (presets + custom) */}
                    <div className="bg-white/40 dark:bg-white/5 p-3 rounded-xl border border-white/10">
                        <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-2">Acento de Color</label>
                        <div className="grid grid-cols-8 gap-1.5 mb-3">
                            {ACCENTS.map(c => (
                                <button
                                    key={c.value}
                                    onClick={() => onAccentChange(c.value)}
                                    title={c.name}
                                    style={{ backgroundColor: c.value }}
                                    className={`aspect-square rounded-md cursor-pointer transition-transform hover:scale-110 ${accentColor.toLowerCase() === c.value.toLowerCase() ? 'ring-2 ring-offset-1 ring-rose-500 dark:ring-offset-slate-900 scale-110' : ''}`}
                                />
                            ))}
                        </div>
                        {/* Custom color picker */}
                        <div className="flex items-center gap-2">
                            <label className="relative cursor-pointer">
                                <span
                                    className="block w-9 h-9 rounded-lg border border-slate-300 dark:border-white/20 shadow-sm"
                                    style={{ backgroundColor: accentColor }}
                                />
                                <input
                                    type="color"
                                    value={accentColor}
                                    onChange={e => onAccentChange(e.target.value)}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                            </label>
                            <input
                                type="text"
                                value={accentColor}
                                onChange={e => { const v = e.target.value; if (/^#[0-9a-fA-F]{0,6}$/.test(v)) onAccentChange(v); }}
                                className="flex-1 text-xs font-mono uppercase bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg px-2 py-2 text-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-rose-500/30"
                                placeholder="#000000"
                                maxLength={7}
                            />
                        </div>
                        <p className="text-[10px] text-slate-400 mt-2">Elige un preset o un color personalizado. Se aplica al diseño IA.</p>
                    </div>
                </div>
            </div>

            <div className="mt-auto bg-rose-50 dark:bg-rose-900/10 rounded-xl p-4 border border-rose-100 dark:border-rose-800/20">
                <h4 className="text-sm font-semibold text-rose-800 dark:text-rose-200 mb-2">
                    Modo Creativo
                </h4>
                <p className="text-xs text-rose-600 dark:text-rose-300 leading-relaxed">
                    Elige el <strong>estilo</strong> y el <strong>acento de color</strong> aquí; selecciona recetas en el panel derecho y genera. La IA diseñará el menú con estas preferencias.
                </p>
            </div>
        </div>
    );
};

export default MakeMenuSidebar;
