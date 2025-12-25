import React, { useState } from 'react';
import { useItemContext, GrimoriumLayer, GrimoriumViewMode } from '../../../context/Grimorium/ItemContext';
import { Icon } from '../../../components/ui/Icon';
import { ICONS } from '../../../components/ui/icons';
import { IntelPreferencesPanel } from '../../../features/learning/components/IntelPreferencesPanel';

// Toolbar for Grimorium View (Recipes, Stock, Market)
export const GrimoriumToolbar: React.FC = () => {
    const { viewMode, setViewMode, activeLayer, toggleLayer } = useItemContext();
    const [showIntelPanel, setShowIntelPanel] = useState(false);

    // Helper for View Mode Buttons (The "Tabs")
    const ViewButton = ({ mode, label, colorClass }: { mode: GrimoriumViewMode, label: string, colorClass: string }) => {
        const isActive = viewMode === mode;
        const baseClass = "flex-shrink-0 py-2 px-5 text-sm font-semibold rounded-full transition-all duration-300";
        const activeClass = `${colorClass} text-white shadow-md transform scale-105`;
        const inactiveClass = "text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800";

        return (
            <button
                onClick={() => setViewMode(mode)}
                className={`${baseClass} ${isActive ? activeClass : inactiveClass}`}
            >
                {label}
            </button>
        );
    };

    // Helper for Layer Toggles (The "Tools")
    const LayerToggle = ({ layer, label, icon, colorClass }: { layer: GrimoriumLayer, label: string, icon: string, colorClass: string }) => {
        const isActive = activeLayer === layer;
        const baseClass = "flex items-center gap-2 py-1.5 px-4 text-xs font-semibold rounded-full transition-all duration-300 border border-transparent";
        // Active: Filled with color
        const activeClass = `${colorClass} text-white shadow-sm`;
        // Inactive: Ghost with hover
        const inactiveClass = "text-slate-500 hover:bg-white/50 dark:hover:bg-slate-800/50 hover:border-slate-200 dark:hover:border-slate-700";

        return (
            <button
                onClick={() => toggleLayer(layer)}
                className={`${baseClass} ${isActive ? activeClass : inactiveClass}`}
                title={`Toggle ${label} Layer`}
            >
                <Icon svg={icon} className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className="hidden sm:inline">{label}</span>
            </button>
        );
    };

    return (
        <div className="flex items-center w-full max-w-full overflow-x-auto no-scrollbar justify-between pr-2">
            {/* LEFT: Core Views (The "Where am I?") */}
            <div className="flex items-center gap-2">
                <ViewButton mode="recipes" label="Recetas" colorClass="bg-indigo-600" />
                <ViewButton mode="stock" label="Stock" colorClass="bg-sky-500" />
                <ViewButton mode="market" label="Market" colorClass="bg-emerald-600" />
            </div>

            {/* DIVIDER */}
            <div className="h-6 w-px bg-slate-300 dark:bg-slate-700 mx-4 hidden sm:block"></div>

            {/* RIGHT: Functional Layers (The "What tool am I using?") */}
            <div className="flex items-center gap-2">
                {/* Intel / Brain Preferences */}
                <button
                    onClick={() => setShowIntelPanel(true)}
                    className="p-1.5 rounded-full text-slate-400 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors mr-1"
                    title="Inteligencia Activa"
                >
                    <Icon svg={ICONS.sparkles} className="w-5 h-5 text-amber-400 dark:text-amber-300" />
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

            {showIntelPanel && <IntelPreferencesPanel onClose={() => setShowIntelPanel(false)} />}
        </div>
    );
};
