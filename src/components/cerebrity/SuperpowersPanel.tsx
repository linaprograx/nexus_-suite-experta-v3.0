import React from 'react';
import { CerebrityResult } from '../../../types';
import { Icon } from '../ui/Icon';
import { ICONS } from '../ui/icons';

interface SuperpowersPanelProps {
    result: CerebrityResult | null;
    color: 'violet' | 'cyan';
}

const WidgetCard: React.FC<{ size: 'S' | 'M' | 'L' | 'XL', children: React.ReactNode, className?: string }> = ({ size, children, className = '' }) => {
    const sizeClasses = {
        S: 'min-h-[80px]',
        M: 'min-h-[112px] md:col-span-2',
        L: 'min-h-[192px] md:col-span-2',
        XL: 'min-h-[240px] md:col-span-2',
    };
    return (
        <div className={`backdrop-blur-xl bg-white/40 dark:bg-slate-900/40 border border-white/20 shadow-lg rounded-xl p-4 flex flex-col hover:scale-[1.02] transition-all duration-200 ${sizeClasses[size]} ${className}`}>
            {children}
        </div>
    );
};


export const SuperpowersPanel: React.FC<SuperpowersPanelProps> = ({ result, color }) => {
    const accentColor = color === 'violet' ? '#A275F7' : '#6bcad8';

    return (
        <div className="h-full flex flex-col">
            <h3 className={`text-sm font-bold text-${color}-800 dark:text-${color}-200 px-2 mb-3`}>Árbol de Poderes</h3>
            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <WidgetCard size="S">
                        <p className="font-bold text-xs">Intensidad Creativa</p>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 mt-auto">
                            <div className="bg-gradient-to-r from-pink-500 to-yellow-500 h-1.5 rounded-full" style={{ width: '75%' }}></div>
                        </div>
                    </WidgetCard>
                    <WidgetCard size="S">
                         <p className="font-bold text-xs">Rareza Aromática</p>
                         <p className="text-2xl font-bold text-center mt-1">92</p>
                    </WidgetCard>
                     <WidgetCard size="S">
                        <p className="font-bold text-xs">Coherencia Técnica</p>
                         <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 mt-auto">
                            <div className="bg-gradient-to-r from-green-400 to-blue-500 h-1.5 rounded-full" style={{ width: '88%' }}></div>
                        </div>
                    </WidgetCard>
                    <WidgetCard size="S">
                        <p className="font-bold text-xs">Riesgo de Ruptura</p>
                        <p className="text-2xl font-bold text-center mt-1 text-red-500">12%</p>
                    </WidgetCard>

                    <WidgetCard size="M">
                        <p className="font-bold text-sm">Optimización del Garnish</p>
                        <button className="text-xs text-slate-500 mt-auto text-left" onClick={() => console.log('Open Garnish Panel')}>Click to expand details...</button>
                    </WidgetCard>

                     <WidgetCard size="M">
                        <p className="font-bold text-sm">Mejora de Storytelling</p>
                         <p className="text-xs text-slate-500 line-clamp-2 mt-1">"Una narrativa que evoca la brisa del Mediterráneo en una tarde de verano..."</p>
                    </WidgetCard>
                    
                    <WidgetCard size="L">
                         <p className="font-bold text-base">Creative Booster Avanzado</p>
                         <button className="text-sm font-semibold mt-auto p-2 rounded-lg bg-white/50" onClick={() => console.log("TODO: Generate 3 more ideas")}>Desplegar 3 Ideas Rápidas</button>
                    </WidgetCard>

                    <WidgetCard size="L">
                         <p className="font-bold text-base">Visual Styler Pro</p>
                         <div className="text-xs space-y-2 mt-2">
                            <p className="truncate">1. "Ethereal cocktail, glowing mist..."</p>
                            <p className="truncate">2. "Minimalist presentation, single orchid..."</p>
                            <p className="truncate">3. "Dark and moody, film noir style..."</p>
                         </div>
                    </WidgetCard>

                    <WidgetCard size="XL">
                        <p className="font-bold text-lg">Panel Sinestésico Total</p>
                        <div className="flex gap-2 mt-2">
                            <div className="w-6 h-6 rounded-full bg-yellow-300"></div>
                            <div className="w-6 h-6 rounded-full bg-purple-400"></div>
                            <div className="w-6 h-6 rounded-full bg-green-300"></div>
                        </div>
                         <p className="text-xs text-slate-500 mt-2">Sabores: Dulce, Herbal, Cítrico</p>
                    </WidgetCard>
                     <WidgetCard size="M">
                        <p className="font-bold text-sm">Mapeo de Sabores</p>
                        <div className="flex-1 flex items-center justify-center">
                            <Icon svg={ICONS.settings} className="w-8 h-8 text-slate-400" />
                        </div>
                    </WidgetCard>
                </div>
            </div>
        </div>
    );
};
