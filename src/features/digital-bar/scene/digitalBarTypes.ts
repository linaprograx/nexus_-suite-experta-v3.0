export type BarAreaType = 'main-bar' | 'production' | 'dispatch' | 'backbar';

export type BarArea = {
    id: string;
    type: BarAreaType;
    name: string;
    position: { x: number; y: number }; // Isometric grid coordinates (not pixels)
    icon: string; // SVG path or icon name
    stats: {
        load: number; // 0-100
        efficiency: number; // 0-100
        activeTickets: number;
    };
};

export type BarWorkerRole = 'bartender' | 'barback' | 'runner' | 'chef';

export type BarWorker = {
    id: string;
    name: string;
    role: BarWorkerRole;
    areaId: string;
    stressLevel: number; // 0-100
    activity: 'idle' | 'mixing' | 'prepping' | 'serving' | 'cleaning';
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
