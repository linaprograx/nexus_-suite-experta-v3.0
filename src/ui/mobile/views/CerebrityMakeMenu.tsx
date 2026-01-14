import React, { useState } from 'react';
import { PageName, UserProfile } from '../types';
import GlassCard from '../components/GlassCard';
import PremiumButton from '../components/PremiumButton';
import { CerebrityHeader } from '../components/CerebrityHeader';
import { useRecipes } from '../../../hooks/useRecipes';
import { useApp } from '../../../context/AppContext';

interface Props {
    onNavigate: (page: PageName) => void;
    user?: UserProfile;
}

const CerebrityMakeMenu: React.FC<Props> = ({ onNavigate }) => {
    const { db, userId } = useApp();
    const { recipes, isLoading } = useRecipes();

    // Group recipes by sections (mock for now - could be actual categories from recipes)
    const sections = [
        {
            name: 'Clásicos',
            recipes: recipes.filter(r => r.categorias?.includes('Clásico') || !r.categorias?.length).slice(0, 8),
            category: 'Tradicional'
        },
        {
            name: 'Signature',
            recipes: recipes.filter(r => r.categorias?.includes('Signature')).slice(0, 5),
            category: 'Especial de la Casa'
        },
        {
            name: 'Temporada',
            recipes: recipes.filter(r => r.categorias?.includes('Temporada')).slice(0, 6),
            category: 'Tiempo Limitado'
        },
    ];

    return (
        <div className="bg-transparent relative overflow-hidden flex flex-col h-full">

            {/* Header */}
            <CerebrityHeader
                currentPage={PageName.CerebrityMakeMenu}
                onNavigate={onNavigate}
            />

            {/* View Title Overlay (Large text as per user request) */}
            <div className="px-7 -mt-2 mb-4 relative z-10">
                <h2 className="text-4xl font-black text-zinc-900 tracking-tighter leading-none opacity-80 uppercase">
                    Make Menu
                </h2>
                <p className="text-xs text-zinc-500 mt-1 font-bold uppercase tracking-widest opacity-60">
                    Optimization Engine
                </p>
            </div>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto custom-scroll px-5 pb-32 space-y-4">

                {/* Generate Card */}
                <GlassCard rounded="3xl" padding="xl" className="bg-gradient-to-r from-yellow-50 to-transparent">
                    <div className="flex items-center gap-5 mb-5">
                        <div className="w-16 h-16 rounded-2xl bg-yellow-500 flex items-center justify-center text-white shadow-xl" style={{ boxShadow: '0 0 20px rgba(255, 230, 0, 0.4)' }}>
                            <span className="material-symbols-outlined text-3xl fill-1">edit_note</span>
                        </div>
                        <div className="flex-1">
                            <h3 className="text-xl font-bold text-zinc-900 mb-1">Generar Menú</h3>
                            <p className="text-xs text-zinc-600">Selección optimizada por IA</p>
                        </div>
                    </div>

                    <PremiumButton
                        customColor="#FFE600"
                        customGradient="linear-gradient(135deg, #FFE600 0%, #FFB800 100%)"
                        variant="gradient"
                        size="lg"
                        fullWidth
                        icon={<span className="material-symbols-outlined !text-base">auto_awesome</span>}
                        iconPosition="right"
                    >
                        GENERAR MENÚ
                    </PremiumButton>
                </GlassCard>

                {/* Current Sections - Shows REAL recipes */}
                <div>
                    <h3 className="text-xs font-black text-zinc-900 uppercase tracking-wider mb-3 px-2 drop-shadow-sm">Menú Actual</h3>

                    {isLoading ? (
                        <div className="flex justify-center py-10">
                            <span className="material-symbols-outlined animate-spin text-yellow-500">sync</span>
                        </div>
                    ) : recipes.length > 0 ? sections.map((section, i) => {
                        const sectionRecipes = section.recipes;
                        if (sectionRecipes.length === 0) return null;

                        return (
                            <GlassCard
                                key={i}
                                rounded="3xl"
                                padding="md"
                                className="mb-3"
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex-1">
                                        <h4 className="text-lg font-bold text-zinc-900 mb-1">{section.name}</h4>
                                        <p className="text-xs text-zinc-500">{sectionRecipes.length} recetas • {section.category}</p>
                                    </div>
                                    <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center">
                                        <span className="text-xl font-black text-yellow-700">{sectionRecipes.length}</span>
                                    </div>
                                </div>

                                {/* Show first 3 recipe names */}
                                <div className="mb-4 space-y-1">
                                    {sectionRecipes.slice(0, 3).map((recipe, idx) => (
                                        <div key={recipe.id} className="flex items-center gap-2 text-xs text-zinc-600">
                                            <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span>
                                            <span className="font-medium">{recipe.nombre}</span>
                                        </div>
                                    ))}
                                    {sectionRecipes.length > 3 && (
                                        <div className="text-[10px] text-zinc-400 ml-3.5">
                                            +{sectionRecipes.length - 3} más...
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-2">
                                    <button className="flex-1 py-3 rounded-2xl text-[10px] font-black text-zinc-500 bg-zinc-100 border border-zinc-200 uppercase tracking-wider hover:bg-zinc-200 transition-colors">
                                        Editar
                                    </button>
                                    <button className="flex-1 py-3 rounded-2xl text-[10px] font-black text-yellow-700 bg-yellow-100 border border-yellow-200 uppercase tracking-wider hover:bg-yellow-200 transition-colors">
                                        Ver
                                    </button>
                                </div>
                            </GlassCard>
                        );
                    }) : (
                        <GlassCard rounded="3xl" padding="xl" className="text-center">
                            <span className="material-symbols-outlined text-6xl text-zinc-300 mb-3 block">edit_note</span>
                            <h3 className="text-lg font-bold text-zinc-900 mb-2">No hay recetas</h3>
                            <p className="text-sm text-zinc-500 mb-5">Crea recetas desde Grimorio Desktop para generar menús</p>
                        </GlassCard>
                    )}
                </div>
            </main>
        </div>
    );
};

export default CerebrityMakeMenu;
