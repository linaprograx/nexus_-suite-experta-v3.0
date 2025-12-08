import React, { useState } from 'react';
import DtoXView from './avatar/DtoXView';

interface AvatarViewProps {
    // Add props if needed (e.g., global state)
}

const AvatarView: React.FC<AvatarViewProps> = () => {
    const [activeTab, setActiveTab] = useState<'dto-x'>('dto-x');

    return (
        <div className="flex flex-col h-full bg-slate-900 border-l border-slate-800 relative overflow-hidden">
            {/* Background Gradient - Stealth/Tech Vibe */}
            <div className="absolute inset-0 bg-[linear-gradient(150deg,#4F556E_0%,#30323F_50%,rgba(0,0,0,0)_100%)] opacity-80 pointer-events-none" />

            {/* Header / Sub-Nav */}
            <div className="h-16 flex items-center justify-between px-6 border-b border-slate-700/50 backdrop-blur-md relative z-10">
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-slate-700/50 rounded-lg border border-slate-600/50 shadow-inner">
                        <span className="text-xl">📡</span>
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-100 tracking-tight">AVATAR</h1>
                        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                            Digital Twin Operations
                        </p>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="flex bg-slate-800/50 p-1 rounded-xl border border-slate-700/50 backdrop-blur-sm">
                    <button
                        onClick={() => setActiveTab('dto-x')}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'dto-x'
                                ? 'bg-indigo-500/20 text-indigo-200 shadow-sm border border-indigo-500/30'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                            }`}
                    >
                        DTO-X
                    </button>
                    {/* Future tabs can be added here */}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-hidden relative z-10 p-6">
                {activeTab === 'dto-x' && <DtoXView />}
            </div>
        </div>
    );
};

export default AvatarView;
