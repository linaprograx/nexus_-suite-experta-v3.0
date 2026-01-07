import React from 'react';
import { GlassStack } from '../../components/glass/GlassStack';
import { AvatarCard } from '../avatar/components/AvatarCard';
// We need to move AvatarCard to a shared location or import it from where it is.
// For now, let's assume we'll move it to src/product/screens/avatar/components/AvatarCard.tsx
// But currently it is in src/product/avatar/AvatarCard.tsx. 
// I will move it in the next step.

export const AvatarScreen: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center p-6 pb-24 h-full animate-in fade-in duration-500">
            <div className="w-full max-w-sm space-y-6">
                <h1 className="text-2xl font-light text-slate-800 pl-2">Passport</h1>
                <AvatarCard
                    userName="Lian Alviz"
                    role="Architect"
                    level={42}
                    xpCurrent={8500}
                    xpMax={10000}
                />
            </div>
        </div>
    );
};
