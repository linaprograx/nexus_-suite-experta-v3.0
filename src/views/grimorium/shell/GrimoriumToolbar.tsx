import React, { useState } from 'react';
import { useItemContext, GrimoriumLayer, GrimoriumViewMode } from '../../../context/Grimorium/ItemContext';
import { Icon } from '../../../components/ui/Icon';
import { ICONS } from '../../../components/ui/icons';
import { IntelPreferencesPanel } from '../../../features/learning/components/IntelPreferencesPanel';
import { AuditLogModal } from '../../../components/grimorium/AuditLogModal';
import { ActiveMenuModal } from '../../../components/grimorium/ActiveMenuModal';
import { IdentityReportModal } from '../../../features/identity/IdentityReportModal';
import { fijarAlcanceCarta } from '../../../hooks/useAlcanceCarta';

// Toolbar for Grimorium View (Recipes, Stock, Market)
export const GrimoriumToolbar: React.FC = () => {
    const { viewMode, setViewMode, activeLayer, toggleLayer } = useItemContext();
    const [showIntelPanel, setShowIntelPanel] = useState(false);
    const [showAuditLog, setShowAuditLog] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [showDuplicados, setShowDuplicados] = useState(false);

    /**
     * El rótulo, por pestaña.
     *
     * Decía «Recetario Maestro» también en Inventario y en Mercado, que no son
     * un recetario. Un rótulo que no cambia con la pantalla deja de leerse, y
     * mientras tanto miente en dos de cada tres.
     */
    const rotuloDe = (mode: GrimoriumViewMode) => {
        switch (mode) {
            case 'recipes': return 'Recetario Maestro';
            case 'stock': return 'Existencias y Reglas';
            case 'market': return 'Catálogo y Proveedores';
        }
    };

    // Color Mapping for Text matching the old bg classes
    const getColorStyle = (mode: GrimoriumViewMode) => {
        switch (mode) {
            case 'recipes': return '#0d9488'; // teal-600 (aqua green, matches gradient)
            case 'stock': return '#0284c7'; // sky-600
            case 'market': return '#059669'; // emerald-600
        }
    };

    // Helper for View Mode Buttons (The "Tabs") - MIGRATOR STYLE PILLS
    const ViewButton = ({ mode, label }: { mode: GrimoriumViewMode, label: string }) => {
        const isActive = viewMode === mode;
        const color = getColorStyle(mode);

        return (
            <button
                onClick={() => setViewMode(mode)}
                // No horizontal padding on mobile: the grid gives each tab an equal
                // third of the width, so padding would only push the label into an
                // ellipsis. Desktop keeps the roomy pill.
                className={`
                  relative w-full lg:w-auto px-2 lg:px-6 h-10 rounded-full text-[11px] lg:text-xs font-black uppercase tracking-wider lg:tracking-widest
                  flex items-center justify-center gap-2 transition-all duration-300
                  ${isActive
                        ? 'bg-white shadow-xl lg:scale-105'
                        : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
                    }
                `}
                style={{ color: isActive ? color : undefined }}
            >
                <span className="truncate">{label}</span>
            </button>
        );
    };

    /**
     * Secondary actions. Icon-only below lg — five labelled pills cannot fit on a
     * phone, and the old single scrolling strip solved that by pushing the three
     * primary tabs off-screen, which hid navigation behind a sideways swipe.
     */
    const ActionButton = ({ onClick, icon, label, iconClass, title }: {
        onClick: () => void; icon: string; label: string; iconClass: string; title: string;
    }) => (
        <button
            onClick={onClick}
            title={title}
            aria-label={label}
            className="shrink-0 h-10 px-3 lg:px-4 rounded-full bg-white/10 text-white hover:bg-white/20 border border-white/10 transition-all duration-300 flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
        >
            <Icon svg={icon} className={`w-4 h-4 ${iconClass}`} />
            <span className="hidden lg:inline">{label}</span>
        </button>
    );

    // `LayerToggle` vive FUERA del componente (más abajo). Definido aquí dentro,
    // React lo trataba como un tipo nuevo en cada render y lo remontaba entero:
    // coste innecesario, pérdida de estado y nodos del DOM que se sustituyen bajo
    // los pies de quien esté midiendo.


    return (
        <div className="flex flex-col w-full">
            {/* 1. TÍTULO — fijo, no se pliega.
                Ver la decisión «La franja de Grimorio NO se pliega» en CONTEXT.md.
                Aquí vivía una rama para plegarlo que ya no activaba nadie: código
                muerto que además seguía viajando en el bundle. */}
            <div className="pl-2 z-10 text-white relative mb-2 lg:mb-6">
                <h1 className="text-[2.25rem] lg:text-7xl font-black italic tracking-tighter leading-[0.8] mb-1 drop-shadow-xl"
                    style={{ fontFamily: 'Georgia, serif', textShadow: '0 4px 30px rgba(0,0,0,0.3)' }}>
                    Grimorio
                </h1>
                <p className="text-sm lg:text-xl font-bold tracking-widest uppercase opacity-90 pl-1">
                    {rotuloDe(viewMode)}
                </p>
            </div>

            {/* 2. NAVIGATION
                Two tiers on mobile, one row on desktop. The three view tabs are
                primary navigation and must never scroll out of sight, so they get
                their own full-width row; the secondary actions sit underneath as
                icons. Previously both shared one overflow-x-auto strip, which meant
                switching to Inventario required discovering a sideways swipe. */}
            <div className="flex flex-col gap-2 w-full p-2 lg:flex-row lg:items-center lg:justify-between lg:gap-4">

                {/* Primary: the three views. Equal thirds — no scroll, no ellipsis. */}
                <div className="grid grid-cols-3 gap-2 w-full lg:flex lg:w-auto lg:gap-3 shrink-0">
                    <ViewButton mode="recipes" label="RECETAS" />
                    <ViewButton mode="stock" label="INVENTARIO" />
                    <ViewButton mode="market" label="MERCADO" />
                </div>

                {/* Secondary: tools. Spread edge to edge on mobile so every target
                    lands under a thumb; right-aligned and labelled on desktop. */}
                <div className="flex items-center justify-between gap-1.5 w-full lg:w-auto lg:justify-end lg:gap-2">
                    <ActionButton
                        onClick={() => setShowIntelPanel(true)}
                        icon={ICONS.sparkles}
                        label="IA"
                        iconClass="text-amber-300"
                        title="Inteligencia Activa — preferencias del asistente"
                    />
                    <ActionButton
                        onClick={() => setShowAuditLog(true)}
                        icon={ICONS.shield || ICONS.clock}
                        label="Historial"
                        iconClass="text-sky-300"
                        title="Historial de acciones del asistente"
                    />
                    <ActionButton
                        onClick={() => setShowMenu(true)}
                        icon={ICONS.book}
                        label="Carta"
                        iconClass="text-emerald-300"
                        title="Carta activa — recetas publicadas y su desviación de coste"
                    />
                    <ActionButton
                        onClick={() => setShowDuplicados(true)}
                        icon={ICONS.copy}
                        label="Duplicados"
                        iconClass="text-indigo-300"
                        title="Informe de productos duplicados — solo lectura"
                    />

                    {/* Cost Layer (Escandallo) */}
                    <LayerToggle
                        activeLayer={activeLayer} toggleLayer={toggleLayer}
                        layer="cost"
                        label="Costes"
                        icon={ICONS.chart}
                        colorClass="bg-rose-500"
                    />

                    {/* Zero Waste ya no tiene icono propio: vive como tercera pestaña
                        dentro de «Rentabilidad y producción». Seis iconos no caben con
                        holgura bajo un pulgar, y las tres son herramientas de coste
                        sobre una receta. Ver HerramientasTabs. */}
                </div>
            </div>

            {showIntelPanel && <IntelPreferencesPanel onClose={() => setShowIntelPanel(false)} />}
            {showAuditLog && <AuditLogModal onClose={() => setShowAuditLog(false)} />}
            {showDuplicados && <IdentityReportModal onClose={() => setShowDuplicados(false)} />}
            {showMenu && (
                <ActiveMenuModal
                    onClose={() => {
                        setShowMenu(false);
                        // Al cerrar el panel, Recetas se queda mostrando solo la
                        // carta: "para lo que sería útil, como crear un espacio de
                        // trabajo dentro de Recetas". Se sale desde el aviso que
                        // aparece sobre el listado.
                        fijarAlcanceCarta(true);
                    }}
                />
            )}
        </div>
    );
};

const LayerToggle: React.FC<{
    layer: GrimoriumLayer; label: string; icon: string; colorClass: string;
    activeLayer: GrimoriumLayer; toggleLayer: (l: GrimoriumLayer) => void;
}> = ({ layer, label, icon, colorClass, activeLayer, toggleLayer }) => {
        const isActive = activeLayer === layer;

        // Extract hex from colorClass approx or hardcode for now for simplicity, 
        // or just use text class if active? 
        // Let's stick to simple text classes for tools for now, or match the Pill style if desired.
        // User asked to style "Grimorio Desktop" like "Grimorio Mobile". 
        // Mobile screenshot 4 doesn't show these tools clearly, but let's make them consistent pills too.

        const tint = isActive ? colorClass.replace('bg-', 'text-') : 'text-white';

        return (
            <button
                onClick={() => toggleLayer(layer)}
                className={`
                  shrink-0 h-10 px-3 lg:px-4 rounded-full text-xs font-bold uppercase tracking-wider
                  flex items-center gap-2 transition-all duration-300 border
                  ${isActive
                        ? 'bg-white shadow-md border-transparent' // Active: White bg
                        : 'bg-white/10 text-white border-white/10 hover:bg-white/20' // Inactive: Glass
                    }
                `}
                title={`Toggle ${label} Layer`}
                aria-pressed={isActive}
                aria-label={label}
            >
                <Icon svg={icon} className={`w-4 h-4 ${tint}`} />
                <span className={`hidden lg:inline ${tint}`}>{label}</span>
            </button>
        );
    };
