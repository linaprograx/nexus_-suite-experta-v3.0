import React, { useState } from 'react';
import { useItemContext, GrimoriumLayer, GrimoriumViewMode } from '../../../context/Grimorium/ItemContext';
import { Icon } from '../../../components/ui/Icon';
import { ICONS } from '../../../components/ui/icons';
import { IntelPreferencesPanel } from '../../../features/learning/components/IntelPreferencesPanel';

// Toolbar for Grimorium View (Recipes, Stock, Market)
export const GrimoriumToolbar: React.FC = () => {
    const { viewMode, setViewMode, activeLayer, toggleLayer } = useItemContext();
    const [showIntelPanel, setShowIntelPanel] = useState(false);

    // Color Mapping for Text matching the old bg classes
    const getColorStyle = (mode: GrimoriumViewMode) => {
        switch (mode) {
            case 'recipes': return '#7c3aed'; // violet-600
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
                className={`
                  relative px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest 
                  flex items-center gap-2 transition-all duration-300
                  ${isActive
                        ? 'bg-white shadow-xl scale-105'
                        : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
                    }
                `}
                style={{ color: isActive ? color : undefined }}
            >
                <span>{label}</span>
            </button>
        );
    };

    // Helper for Layer Toggles (The "Tools") - MIGRATOR STYLE
    const LayerToggle = ({ layer, label, icon, colorClass }: { layer: GrimoriumLayer, label: string, icon: string, colorClass: string }) => {
        const isActive = activeLayer === layer;

        // Extract hex from colorClass approx or hardcode for now for simplicity, 
        // or just use text class if active? 
        // Let's stick to simple text classes for tools for now, or match the Pill style if desired.
        // User asked to style "Grimorio Desktop" like "Grimorio Mobile". 
        // Mobile screenshot 4 doesn't show these tools clearly, but let's make them consistent pills too.

        return (
            <button
                onClick={() => toggleLayer(layer)}
                className={`
                  relative px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider
                  flex items-center gap-2 transition-all duration-300 border
                  ${isActive
                        ? 'bg-white shadow-md border-transparent' // Active: White bg
                        : 'bg-white/10 text-white border-white/10 hover:bg-white/20' // Inactive: Glass
                    }
                `}
                // We'll use the colorClass to text color if active
                title={`Toggle ${label} Layer`}
            >
                <Icon svg={icon} className={`w-4 h-4 ${isActive ? colorClass.replace('bg-', 'text-') : 'text-white'}`} />
                <span className={`${isActive ? colorClass.replace('bg-', 'text-') : 'text-white'}`}>{label}</span>
            </button>
        );
    };

    return (
        <div className="flex flex-col w-full">
            {/* 1. MIGRATOR STYLE HEADER TITLE */}
            <div className="mb-6 pl-2 z-10 text-white relative">
                <h1 className="text-7xl font-black italic tracking-tighter leading-[0.8] mb-1 drop-shadow-xl"
                    style={{ fontFamily: 'Georgia, serif', textShadow: '0 4px 30px rgba(0,0,0,0.3)' }}>
                    Grimorio
                </h1>
                <p className="text-xl font-bold tracking-widest uppercase opacity-90 pl-1">
                    Recetario Maestro
                </p>
            </div>

            {/* 2. NAVIGATION ROW */}
            <div className="flex items-center w-full max-w-full overflow-x-auto p-2 scrollbar-hide justify-between">
                {/* LEFT: Core Views (The Pill Tabs) */}
                <div className="flex gap-3">
                    <ViewButton mode="recipes" label="RECETAS" />
                    <ViewButton mode="stock" label="INVENTARIO" />
                    <ViewButton mode="market" label="MERCADO" />
                </div>

                {/* RIGHT: Functional Layers (Tools) */}
                <div className="flex items-center gap-2">
                    {/* Intel / Brain Preferences */}
                    <button
                        onClick={() => setShowIntelPanel(true)}
                        className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 border border-white/10 transition-colors"
                        title="Inteligencia Activa"
                    >
                        <Icon svg={ICONS.sparkles} className="w-5 h-5 text-amber-300" />
                    </button>

                    {/* Cost Layer (Escandallo) */}
                    <LayerToggle
                        layer="cost"
                        label="Costes"
                        icon={ICONS.chart}
                        colorClass="bg-rose-500"
                    />

                    {/* Optimization Layer (Zero Waste) */}
                    <LayerToggle
                        layer="optimization"
                        label="Zero Waste"
                        icon={ICONS.refresh}
                        colorClass="bg-lime-500"
                    />
                </div>
            </div>

            {showIntelPanel && <IntelPreferencesPanel onClose={() => setShowIntelPanel(false)} />}
        </div>
    );
};
