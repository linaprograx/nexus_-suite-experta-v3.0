import React, { useState } from 'react';
import { useDigitalBarScene } from '../../features/digital-bar/useDigitalBarScene';
import { DigitalBarScene } from '../../features/digital-bar/scene/DigitalBarScene';
import { OpsPanel } from '../../features/digital-bar/components/OpsPanel';
import { DigitalBarAnalyticsPanel } from '../../features/digital-bar/components/DigitalBarAnalyticsPanel';
import { Icon } from '../../components/ui/Icon';
import { ICONS } from '../../components/ui/icons';

const DigitalBarView: React.FC = () => {
    const [viewMode, setViewMode] = useState<'holographic' | 'analytics'>('holographic');
    const { sceneState, actions, selectedArea } = useDigitalBarScene();

    return (
        <div className="h-full flex flex-col gap-4 p-4 text-slate-900 dark:text-slate-100 bg-gradient-to-b from-blue-500/90 via-blue-500/40 to-white/10 dark:from-blue-500/40 dark:via-blue-500/20 dark:to-slate-950/20 rounded-3xl">
            {/* Header / Tabs */}
            <div className="flex justify-between items-center bg-white/40 dark:bg-slate-900/40 p-2 rounded-xl border border-white/20 backdrop-blur-sm shadow-sm shrink-0">
                <div className="flex gap-2">
                    <button
                        onClick={() => setViewMode('holographic')}
                        className={`
                            px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wide flex items-center gap-2 transition-all
                            ${viewMode === 'holographic'
                                ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20'
                                : 'text-slate-500 hover:bg-white/50 hover:text-slate-900'}
                        `}
                    >
                        <Icon svg={ICONS.activity} className="w-4 h-4" />
                        Vista Holográfica
                    </button>
                    <button
                        onClick={() => setViewMode('analytics')}
                        className={`
                            px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wide flex items-center gap-2 transition-all
                            ${viewMode === 'analytics'
                                ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20'
                                : 'text-slate-500 hover:bg-white/50 hover:text-slate-900'}
                        `}
                    >
                        <Icon svg={ICONS.chart} className="w-4 h-4" />
                        Métricas & Analytics
                    </button>
                </div>

                <div className="px-4">
                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-2 animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        Sistema Operativo
                    </span>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 min-h-0 relative overflow-hidden rounded-2xl border border-white/20 shadow-xl bg-white/30 dark:bg-slate-900/30 backdrop-blur-md">
                {viewMode === 'holographic' ? (
                    <div className="h-full grid grid-cols-1 lg:grid-cols-3">
                        {/* Scene Canvas (2/3 width) */}
                        <div className="lg:col-span-2 h-full border-b lg:border-b-0 lg:border-r border-white/10 relative">
                            <DigitalBarScene
                                sceneState={sceneState}
                                onSelectArea={actions.selectArea}
                                onSetZoom={actions.setZoom}
                                onSetPan={actions.setPan}
                            />
                        </div>
                        {/* Ops Panel (1/3 width) */}
                        <div className="h-full min-h-0 flex flex-col relative z-20 bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl shadow-md shadow-black/5 overflow-y-auto !bg-white/40 dark:!bg-slate-900/80 !shadow-none !rounded-none !border-l border-white/10">
                            <OpsPanel
                                selectedArea={selectedArea}
                                workers={sceneState.workers}
                            />
                        </div>
                    </div>
                ) : (
                    <DigitalBarAnalyticsPanel />
                )}
            </div>
        </div>
    );
};

export default DigitalBarView;

