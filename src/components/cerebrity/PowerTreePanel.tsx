import React from 'react';
import { CerebrityResult, Recipe } from '../../../types';
import { Icon } from '../ui/Icon';
import { ICONS } from '../ui/icons';

interface PowerTreePanelProps {
    color: 'violet' | 'cyan';
    result: CerebrityResult | any | null;
    onOpenRecipeModal?: (recipe: Partial<Recipe> | null) => void;
    onSendToPizarron?: (title: string, content: string) => void;
}

const Widget: React.FC<{ size: 'sm-sq' | 'md-sq' | 'lg-sq' | 'h-rect' | 'v-rect'; colorClass: string; children: React.ReactNode; interactive?: boolean, onClick?: () => void }> = ({ size, colorClass, children, interactive, onClick }) => {
    const sizeMap = {
        'sm-sq': 'h-24',
        'md-sq': 'h-36 col-span-2',
        'lg-sq': 'h-48 col-span-2',
        'h-rect': 'h-24 col-span-2',
        'v-rect': 'h-36',
    };

    return (
        <div onClick={onClick} className={`backdrop-blur-xl bg-white/40 dark:bg-slate-900/40 border border-white/20 shadow-lg rounded-xl p-4 flex flex-col ${sizeMap[size]} ${colorClass} ${interactive ? 'hover:scale-[1.02] transition-all duration-200 cursor-pointer' : ''}`}>
            {children}
        </div>
    );
};

export const PowerTreePanel: React.FC<PowerTreePanelProps> = ({ color, result, onOpenRecipeModal, onSendToPizarron }) => {
    const palettes = {
        violet: {
            primary: 'bg-[#A78BFA]/20 border-[#A78BFA]/30',
            secondary: 'bg-[#C4B5FD]/20 border-[#C4B5FD]/30',
            tertiary: 'bg-[#EDE9FE]/20 border-[#EDE9FE]/30',
        },
        cyan: {
            primary: 'bg-[#67E8F9]/20 border-[#67E8F9]/30',
            secondary: 'bg-[#22D3EE]/20 border-[#22D3EE]/30',
            tertiary: 'bg-[#CCFBF1]/20 border-[#CCFBF1]/30',
        },
        accent: {
            orange: 'bg-[#FBBF24]/20 border-[#FBBF24]/30',
            green: 'bg-[#86EFAC]/20 border-[#86EFAC]/30',
            red: 'bg-red-500/10 border-red-500/20',
            gray: 'bg-[#F3F4F6]/20 border-[#F3F4F6]/30',
        }
    };

    const currentPalette = palettes[color];

    return (
        <div className="h-full flex flex-col">
            <h3 className={`text-lg font-bold ${color === 'violet' ? 'text-violet-700' : 'text-cyan-700'} dark:text-white/90 px-2 mb-4`}>Árbol de Poderes</h3>
            <div className="flex-1 overflow-y-auto pr-2">
                {!result ? (
                    <div className="text-center p-10">
                        <p className="text-sm text-slate-500">Analiza o selecciona un resultado para ver sus superpoderes.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4">
                        <Widget size="md-sq" colorClass={currentPalette.primary} interactive>
                            <p className="font-bold">Intensidad Creativa</p>
                            <div className="w-full bg-white/30 rounded-full h-2.5 my-auto">
                                <div className="bg-gradient-to-r from-pink-500 to-yellow-500 h-2.5 rounded-full" style={{ width: `${(Object.values(result.perfilSabor || {}).reduce((a, b) => Number(a) + Number(b), 0) / 70) * 100}%` }}></div>
                            </div>
                        </Widget>
                         <Widget size="sm-sq" colorClass={currentPalette.secondary}>
                            <p className="font-bold text-xs">Rareza Aromática</p>
                            <p className="text-3xl font-bold text-center mt-1">87</p>
                        </Widget>
                        <Widget size="sm-sq" colorClass={palettes.accent.red}>
                            <p className="font-bold text-xs">Riesgo de Ruptura</p>
                            <p className="text-3xl font-bold text-center mt-1">23%</p>
                        </Widget>
                        <Widget size="h-rect" colorClass={currentPalette.tertiary}>
                            <p className="font-bold">Coherencia Técnica</p>
                        </Widget>
                        <Widget size="h-rect" colorClass={palettes.accent.orange} interactive onClick={() => onSendToPizarron && onSendToPizarron('Optimización del Garnish', result.garnishComplejo || 'Sin datos')}>
                            <p className="font-bold">Optimización del Garnish</p>
                        </Widget>
                        <Widget size="md-sq" colorClass={palettes.accent.green} interactive onClick={() => onOpenRecipeModal && onOpenRecipeModal({ storytelling: result.storytelling })}>
                            <p className="font-bold">Mejora de Storytelling</p>
                            <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 mt-1">{result.storytelling || 'Sin datos.'}</p>
                        </Widget>
                        <Widget size="v-rect" colorClass={palettes.cyan.secondary} interactive>
                            <p className="font-bold">Creative Booster</p>
                            <button className="text-sm font-semibold mt-auto p-2 rounded-lg bg-white/50" onClick={() => console.log("TODO: Generate 3 more ideas")}>3 Ideas Rápidas</button>
                        </Widget>
                        <Widget size="v-rect" colorClass={palettes.accent.gray}>
                            <p className="font-bold">Análisis de Complejidad</p>
                        </Widget>
                        <Widget size="lg-sq" colorClass={`${currentPalette.primary} bg-gradient-to-br from-[${palettes.violet.primary}] to-[${palettes.cyan.primary}]`}>
                            <p className="font-bold text-lg">Mapa Sensorial</p>
                        </Widget>
                        <Widget size="h-rect" colorClass={currentPalette.secondary}>
                            <p className="font-bold">Historial de Transformaciones</p>
                        </Widget>
                    </div>
                )}
            </div>
        </div>
    );
};
