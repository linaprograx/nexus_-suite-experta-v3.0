import React from 'react';
import SynthesisView from './unleash/SynthesisView';
import AtelierView from './unleash/AtelierView';
import EconosView from './unleash/EconosView';
import { Recipe, Ingredient } from '../../types';
import { Firestore } from 'firebase/firestore';

interface UnleashViewProps {
  allRecipes?: Recipe[];
  allIngredients?: Ingredient[];
  db?: Firestore;
  userId?: string;
}

const UnleashView: React.FC<UnleashViewProps> = ({ allRecipes = [], allIngredients = [], db, userId }) => {
  const [activeTab, setActiveTab] = React.useState<'synthesis' | 'atelier' | 'econos'>('synthesis');

  // New Metallic Gradient as requested
  const metallicGradient = "bg-[linear-gradient(145deg,#6F6E91_0%,#4A4A5F_45%,rgba(0,0,0,0)_100%)]";

  return (
    <div className="h-[calc(100vh-80px)] w-full flex flex-col px-4 lg:px-8 py-6">
      <div className="flex-shrink-0 mb-4 z-10">
        <div className="flex items-center gap-2 bg-slate-900/80 p-1 rounded-full w-fit backdrop-blur-md border border-white/10">
          <button onClick={() => setActiveTab('synthesis')} className={`py-2 px-5 text-sm font-semibold rounded-full transition-all duration-300 ${activeTab === 'synthesis' ? 'bg-[#6F6E91] text-white shadow-lg shadow-slate-900/50' : 'text-slate-400 hover:text-white'}`}>SYNTHESIS</button>
          <button onClick={() => setActiveTab('atelier')} className={`py-2 px-5 text-sm font-semibold rounded-full transition-all duration-300 ${activeTab === 'atelier' ? 'bg-[#4A4A5F] text-white shadow-lg shadow-slate-900/50' : 'text-slate-400 hover:text-white'}`}>ATELIER</button>
          <button onClick={() => setActiveTab('econos')} className={`py-2 px-5 text-sm font-semibold rounded-full transition-all duration-300 ${activeTab === 'econos' ? 'bg-[#4A4A5F] text-white shadow-lg shadow-slate-900/50' : 'text-slate-400 hover:text-white'}`}>ECONOS</button>
        </div>
      </div>

      <div className={`flex-1 overflow-hidden rounded-3xl ${metallicGradient} p-6 shadow-2xl ring-1 ring-white/10 relative`}>
        {/* Background Glow */}
        <div className="absolute top-0 left-0 w-full h-full bg-noise opacity-[0.03] pointer-events-none"></div>

        {activeTab === 'synthesis' && <SynthesisView allRecipes={allRecipes} />}
        {activeTab === 'atelier' && <AtelierView allIngredients={allIngredients} />}
        {activeTab === 'econos' && <EconosView allRecipes={allRecipes} />}
      </div>
    </div>
  );
};

export default UnleashView;
