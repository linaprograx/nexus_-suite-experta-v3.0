import { OperationalState, AreaStats, EngineWorker, Ticket } from './types';
import { WorkerEngine } from './WorkerEngine';
import { TicketEngine } from './TicketEngine';

export class OperationalEngine {

    static initialize(areas: string[], initialWorkers: EngineWorker[]): OperationalState {
        const areaStats: Record<string, AreaStats> = {};
        const workersMap: Record<string, EngineWorker> = {};

        areas.forEach(id => {
            areaStats[id] = {
                load: 0,
                energy: 100,
                stress: 0,
                efficiency: 100,
                activeTickets: 0,
                completedTickets: 0
            };
        });

        initialWorkers.forEach(w => {
            workersMap[w.id] = w;
        });

        return {
            timestamp: Date.now(),
            areas: areaStats,
            workers: workersMap,
            tickets: []
        };
    }

    static update(prevState: OperationalState): OperationalState {
        const nextState = { ...prevState, timestamp: Date.now() };

        // 1. TICKET Clean up
        nextState.tickets = TicketEngine.processTickets(nextState.tickets);

        // 2. WORKER Cycle
        const updatedWorkers: Record<string, EngineWorker> = {};
        Object.values(nextState.workers).forEach(worker => {
            updatedWorkers[worker.id] = WorkerEngine.updateWorker(worker, nextState.tickets);

            // Sync Ticket Status with Worker Status
            if (updatedWorkers[worker.id].state === 'serving' && worker.currentTaskId) {
                nextState.tickets = TicketEngine.updateTicketStatus(nextState.tickets, worker.currentTaskId, 'completed');
            }
        });
        nextState.workers = updatedWorkers;

        // 3. AREA Stats Calculation
        Object.keys(nextState.areas).forEach(areaId => {
            nextState.areas[areaId] = this.calculateAreaStats(areaId, nextState.workers, nextState.tickets);
        });

        return nextState;
    }

    private static calculateAreaStats(areaId: string, workersDict: Record<string, EngineWorker>, tickets: Ticket[]): AreaStats {
        const areaWorkers = Object.values(workersDict).filter(w => w.areaId === areaId);
        const areaTickets = tickets.filter(t => t.areaId === areaId && t.status !== 'completed' && t.status !== 'cancelled');

        // Load: Based on tickets vs workers capcaity
        // Assume 1 worker can handle 3 active tickets comfortably
        const capacity = Math.max(1, areaWorkers.length * 3);
        const load = Math.min(100, (areaTickets.length / capacity) * 100);

        // Stress: Average of worker stress + load penalty
        const avgWorkerStress = areaWorkers.reduce((acc, w) => acc + w.stressLevel, 0) / (areaWorkers.length || 1);
        const stress = Math.min(100, avgWorkerStress + (load > 80 ? 20 : 0));

        // Energy: Inverse of stress, but decays if under-maintained (not implemented in v1 yet, static 100 base)
        const energy = Math.max(0, 100 - (stress * 0.5));

        // Efficiency: Complex formula
        // High stress kills efficiency. High energy boosts it.
        const baseEff = 100;
        const stressPenalty = Math.pow(stress / 10, 1.5); // Exponential penalty
        const efficiency = Math.max(10, Math.min(100, baseEff - stressPenalty));

        return {
            load: Math.round(load),
            energy: Math.round(energy),
            stress: Math.round(stress),
            efficiency: Math.round(efficiency),
            activeTickets: areaTickets.length,
            completedTickets: tickets.filter(t => t.areaId === areaId && t.status === 'completed').length
        };
    }

    // Helper to inject a new ticket externally
    static addTicket(state: OperationalState, ticket: Ticket): OperationalState {
        return {
            ...state,
            tickets: [...state.tickets, ticket]
        };
    }
}
