import { useMemo } from 'react';
import { Recipe, PizarronTask, Ingredient, UserProfile, PurchaseEvent } from '../../types';
import { useToday } from '../today';
import { useCreativeWeekPro } from '../creative-week-pro';
import { useNextBestAction } from '../next-best-action';
import { calculateRecipeCost } from '../../core/costing/costCalculator';
import { buildCurrentStock } from '../../utils/stockUtils';
import { resolverMaestro, indicePorId } from '../../core/identity/masterProduct';
import { useStockRules } from '../../hooks/useStockRules';
import { useStockMovements } from '../../hooks/useStockMovements';

interface DashboardMetricsProps {
    allRecipes: Recipe[];
    allPizarronTasks: PizarronTask[];
    allIngredients: Ingredient[];
    purchaseHistory?: PurchaseEvent[];
    userProfile?: Partial<UserProfile>;
}

// Normalize Firestore Timestamp | Date | number | string → Date | null
const toDate = (v: any): Date | null => {
    if (!v) return null;
    if (v.toDate) return v.toDate();
    if (v instanceof Date) return v;
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
};

const hasPrice = (ing: any): boolean =>
    Number(ing?.standardPrice) > 0 || Number(ing?.precioCompra) > 0 || Number(ing?.costo) > 0;

export const useDashboardMetrics = ({
    allRecipes,
    allPizarronTasks,
    allIngredients,
    purchaseHistory = [],
    userProfile
}: DashboardMetricsProps) => {

    const { rules: stockRules } = useStockRules();
    // Sin los movimientos, el Dashboard enseñaba el almacén como si nunca se
    // hubiera consumido nada: 39.471 € frente a los 39.452,96 € de Inventario,
    // sobre los mismos datos. Ahora ambos pasan por `buildCurrentStock`.
    const { movements: stockMovements } = useStockMovements();

    // 1. Real inventory metrics (from purchase history + stock rules)
    const inventory = useMemo(() => {
        // Misma consolidación que Inventario: si solo la aplicara una de las dos,
        // volveríamos al fallo I4 en cuanto existiera el primer alias.
        const porId = indicePorId(allIngredients || []);
        const stock = buildCurrentStock(purchaseHistory, stockMovements, id => resolverMaestro(id, porId));
        const inventoryValue = stock.reduce((sum, s) => sum + (s.totalValue || 0), 0);
        const distinctItems = stock.length;
        const productsWithoutPrice = allIngredients.filter(i => !hasPrice(i)).length;

        // Low-stock alerts: rules whose available quantity is below the minimum
        // Por maestro: el stock ya está consolidado ahí arriba, así que cruzar
        // por el id crudo dejaba a cero toda regla escrita sobre un alias y
        // contaba como crítico un producto lleno.
        const stockById = new Map(stock.map(s => [s.ingredientId, s]));
        const lowStockCount = stockRules.filter(r => {
            const qty = stockById.get(resolverMaestro(r.ingredientId, porId))?.quantityAvailable ?? 0;
            return r.active && qty < r.minStock;
        }).length;

        return { stock, inventoryValue, distinctItems, productsWithoutPrice, lowStockCount };
    }, [purchaseHistory, allIngredients, stockRules, stockMovements]);

    // 2. Real recipe costing & margins
    const costing = useMemo(() => {
        const rows = allRecipes.map(r => {
            const cost = calculateRecipeCost(r, allIngredients, purchaseHistory).costoTotal || 0;
            const price = Number((r as any).precioVenta) || 0;
            const margin = price > 0 ? ((price - cost) / price) * 100 : null;
            return { recipe: r, cost, price, margin };
        });
        const costed = rows.filter(c => c.cost > 0);
        const withMargin = rows.filter(c => c.margin !== null) as { recipe: Recipe; cost: number; price: number; margin: number }[];
        const avgMargin = withMargin.length
            ? withMargin.reduce((s, c) => s + c.margin, 0) / withMargin.length
            : 0;
        const costedRate = allRecipes.length ? (costed.length / allRecipes.length) * 100 : 0;
        const best = withMargin.slice().sort((a, b) => b.margin - a.margin)[0] || null;
        const worst = withMargin.slice().sort((a, b) => a.margin - b.margin)[0] || null;
        return { rows, costedCount: costed.length, costedRate, avgMargin, withMarginCount: withMargin.length, best, worst };
    }, [allRecipes, allIngredients, purchaseHistory]);

    // 3. KPIs for the snapshot
    const kpis = useMemo(() => ({
        totalRecipes: allRecipes.length,
        totalTasks: allPizarronTasks.length,
        inventoryValue: inventory.inventoryValue,
        avgMargin: costing.avgMargin,
        costedRate: costing.costedRate,
        productsWithoutPrice: inventory.productsWithoutPrice,
    }), [allRecipes.length, allPizarronTasks.length, inventory, costing]);

    // 4. Activity trend (last 7 days) — counts BOTH recipes and tasks
    const creativeTrendData = useMemo(() => {
        const activityByDate: { [key: string]: { recipes: number; tasks: number } } = {};
        const bump = (v: any, key: 'recipes' | 'tasks') => {
            const d = toDate(v?.createdAt);
            if (!d) return;
            const dateStr = d.toISOString().split('T')[0];
            if (!activityByDate[dateStr]) activityByDate[dateStr] = { recipes: 0, tasks: 0 };
            activityByDate[dateStr][key]++;
        };
        allPizarronTasks.forEach(t => bump(t, 'tasks'));
        allRecipes.forEach(r => bump(r, 'recipes'));

        const today = new Date();
        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            if (!activityByDate[dateStr]) activityByDate[dateStr] = { recipes: 0, tasks: 0 };
        }
        return Object.entries(activityByDate)
            .map(([date, counts]) => ({ date, ...counts, total: counts.recipes + counts.tasks }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .slice(-7);
    }, [allPizarronTasks, allRecipes]);

    // 5. Recent activity timeline (real, newest first)
    const timeline = useMemo(() => {
        const events: { label: string; date: Date; type: 'idea' | 'recipe' | 'system' }[] = [];
        allRecipes.forEach(r => {
            const d = toDate((r as any).createdAt);
            if (d) events.push({ label: r.nombre || 'Receta', date: d, type: 'recipe' });
        });
        allPizarronTasks.forEach(t => {
            const d = toDate((t as any).createdAt);
            if (d) events.push({ label: t.title || t.texto || 'Tarea', date: d, type: 'idea' });
        });
        purchaseHistory.forEach(p => {
            const d = toDate((p as any).createdAt);
            if (d) events.push({ label: `Compra: ${p.ingredientName}`, date: d, type: 'system' });
        });
        return events.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 4);
    }, [allRecipes, allPizarronTasks, purchaseHistory]);

    // 6. DeepOps consolidated real metrics
    const deepOps = useMemo(() => ({
        inventoryValue: inventory.inventoryValue,
        distinctItems: inventory.distinctItems,
        productsWithoutPrice: inventory.productsWithoutPrice,
        avgMargin: costing.avgMargin,
        costedCount: costing.costedCount,
        costedRate: costing.costedRate,
        totalRecipes: allRecipes.length,
        bestRecipe: costing.best ? { name: costing.best.recipe.nombre, margin: costing.best.margin } : null,
        worstRecipe: costing.worst ? { name: costing.worst.recipe.nombre, margin: costing.worst.margin } : null,
        timeline,
    }), [inventory, costing, allRecipes.length, timeline]);

    // 7. Integrated AI features
    const { ideas, inProgress, urgent } = useToday(allPizarronTasks, userProfile);

    const { data: nbaData, isLoading: isNBALoading, refresh: refreshNBA } = useNextBestAction(
        allRecipes,
        allPizarronTasks,
        userProfile?.displayName || 'Usuario'
    );

    const { summary, insights, recommendation, stats } = useCreativeWeekPro(
        allPizarronTasks,
        userProfile?.displayName || 'Usuario'
    );

    // 6b. Business pulse (dedicated Grimorio widget)
    const business = useMemo(() => ({
        inventoryValue: inventory.inventoryValue,
        lowStockCount: inventory.lowStockCount,
        productsWithoutPrice: inventory.productsWithoutPrice,
        avgMargin: costing.avgMargin,
        bestRecipe: costing.best ? { name: costing.best.recipe.nombre, margin: costing.best.margin } : null,
        worstRecipe: costing.worst ? { name: costing.worst.recipe.nombre, margin: costing.worst.margin } : null,
    }), [inventory, costing]);

    return {
        kpis,
        deepOps,
        business,
        creativeTrendData,
        todayMetrics: { ideas, inProgress, urgent },
        nba: { data: nbaData, isLoading: isNBALoading, refresh: refreshNBA },
        creativeWeek: { summary, insights, recommendation, stats }
    };
};
