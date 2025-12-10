import { BarSceneState } from './digitalBarTypes';

export const INITIAL_SCENE_STATE: BarSceneState = {
    areas: [
        {
            id: 'main-bar',
            type: 'main-bar',
            name: 'Barra Principal',
            position: { x: 0, y: 0 },
            icon: 'cocktail',
            stats: { load: 45, efficiency: 92, activeTickets: 3 }
        },
        {
            id: 'production',
            type: 'production',
            name: 'Estación Producción',
            position: { x: 1, y: 0 }, // Adjacent to main bar
            icon: 'flask',
            stats: { load: 20, efficiency: 98, activeTickets: 1 }
        },
        {
            id: 'dispatch',
            type: 'dispatch',
            name: 'Zona Despacho',
            position: { x: 0, y: 1 }, // "Behind" main bar in iso view
            icon: 'check-circle',
            stats: { load: 10, efficiency: 100, activeTickets: 0 }
        },
        {
            id: 'backbar',
            type: 'backbar',
            name: 'Backbar / Stock',
            position: { x: 1, y: 1 },
            icon: 'box',
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
            areaId: 'production',
            stressLevel: 15,
            activity: 'prepping'
        }
    ],
    drinks: [],
    selectedAreaId: null,
    zoomLevel: 1,
    panOffset: { x: 0, y: 0 }
};
