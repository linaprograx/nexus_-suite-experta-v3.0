import React from 'react';

interface ChampionIdeaCardProps {
    title?: string;
    subtitle?: string;
    description?: string;
}

export const ChampionIdeaCard: React.FC<ChampionIdeaCardProps> = ({
    title = "Nueva Idea",
    subtitle = "Concepto Generado",
    description = "Descripción de la idea..."
}) => {
    return (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <h4 className="font-bold text-slate-800">{title}</h4>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{subtitle}</span>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">{description}</p>
        </div>
    );
};

export default ChampionIdeaCard;
