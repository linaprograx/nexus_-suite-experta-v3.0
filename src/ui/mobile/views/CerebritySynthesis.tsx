import React, { useState } from 'react';
import { PageName, UserProfile } from '../types';
import GlassCard from '../components/GlassCard';
import PremiumButton from '../components/PremiumButton';

interface Props {
    onNavigate: (page: PageName) => void;
    user?: UserProfile;
}

const CerebritySynthesis: React.FC<Props> = ({ onNavigate }) => {
    const [selectedMode, setSelectedMode] = useState<'auto' | 'assisted' | 'manual'>('auto');

    // Mock suggestions
    const suggestions = [
        { name: 'Summer Sunset', style: 'Tropical', complexity: 'Medium', tags: ['Seasonal', 'Fresh'] },
        { name: 'Midnight Garden', style: 'Botanical', complexity: 'Complex', tags: ['Premium', 'Unique'] },
        { name: 'Classic Reimagined', style: 'Modern Classic', complexity: 'Simple', tags: ['Best-Seller'] },
    ];

    return (
        <div className="bg-transparent relative overflow-hidden flex flex-col h-full">

            {/* Header */}
            <header className="px-5 pt-6 pb-4 relative z-10">
                <div className="mb-6 px-2">
                    <p className="text-[9px] font-bold text-white/60 uppercase tracking-[0.25em] mb-2">Cerebrity IA</p>
                    <h1 className="text-5xl font-black text-white tracking-tighter leading-[0.9] mb-2">Síntesis</h1>
                    <p className="text-xs text-white/70 max-w-xs leading-relaxed">
                        IA genera propuestas creativas basadas en tendencias y tu inventario.
                    </p>
                </div>

                {/* Mode Selection */}
                <div className="flex gap-2">
                    {(['auto', 'assisted', 'manual'] as const).map(mode => (
                        <button
                            key={mode}
                            onClick={() => setSelectedMode(mode)}
                            className={`flex-1 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${selectedMode === mode
                                ? 'bg-white shadow-md'
                                : 'bg-white/10 backdrop-blur-md border border-white/20 text-white/80 hover:bg-white/20'
                                }`}
                            style={selectedMode === mode ? { color: '#FF00CC' } : {}}
                        >
                            {mode}
                        </button>
                    ))}
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto custom-scroll px-5 space-y-4">

                {/* Action Card */}
                <GlassCard rounded="3xl" padding="xl" className="bg-gradient-to-r from-pink-50 to-transparent">
                    <div className="flex items-center gap-5 mb-5">
                        <div className="w-16 h-16 rounded-2xl bg-pink-600 flex items-center justify-center text-white shadow-xl action-glow-pink">
                            <span className="material-symbols-outlined text-3xl fill-1">auto_awesome</span>
                        </div>
                        <div className="flex-1">
                            <h3 className="text-xl font-bold text-zinc-900 mb-1">Generar Nuevos Cócteles</h3>
                            <p className="text-xs text-zinc-600">Basado en tendencias e inventario</p>
                        </div>
                    </div>

                    <PremiumButton
                        customColor="#FF00CC"
                        customGradient="linear-gradient(135deg, #FF00CC 0%, #8F00FF 100%)"
                        variant="gradient"
                        size="lg"
                        fullWidth
                        icon={<span className="material-symbols-outlined !text-base">bolt</span>}
                        iconPosition="right"
                    >
                        SINTETIZAR AHORA
                    </PremiumButton>
                </GlassCard>

                {/* AI Suggestions */}
                <div>
                    <h3 className="text-xs font-black text-white/80 uppercase tracking-wider mb-3 px-2">Sugerencias de IA</h3>
                    {suggestions.map((item, i) => (
                        <GlassCard
                            key={i}
                            rounded="3xl"
                            padding="md"
                            className="mb-3"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <h4 className="text-lg font-bold text-zinc-900">{item.name}</h4>
                                    <p className="text-xs text-zinc-500">{item.style} • {item.complexity}</p>
                                </div>
                                <div className="w-12 h-12 rounded-xl bg-pink-100 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-pink-600 fill-1">science</span>
                                </div>
                            </div>

                            <div className="flex gap-2 mb-3">
                                {item.tags.map(tag => (
                                    <span key={tag} className="px-2 py-1 bg-pink-100 text-pink-700 rounded-full text-[9px] font-bold uppercase tracking-wide">
                                        {tag}
                                    </span>
                                ))}
                            </div>

                            <div className="flex gap-2">
                                <button className="flex-[0.4] py-3 rounded-2xl text-[10px] font-black text-zinc-500 bg-zinc-100 border border-zinc-200 uppercase tracking-wider hover:bg-zinc-200 transition-colors">
                                    Ver
                                </button>
                                <PremiumButton
                                    customColor="#FF00CC"
                                    variant="secondary"
                                    size="md"
                                    className="flex-1"
                                >
                                    Agregar al Menú
                                </PremiumButton>
                            </div>
                        </GlassCard>
                    ))}
                </div>
            </main>
        </div>
    );
};

export default CerebritySynthesis;
