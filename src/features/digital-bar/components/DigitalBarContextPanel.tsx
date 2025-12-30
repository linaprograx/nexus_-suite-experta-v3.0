import React from 'react';
import { OpsPanel } from './OpsPanel';
import { BarArea, BarWorker } from '../scene/digitalBarTypes';

interface DigitalBarContextPanelProps {
    selectedArea: BarArea | undefined;
    workers: BarWorker[];
}

export const DigitalBarContextPanel: React.FC<DigitalBarContextPanelProps> = (props) => {
    return <OpsPanel {...props} />;
};

export default DigitalBarContextPanel;
