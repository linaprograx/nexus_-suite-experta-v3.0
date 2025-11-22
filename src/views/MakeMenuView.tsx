import React from 'react';
import { Firestore } from 'firebase/firestore';
import { Recipe, PizarronTask } from '../../types';
import { DesignerView } from '../components/make-menu/DesignerView';
import { CriticView } from '../components/make-menu/CriticView';

interface MakeMenuViewProps {
    db: Firestore;
    userId: string;
    appId: string;
    allRecipes: Recipe[];
    allPizarronTasks: PizarronTask[];
}

const MakeMenuView: React.FC<MakeMenuViewProps> = ({ db, userId, appId, allRecipes, allPizarronTasks }) => {
    const [activeTab, setActiveTab] = React.useState<'designer' | 'critic'>('designer');

    return (
        <div className="flex flex-col h-full p-4 lg:p-8 gap-4">
             <div className="flex border-b">
                <button onClick={() => setActiveTab('designer')} className={`py-2 px-6 text-sm font-medium ${activeTab === 'designer' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}>Diseñador</button>
                <button onClick={() => setActiveTab('critic')} className={`py-2 px-6 text-sm font-medium ${activeTab === 'critic' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}>El Crítico</button>
            </div>
            <div className="flex-1 overflow-y-auto pt-4">
                {activeTab === 'designer' ? 
                    <DesignerView db={db} userId={userId} appId={appId} allRecipes={allRecipes} allPizarronTasks={allPizarronTasks} /> 
                    : 
                    <CriticView db={db} userId={userId} />
                }
            </div>
        </div>
    );
};

export default MakeMenuView;
