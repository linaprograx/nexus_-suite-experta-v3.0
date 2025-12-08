import React from 'react';
import SynthesisView from './unleash/SynthesisView';
import AtelierView from './unleash/AtelierView';
import EconosView from './unleash/EconosView';
import CriticView from './unleash/CriticView';
import MakeMenuView from './MakeMenuView';
import { Recipe, Ingredient } from '../../types';
import { Firestore } from 'firebase/firestore';

interface UnleashViewProps {
  allRecipes: Recipe[];
  allIngredients: Ingredient[];
  db: any;
  userId: string;
}

const UnleashView: React.FC<UnleashViewProps> = ({ allRecipes, allIngredients, db, userId }) => {
  const [activeTab, setActiveTab] = React.useState<'synthesis' | 'atelier' | 'econos' | 'makemenu' | 'critic'>('synthesis');

  // Dynamic Gradients per section (Soft, Vertical, Top-to-Bottom)
  const getGradient = () => {
    switch (activeTab) {
      case 'synthesis': return 'bg-gradient-to-b from-violet-900/40 via-violet-950/10 to-transparent border-t border-violet-500/20';
      case 'atelier': return 'bg-gradient-to-b from-cyan-900/40 via-cyan-950/10 to-transparent border-t border-cyan-500/20';
      case 'econos': return 'bg-gradient-to-b from-emerald-900/40 via-emerald-950/10 to-transparent border-t border-emerald-500/20';
      case 'makemenu': return 'bg-gradient-to-b from-red-900/40 via-red-950/10 to-transparent border-t border-red-500/20';
      case 'critic': return 'bg-gradient-to-b from-amber-900/40 via-amber-950/10 to-transparent border-t border-amber-500/20';
      default: return 'bg-slate-900/50';
    }
  };

  return (
    <div className="h-[calc(100vh-80px)] w-full flex flex-col px-4 lg:px-8 py-6">
      <div className="flex-shrink-0 mb-4 z-10">
        <div className="flex items-center gap-2 bg-transparent p-0 w-fit">
          <button
            onClick={() => setActiveTab('synthesis')}
            className={`py-2 px-5 text-sm font-bold rounded-full transition-all duration-300 border-2 ${activeTab === 'synthesis' ? 'bg-violet-600 border-violet-600 text-white shadow-lg shadow-violet-900/30' : 'bg-white/5 border-transparent text-slate-500 hover:text-violet-500 hover:border-violet-500/30'}`}
          >
            SYNTHESIS
          </button>
          <button
            onClick={() => setActiveTab('atelier')}
            className={`py-2 px-5 text-sm font-bold rounded-full transition-all duration-300 border-2 ${activeTab === 'atelier' ? 'bg-cyan-600 border-cyan-600 text-white shadow-lg shadow-cyan-900/30' : 'bg-white/5 border-transparent text-slate-500 hover:text-cyan-500 hover:border-cyan-500/30'}`}
          >
            ATELIER
          </button>
          <button
            onClick={() => setActiveTab('econos')}
            className={`py-2 px-5 text-sm font-bold rounded-full transition-all duration-300 border-2 ${activeTab === 'econos' ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-900/30' : 'bg-white/5 border-transparent text-slate-500 hover:text-emerald-500 hover:border-emerald-500/30'}`}
          >
            ECONOS
          </button>
          <button
            onClick={() => setActiveTab('makemenu')}
            className={`py-2 px-5 text-sm font-bold rounded-full transition-all duration-300 border-2 ${activeTab === 'makemenu' ? 'bg-red-600 border-red-600 text-white shadow-lg shadow-red-900/30' : 'bg-white/5 border-transparent text-slate-500 hover:text-red-500 hover:border-red-500/30'}`}
          >
            MAKEMENU
          </button>
          <button
            onClick={() => setActiveTab('critic')}
            className={`py-2 px-5 text-sm font-bold rounded-full transition-all duration-300 border-2 ${activeTab === 'critic' ? 'bg-amber-600 border-amber-600 text-white shadow-lg shadow-amber-900/30' : 'bg-white/5 border-transparent text-slate-500 hover:text-amber-500 hover:border-amber-500/30'}`}
          >
            THE CRITIC
          </button>
        </div>
      </div>

      <div className={`flex-1 overflow-hidden rounded-3xl ${getGradient()} p-6 shadow-xl ring-1 ring-white/20 border-b-0 relative transition-all duration-700`}>
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
            allRecipes={allRecipes}
            allPizarronTasks={[]}
          />
        )}
        {activeTab === 'critic' && <CriticView />}
      </div>
    </div>
  );
};

export default UnleashView;
