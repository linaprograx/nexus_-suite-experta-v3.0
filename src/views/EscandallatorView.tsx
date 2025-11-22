import React from 'react';
import { Firestore } from 'firebase/firestore';
import { Recipe, Ingredient } from '../../types';
import EscandalloTab from '../components/escandallator/EscandalloTab';
import BatcherTab from '../components/escandallator/BatcherTab';
import StockManagerTab from '../components/escandallator/StockManagerTab';

interface EscandallatorViewProps {
    db: Firestore;
    userId: string;
    appId: string;
    allRecipes: Recipe[];
    allIngredients: Ingredient[];
}

const EscandallatorView: React.FC<EscandallatorViewProps> = ({ db, userId, appId, allRecipes, allIngredients }) => {
    const [activeTab, setActiveTab] = React.useState<'escandallo' | 'batcher' | 'stock'>('escandallo');

    return (
        <div className="p-4 lg:p-8 h-full flex flex-col">
            <div className="flex border-b mb-6 flex-shrink-0">
                <button onClick={() => setActiveTab('escandallo')} className={`py-2 px-6 text-sm font-medium ${activeTab === 'escandallo' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}>Escandallo</button>
                <button onClick={() => setActiveTab('batcher')} className={`py-2 px-6 text-sm font-medium ${activeTab === 'batcher' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}>Batcher</button>
                <button onClick={() => setActiveTab('stock')} className={`py-2 px-6 text-sm font-medium ${activeTab === 'stock' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}>Gestor de Stock</button>
            </div>
            <div className="flex-1 overflow-y-auto">
                {activeTab === 'escandallo' && <EscandalloTab db={db} userId={userId} allRecipes={allRecipes} allIngredients={allIngredients} />}
                {activeTab === 'batcher' && <BatcherTab db={db} appId={appId} allRecipes={allRecipes} />}
                {activeTab === 'stock' && <StockManagerTab allRecipes={allRecipes} allIngredients={allIngredients} />}
            </div>
        </div>
    );
};

export default EscandallatorView;
