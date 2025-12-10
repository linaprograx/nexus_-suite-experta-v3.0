import React from 'react';
import { DigitalBarScene } from './DigitalBarScene';
import { BarSceneState } from './digitalBarTypes';

interface DigitalBarIsometricCanvasProps {
    sceneState: BarSceneState;
    onSelectArea: (areaId: string | null) => void;
    onSetZoom: (zoom: number) => void;
    onSetPan: (x: number, y: number) => void;
}

export const DigitalBarIsometricCanvas: React.FC<DigitalBarIsometricCanvasProps> = (props) => {
    return <DigitalBarScene {...props} />;
};

export default DigitalBarIsometricCanvas;
