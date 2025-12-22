import React from 'react';
import { useItemContext } from '../../../context/Grimorium/ItemContext';

interface LayerPanelProps {
    children?: React.ReactNode;

    // Explicit renders for layers
    renderCostLayer: () => React.ReactNode;
    renderOptimizationLayer: () => React.ReactNode;
    renderCompositionLayer: () => React.ReactNode; // Default

    // Stock is no longer a Layer in this panel.
}

export const LayerPanel: React.FC<LayerPanelProps> = ({
    renderCostLayer,
    renderOptimizationLayer,
    renderCompositionLayer
}) => {
    const { activeLayer } = useItemContext();

    switch (activeLayer) {
        case 'cost':
            return <div className="h-full animate-in slide-in-from-right-4 duration-300">{renderCostLayer()}</div>;
        case 'optimization':
            return <div className="h-full animate-in slide-in-from-right-4 duration-300">{renderOptimizationLayer()}</div>;
        case 'composition':
        default:
            return <div className="h-full animate-in fade-in duration-300">{renderCompositionLayer()}</div>;
    }
};
