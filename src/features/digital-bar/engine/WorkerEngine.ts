import { EngineWorker, Ticket, EngineWorkerState } from './types';

export class WorkerEngine {

    static updateWorker(worker: EngineWorker, tickets: Ticket[]): EngineWorker {
        const newWorker = { ...worker };

        // 1. Check Exhaustion
        if (newWorker.stressLevel >= 100) {
            newWorker.state = 'exhausted';
        }

        // 2. State Machine
        switch (newWorker.state) {
            case 'idle':
                this.handleIdle(newWorker, tickets);
                break;
            case 'mixing':
            case 'prepping':
            case 'serving':
                this.handleWorking(newWorker);
                break;
            case 'rest':
                this.handleRest(newWorker);
                break;
            case 'exhausted':
                this.handleExhaustion(newWorker);
                break;
        }

        // 3. Passive recovery if completely idle
        if (newWorker.state === 'idle' && newWorker.stressLevel > 0) {
            newWorker.stressLevel = Math.max(0, newWorker.stressLevel - 1);
        }

        return newWorker;
    }

    private static handleIdle(worker: EngineWorker, tickets: Ticket[]) {
        // Find relevant ticket
        const areaTickets = tickets.filter(t => t.areaId === worker.areaId && t.status === 'pending');

        if (areaTickets.length > 0) {
            // Assign task
            const ticket = areaTickets[0]; // Simple FIFO for now
            worker.currentTaskId = ticket.id;
            worker.state = 'mixing'; // Default generic work state for v1

            // Stress impact to start a task
            worker.stressLevel = Math.min(100, worker.stressLevel + 5);
        }
    }

    private static handleWorking(worker: EngineWorker) {
        // Work consumes energy and increases stress
        worker.energyLevel = Math.max(0, worker.energyLevel - 0.2);
        worker.stressLevel = Math.min(100, worker.stressLevel + 0.5);

        // Chance to finish (simulated for v1 engine loop)
        if (Math.random() > 0.85) {
            worker.state = 'serving'; // Transition to finishing
        }

        if (worker.state === 'serving' && Math.random() > 0.8) {
            worker.state = 'cleaning';
        } else if (worker.state === 'cleaning' && Math.random() > 0.8) {
            worker.state = 'idle';
            worker.currentTaskId = undefined;
        }
    }

    private static handleRest(worker: EngineWorker) {
        // Faster recovery
        worker.stressLevel = Math.max(0, worker.stressLevel - 5);
        worker.energyLevel = Math.min(100, worker.energyLevel + 2);

        if (worker.stressLevel < 20) {
            worker.state = 'idle'; // Back to work
        }
    }

    private static handleExhaustion(worker: EngineWorker) {
        // Forced recovery, very slow
        worker.stressLevel = Math.max(0, worker.stressLevel - 0.5);
        if (worker.stressLevel < 50) {
            worker.state = 'rest'; // Upgrade to normal rest
        }
    }
}
