import React from 'react';
import { ItemProvider } from '../../../context/Grimorium/ItemContext';

interface GrimoriumShellProps {
    children: React.ReactNode;
}

/**
 * GrimoriumShell
 * 
 * The definition of the new Core Operational-Financial Container.
 * It provides the ItemContext and orchestrates the different layers.
 * 
 * In this V3 Genesis version, it wraps the existing View logic to ensure compatibility
 * while establishing the new Context architectural boundary.
 */
export const GrimoriumShell: React.FC<GrimoriumShellProps> = ({ children }) => {
    return (
        <ItemProvider>
            <div className="grimorium-shell-core w-full h-full">
                {/* 
                   Future expansion: 
                   Here we can inject a global "Item Header" or "Active Context Bar"
                   that persists across tabs/layers.
                 */}
                {children}
            </div>
        </ItemProvider>
    );
};
