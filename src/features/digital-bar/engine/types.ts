export type EngineWorkerState = 'idle' | 'prepping' | 'mixing' | 'serving' | 'cleaning' | 'rest' | 'exhausted';

export interface Ticket {
    id: string;
    recipeId: string;
    recipeName: string;
    areaId: string;
    priority: 'low' | 'normal' | 'high' | 'urgent';
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
    createdAt: number;
    assignedWorkerId?: string;
    ingredients?: { id: string; name: string; quantity: number }[];
}

export interface AreaStats {
    load: number;          // 0-100%
    energy: number;        // 0-100% (Machine/Environment health)
    stress: number;        // 0-100% (Team stress average)
    efficiency: number;    // 0-100% (Calculated performance)
    activeTickets: number;
    completedTickets: number;
}

export interface EngineWorker {
    id: string;
    areaId: string;
    name: string;
    role: string;
    state: EngineWorkerState;
    stressLevel: number;   // 0-100%
    energyLevel: number;   // 0-100%
    currentTaskId?: string;
    skillLevel: number; // 0.5 - 1.5 multiplier
}

export interface OperationalState {
    timestamp: number;
    areas: Record<string, AreaStats>;
    workers: Record<string, EngineWorker>;
    tickets: Ticket[];
}
