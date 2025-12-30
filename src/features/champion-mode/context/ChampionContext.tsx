import React, { createContext, useContext, ReactNode } from 'react';
import { useChampionCreativeEngine } from '../hooks/useChampionCreativeEngine';

// Return type of the hook
type ChampionContextType = ReturnType<typeof useChampionCreativeEngine>;

const ChampionContext = createContext<ChampionContextType | undefined>(undefined);

export const ChampionProvider = ({ children, engine }: { children: ReactNode, engine: ChampionContextType }) => {
    return (
        <ChampionContext.Provider value={engine}>
            {children}
        </ChampionContext.Provider>
    );
};

export const useChampionContext = () => {
    const context = useContext(ChampionContext);
    if (!context) {
        throw new Error('useChampionContext must be used within a ChampionProvider');
    }
    return context;
};
