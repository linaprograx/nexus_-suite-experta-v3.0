import { useMemo } from 'react';
import { useFirebaseData } from '../../../hooks/useFirebaseData';
import { useApp } from '../../../context/AppContext';
import { AreaOperationalSnapshot } from '../scene/digitalBarTypes';

export const useDigitalBarMetrics = () => {
    const { db, userId, appId } = useApp();
    const { allPizarronTasks, allRecipes, allIngredients } = useFirebaseData(db, userId, appId);

    const metrics = useMemo(() => {
        // Initialize snapshots for standard areas
        const areas: Record<string, AreaOperationalSnapshot> = {
            'main-bar': createEmptySnapshot('main-bar'),
            'prep-room': createEmptySnapshot('prep-room'),
            'dispatch-zone': createEmptySnapshot('dispatch-zone'),
            'backbar': createEmptySnapshot('backbar')
        };

        // 1. Process Tasks
        const now = new Date();
        allPizarronTasks.forEach(task => {
            let targetArea = 'main-bar';

            // Simple heuristic mapping
            const content = (task.texto || task.title || '').toLowerCase() + (task.description || '').toLowerCase();
            const category = (task.category || '').toLowerCase();

            if (content.includes('stock') || content.includes('pedido') || category.includes('inventario')) targetArea = 'backbar';
            else if (content.includes('prep') || content.includes('mice') || category.includes('producción')) targetArea = 'prep-room';
            else if (content.includes('mesa') || content.includes('cliente') || category.includes('servicio')) targetArea = 'dispatch-zone';

            // Update counts
            const area = areas[targetArea];
            if (area) {
                if (task.status !== 'completed' && task.status !== 'archivado') {
                    area.activeTasks++;

                    // Avg Age (mock calc based on created date if available)
                    if (task.createdAt) {
                        // Rough timestamp handling
                        const created = task.createdAt.toDate ? task.createdAt.toDate() : new Date(task.createdAt);
                        const ageMinutes = (now.getTime() - created.getTime()) / (1000 * 60);
                        // Running average
                        area.avgTaskAgeMinutes = ((area.avgTaskAgeMinutes * (area.activeTasks - 1)) + ageMinutes) / area.activeTasks;
                    }
                }
            }
        });

        // 2. Process Recipes (Linked to Main Bar / Dispatch primarily)
        const totalRecipes = allRecipes.length;
        areas['main-bar'].linkedRecipes = Math.floor(totalRecipes * 0.6);
        areas['dispatch-zone'].linkedRecipes = Math.floor(totalRecipes * 0.4);
        areas['prep-room'].linkedRecipes = Math.floor(totalRecipes * 0.2); // Batches

        // 3. Stock Pressure (based on Ingredients count vs theoretical max)
        const totalStock = allIngredients.length;
        areas['backbar'].stockPressure = Math.min(100, (totalStock / 150) * 100);
        areas['prep-room'].stockPressure = Math.min(100, (totalStock / 200) * 80);

        // 4. Calculate Derived Efficiency
        Object.values(areas).forEach(area => {
            // Mock Ticket Speed based on tasks load
            area.ticketsPerHour = Math.max(0, 50 - (area.activeTasks * 2));

            // Team Stress
            area.teamStress = Math.min(100, (area.activeTasks * 5) + (area.stockPressure * 0.2));

            // Efficiency: High tickets + Low Stress + Low Old Tasks = High Efficiency
            const baseEff = 100;
            const penalty = (area.teamStress * 0.5) + (area.activeTasks * 2);
            area.efficiency = Math.max(0, Math.min(100, baseEff - penalty));
        });

        return areas;

    }, [allPizarronTasks, allRecipes, allIngredients]);

    return { metrics };
};

function createEmptySnapshot(id: string): AreaOperationalSnapshot {
    return {
        areaId: id,
        activeTasks: 0,
        ticketsPerHour: 0,
        avgTaskAgeMinutes: 0,
        linkedRecipes: 0,
        stockPressure: 0,
        teamStress: 0,
        efficiency: 100
    };
}
