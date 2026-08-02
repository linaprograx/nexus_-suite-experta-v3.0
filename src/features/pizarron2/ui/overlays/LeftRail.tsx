import React, { useEffect, useState } from 'react';
import { pizarronStore } from '../../state/store';
import { TOOLS, Tool, handleTool, herramientaActiva, herramientaPermitida } from './pizarronTools';

/**
 * Rail vertical de herramientas. Solo escritorio.
 *
 * En móvil lo sustituye `MobileToolStrip`: doce herramientas en columna ocupan
 * 464px de alto sobre el lienzo, que es más de la mitad del espacio útil de un
 * teléfono. La lista y el comportamiento viven en `pizarronTools`, compartidos
 * por ambas presentaciones.
 */
export const LeftRail: React.FC = () => {
    const activeTool = pizarronStore.useSelector(s => s.uiFlags.activeTool);
    const showLibrary = pizarronStore.useSelector(s => s.uiFlags.showLibrary);
    const showProjectManager = pizarronStore.useSelector(s => s.uiFlags.showProjectManager);
    const mode = pizarronStore.useSelector(s => s.interactionState.mode);

    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);

    return (
        <div className={`hidden lg:flex absolute left-4 top-1/2 -translate-y-1/2 gap-2 pointer-events-auto items-start transition-all duration-700 ease-out-expo ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'}`}>
            {/* Main Strip */}
            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur shadow-sm border border-slate-200 dark:border-slate-700 rounded-2xl p-2 flex flex-col gap-2">
                {TOOLS.map((tool: Tool, i) => {
                    if (!herramientaPermitida(tool, mode)) return null;

                    if (tool.type === 'separator') {
                        return <div key={`sep-${i}`} className="h-px w-6 bg-slate-200 dark:bg-slate-700 mx-auto my-1" />;
                    }

                    const isActive = herramientaActiva(tool, { activeTool, showLibrary, showProjectManager });

                    return (
                        <button
                            key={tool.id}
                            onClick={() => handleTool(tool)}
                            className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200 ${isActive
                                ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-700 scale-105 shadow-sm'
                                : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 border border-transparent hover:scale-110'
                                }`}
                            title={tool.hint ? `${tool.label} (${tool.hint})` : tool.label}
                        >
                            {tool.icon}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
