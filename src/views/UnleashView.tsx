import React from 'react';
import SynthesisView from './unleash/SynthesisView';
import AtelierView from './unleash/AtelierView';
import EconosView from './unleash/EconosView';
import CriticView from './unleash/CriticView';
import MakeMenuView from './MakeMenuView';
import { Recipe, Ingredient } from '../types';
import { Firestore } from 'firebase/firestore';
import { useApp } from '../context/AppContext';
import { useRecipes } from '../hooks/useRecipes';
import { useIngredients } from '../hooks/useIngredients';

interface UnleashViewProps {
  // allRecipes: Recipe[]; // Removed
  // allIngredients: Ingredient[]; // Removed
  // db: any; // Can be removed if subcomponents use useApp, but for now kept or derived
  // userId: string; // Wrapped in useApp
}

const UnleashView: React.FC<UnleashViewProps> = () => {
  const { db, userId } = useApp();
  const { recipes: allRecipes } = useRecipes();
  const { ingredients: allIngredients } = useIngredients();

  const [activeTab, setActiveTab] = React.useState<'synthesis' | 'atelier' | 'econos' | 'makemenu' | 'critic'>('synthesis');


  // Dynamic Gradients per section (Soft, Vertical, Top-to-Bottom)
  const getGradientStyle = () => {
    switch (activeTab) {
      case 'synthesis': return { background: 'linear-gradient(180deg, #6366F1 0%, rgba(99, 102, 241, 0.35) 45%, rgba(0,0,0,0) 100%)' };
      case 'atelier': return { background: 'linear-gradient(180deg, #06B6D4 0%, rgba(6, 182, 212, 0.35) 45%, rgba(0,0,0,0) 100%)' };
      case 'econos': return { background: 'linear-gradient(180deg, #10B981 0%, rgba(16, 185, 129, 0.35) 45%, rgba(0,0,0,0) 100%)' };
      case 'makemenu': return { background: 'linear-gradient(180deg, #EF4444 0%, rgba(239, 68, 68, 0.35) 45%, rgba(0,0,0,0) 100%)' };
      case 'critic': return { background: 'linear-gradient(180deg, #F59E0B 0%, rgba(245, 158, 11, 0.35) 45%, rgba(0,0,0,0) 100%)' };
      default: return { background: 'none' };
    }
  };

  const getBorderClass = () => {
    switch (activeTab) {
      case 'synthesis': return 'border-t border-violet-500/30';
      case 'atelier': return 'border-t border-cyan-500/30';
      case 'econos': return 'border-t border-emerald-500/30';
      case 'makemenu': return 'border-t border-red-500/30';
      case 'critic': return 'border-t border-amber-500/30';
      default: return 'border-t border-slate-700/20';
    }
  };

  return (
    <div className="h-[calc(100vh-80px)] w-full flex flex-col px-4 lg:px-8 py-6">
      <div className="flex-shrink-0 mb-4 z-10">
        <div className="flex items-center gap-1 bg-white/5 p-1 rounded-2xl border border-white/10 w-fit backdrop-blur-md">
          <button
            onClick={() => setActiveTab('synthesis')}
            className={`py-2 px-6 text-sm font-bold rounded-xl transition-all duration-300 ${activeTab === 'synthesis' ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/40' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
          >
            Synthesis
          </button>
          <button
            onClick={() => setActiveTab('atelier')}
            className={`py-2 px-6 text-sm font-bold rounded-xl transition-all duration-300 ${activeTab === 'atelier' ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-900/40' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
          >
            Atelier
          </button>
          <button
            onClick={() => setActiveTab('econos')}
            className={`py-2 px-6 text-sm font-bold rounded-xl transition-all duration-300 ${activeTab === 'econos' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
          >
            Econos
          </button>
          <button
            onClick={() => setActiveTab('makemenu')}
            className={`py-2 px-6 text-sm font-bold rounded-xl transition-all duration-300 ${activeTab === 'makemenu' ? 'bg-red-600 text-white shadow-lg shadow-red-900/40' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
          >
            Make Menu
          </button>
          <button
            onClick={() => setActiveTab('critic')}
            className={`py-2 px-6 text-sm font-bold rounded-xl transition-all duration-300 ${activeTab === 'critic' ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/40' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
          >
            The Critic
          </button>
        </div>
      </div>

      <div
        className={`flex-1 overflow-hidden rounded-[2rem] p-6 shadow-xl ring-1 ring-white/10 border-b-0 border-transparent relative transition-all duration-700 ${getBorderClass()}`}
        style={getGradientStyle()}
      >
        {/* Background Glow */}
        <div className="absolute top-0 left-0 w-full h-full bg-noise opacity-[0.03] pointer-events-none"></div>

        {activeTab === 'synthesis' && <SynthesisView allRecipes={allRecipes} />}
        {activeTab === 'atelier' && <AtelierView allIngredients={allIngredients} />}
        {activeTab === 'econos' && <EconosView allRecipes={allRecipes} />}
        {activeTab === 'makemenu' && (
          <MakeMenuView
            db={db}
            userId={userId}
            appId="nexus-suite"
          />
        )}
        {activeTab === 'critic' && <CriticView />}
      </div>
    </div>
  );
};

export default UnleashView;
