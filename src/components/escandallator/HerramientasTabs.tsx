import React from 'react';
import { Icon } from '../ui/Icon';
import { ICONS } from '../ui/icons';

export type HerramientaActiva = 'calculator' | 'production' | 'zerowaste';

/**
 * Sub-navegación de «Rentabilidad y producción».
 *
 * Vive fuera del panel de escandallo porque la comparten **dos capas**:
 * Rentabilidad y Batcher pintan la capa `cost`, mientras que Zero Waste tiene
 * capa propia (`optimization`), con su barra lateral y su cabecera. Si Zero
 * Waste se hubiera metido como una pestaña más *dentro* del panel de coste,
 * habría perdido todo eso.
 *
 * El motivo de agruparlas: en un móvil la barra de Grimorio llevaba seis
 * iconos, y seis no caben con holgura bajo un pulgar. Zero Waste era el que
 * menos se usa a diario y el que más encaja aquí, porque las tres son
 * herramientas de coste sobre una receta.
 */
export const HerramientasTabs: React.FC<{
    activa: HerramientaActiva;
    onSelect: (h: HerramientaActiva) => void;
}> = ({ activa, onSelect }) => {
    const Pastilla = ({ id, label, icon, activo }: {
        id: HerramientaActiva; label: string; icon: string; activo: string;
    }) => (
        <button
            onClick={() => onSelect(id)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${activa === id
                ? `${activo} text-white shadow-md`
                : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
        >
            <div className="flex items-center gap-1.5">
                <Icon svg={icon} className="w-3.5 h-3.5" />
                <span>{label}</span>
            </div>
        </button>
    );

    return (
        <div className="flex items-center justify-center pt-6 pb-4 gap-2 sm:gap-4 flex-shrink-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md sticky top-0 z-20 shadow-sm border-b border-rose-100 dark:border-rose-900/20">
            <Pastilla id="calculator" label="Rentabilidad" icon={ICONS.chart} activo="bg-rose-500 ring-2 ring-rose-500/20" />
            <Pastilla id="production" label="Batcher" icon={ICONS.layers} activo="bg-amber-500 ring-2 ring-amber-500/20" />
            <Pastilla id="zerowaste" label="Zero Waste" icon={ICONS.refresh} activo="bg-lime-500 ring-2 ring-lime-500/20" />
        </div>
    );
};
