import { BarSceneState } from './digitalBarTypes';

export const INITIAL_SCENE_STATE: BarSceneState = {
    areas: [
        {
            id: 'main-bar',
            type: 'main-bar',
            shape: 'L',
            name: 'Barra Principal',
            position: { x: 0, y: 0 },
            size: { width: 2, height: 2 },
            rotation: 0,
            icon: 'cocktail',
            isActive: true,
            stats: { load: 45, efficiency: 92, activeTickets: 3 }
        },
        {
            id: 'prep-room',
            type: 'prep-room',
            shape: 'rect',
            name: 'Estación de Producción',
            position: { x: 4, y: 0 },
            size: { width: 1, height: 2 },
            rotation: 0,
            icon: 'flask',
            isActive: true,
            stats: { load: 20, efficiency: 98, activeTickets: 1 }
        },
        {
            id: 'dispatch-zone',
            type: 'dispatch-zone',
            shape: 'rect',
            name: 'Zona Despacho',
            position: { x: 0, y: 4 },
            size: { width: 2, height: 1 },
            rotation: 0,
            icon: 'check-circle',
            isActive: true,
            stats: { load: 10, efficiency: 100, activeTickets: 0 }
        },
        {
            id: 'backbar',
            type: 'backbar',
            shape: 'square',
            name: 'Backbar / Stock',
            position: { x: 4, y: 4 },
            size: { width: 1, height: 1 },
            rotation: 0,
            icon: 'box',
            isActive: true,
            stats: { load: 5, efficiency: 100, activeTickets: 0 }
        }
    ],
    workers: [
        {
            id: 'w1',
            name: 'Alex',
            role: 'bartender',
            areaId: 'main-bar',
            stressLevel: 30,
            activity: 'mixing'
        },
        {
            id: 'w2',
            name: 'Sam',
            role: 'barback',
            areaId: 'prep-room',
            stressLevel: 15,
            activity: 'prepping'
        }
    ],
    drinks: [],
    selectedAreaId: null,
    zoomLevel: 1,
    panOffset: { x: 0, y: 0 }
};
