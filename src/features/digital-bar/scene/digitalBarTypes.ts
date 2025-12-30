export type BarAreaType = 'main-bar' | 'prep-room' | 'dispatch-zone' | 'backbar';
export type BarAreaShape = 'L' | 'rect' | 'U' | 'square';

export interface AreaOperationalSnapshot {
    areaId: string;
    activeTasks: number;
    ticketsPerHour: number;
    avgTaskAgeMinutes: number;
    linkedRecipes: number;
    stockPressure: number; // 0-100
    teamStress: number;    // 0-100
    efficiency: number;    // 0-100
}

export type BarArea = {
    id: string;
    type: BarAreaType;
    shape: BarAreaShape;
    name: string;
    position: { x: number; y: number }; // Isometric grid coordinates
    size: { width: number; height: number }; // Dimensions in grid units
    rotation: number; // 0, 90, 180, 270
    icon: string;
    isActive: boolean;
    stats: {
        load: number;
        efficiency: number;
        activeTickets: number;
        // Extended metrics
        ticketsPerHour?: number;
        stockPressure?: number;
        teamStress?: number;
        snapshot?: AreaOperationalSnapshot;
    };
};

export type BarWorkerRole = 'bartender' | 'barback' | 'prep-chef' | 'runner' | 'stock-manager';

export type BarWorker = {
    id: string;
    name: string;
    role: BarWorkerRole;
    areaId: string;
    stressLevel: number;
    activity: 'idle' | 'mixing' | 'prepping' | 'serving' | 'cleaning' | 'resting' | 'overloaded';
    avatarUrl?: string;
};

export type BarDrink = {
    id: string;
    recipeId: string;
    name: string;
    areaId: string;
    status: 'queued' | 'in_progress' | 'served';
    progress: number; // 0-100
    color: string;
};

export type BarSceneState = {
    areas: BarArea[];
    workers: BarWorker[];
    drinks: BarDrink[];
    selectedAreaId: string | null;
    zoomLevel: number;
    panOffset: { x: number; y: number };
};
