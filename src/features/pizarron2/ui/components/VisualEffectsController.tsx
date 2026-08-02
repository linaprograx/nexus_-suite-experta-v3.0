import React from 'react';

type Shadow = { color: string; blur: number; offsetX: number; offsetY: number } | null;

/** Nodo mínimo que este control necesita leer y modificar. */
interface EfectoTarget {
    id: string;
    content?: any;
}

interface VisualEffectsControllerProps {
    /**
     * Nodos sobre los que actúa. El primero define los valores que se muestran.
     *
     * La firma pide el nodo entero —no cuatro props sueltas— a propósito. Antes
     * cada llamante pasaba `opacity={1} borderWidth={0} borderRadius={0}` a
     * mano y construía su propio parche, y los cinco inspectores acabaron
     * descartando un subconjunto distinto de campos: unos perdían el redondeo,
     * otros la sombra. Con los valores leídos aquí y el parche construido aquí,
     * olvidarse de uno deja de ser posible.
     */
    targets: EfectoTarget[];
    /** Persiste el parche de `content` ya construido, nodo a nodo. */
    onApply: (nodeId: string, contentPatch: Record<string, any>) => void;
    /** Sombra por defecto al activarla; algunos tipos la quieren más marcada. */
    defaultShadow?: Exclude<Shadow, null>;
}

const SOMBRA_POR_DEFECTO = { color: 'rgba(0,0,0,0.1)', blur: 10, offsetX: 0, offsetY: 4 };

export const VisualEffectsController: React.FC<VisualEffectsControllerProps> = ({
    targets,
    onApply,
    defaultShadow = SOMBRA_POR_DEFECTO,
}) => {
    const primero = targets[0]?.content ?? {};
    const borderRadius: number = primero.borderRadius ?? 0;
    const borderWidth: number = primero.borderWidth ?? 0;
    const opacity: number = primero.opacity ?? 1;
    const shadow: Shadow = primero.filters?.shadow ?? null;

    /** Aplica a cada nodo, respetando el resto de sus `filters`. */
    const aplicar = (cambio: { borderRadius?: number; borderWidth?: number; opacity?: number; shadow?: Shadow }) => {
        targets.forEach(n => {
            const patch: Record<string, any> = {};
            if (cambio.borderRadius !== undefined) patch.borderRadius = cambio.borderRadius;
            if (cambio.borderWidth !== undefined) patch.borderWidth = cambio.borderWidth;
            if (cambio.opacity !== undefined) patch.opacity = cambio.opacity;
            if (cambio.shadow !== undefined) {
                patch.filters = { ...(n.content?.filters ?? {}), shadow: cambio.shadow };
            }
            if (Object.keys(patch).length > 0) onApply(n.id, patch);
        });
    };

    if (targets.length === 0) return null;

    return (
        <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-700 pb-1 mb-2">Visual Effects</h4>

            {/* Border Radius & Width */}
            <div className="grid grid-cols-2 gap-2">
                <div>
                    <label className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1">Rounding</label>
                    <div className="flex items-center gap-2">
                        <input
                            type="range"
                            min="0"
                            max="50"
                            className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                            value={borderRadius}
                            onChange={(e) => aplicar({ borderRadius: parseInt(e.target.value) })}
                        />
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 w-4">{borderRadius}</span>
                    </div>
                </div>
                <div>
                    <label className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1">Border Thickness</label>
                    <div className="flex items-center gap-2">
                        <input
                            type="range"
                            min="0"
                            max="20"
                            className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                            value={borderWidth}
                            onChange={(e) => aplicar({ borderWidth: parseInt(e.target.value) })}
                        />
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 w-4">{borderWidth}</span>
                    </div>
                </div>
            </div>

            {/* Opacity */}
            <div>
                <label className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1">Opacity</label>
                <div className="flex items-center gap-2">
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                        value={opacity}
                        onChange={(e) => aplicar({ opacity: parseFloat(e.target.value) })}
                    />
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 w-6">{(opacity * 100).toFixed(0)}%</span>
                </div>
            </div>

            {/* Shadow Toggle */}
            <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Drop Shadow</label>
                <button
                    onClick={() => aplicar({ shadow: shadow ? null : defaultShadow })}
                    aria-pressed={!!shadow}
                    className={`w-10 h-5 rounded-full p-0.5 flex items-center transition-colors ${shadow ? 'bg-orange-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                >
                    <div className={`w-4 h-4 rounded-full bg-white shadow transform transition-transform ${shadow ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
            </div>
        </div>
    );
};
