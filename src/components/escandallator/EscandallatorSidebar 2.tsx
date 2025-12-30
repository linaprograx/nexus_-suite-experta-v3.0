
import React from 'react';
import { Firestore } from 'firebase/firestore';
import EscandalloHistorySidebar from './EscandalloHistorySidebar';
import { Escandallo } from '../../types';

interface EscandallatorSidebarProps {
    db: Firestore;
    escandallosColPath: string;
    onLoadHistory: (item: Escandallo) => void;
    onNewEscandallo: () => void;
    // Potentially add Batcher sidebar items if needed, but Batcher had just controls which are now in main or sidebar?
    // Looking at BatcherSidebar... it had controls.
    // If I move controls to main panel (as they were in BatcherTab partially?), or assume they are in the sidebar?
    // The previous BatcherTab had controls in the main area. The BatcherSidebar had... let's check BatcherSidebar.
    onConfigureBatch: (amount: number, unit: 'Litros' | 'Botellas') => void;
    activeSubTab: 'calculator' | 'production';
}

import BatcherSidebar from './BatcherSidebar';

const EscandallatorSidebar: React.FC<EscandallatorSidebarProps> = (props) => {
    return (
        <div className="h-full">
            {props.activeSubTab === 'calculator' && (
                <EscandalloHistorySidebar
                    db={props.db}
                    escandallosColPath={props.escandallosColPath}
                    onLoadHistory={props.onLoadHistory}
                    onNewEscandallo={props.onNewEscandallo}
                />
            )}
            {props.activeSubTab === 'production' && (
                <BatcherSidebar
                    onConfigureBatch={props.onConfigureBatch}
                />
            )}
        </div>
    );
};

export default EscandallatorSidebar;
