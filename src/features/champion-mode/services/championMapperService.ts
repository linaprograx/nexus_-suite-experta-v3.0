import { Recipe, PizarronTask, Ingredient } from '../../../types';

// Simple UUID generator fallback
const uuidv4 = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

/**
 * Maps a Champion Proposal to a Grimorium Recipe object.
 */
export const mapChampionProposalToRecipe = (
    proposal: {
        title: string;
        description: string;
        recipe: { ingredient: string; amount: string }[]
    },
    userProfile?: any
): Recipe => {
    return {
        id: uuidv4(),
        nombre: proposal.title,
        instrucciones: proposal.description,
        ingredientes: proposal.recipe.map(r => ({
            id: uuidv4(),
            nombre: r.ingredient,
            costo: 0,
            unidad: 'ml', // Default unit, logic could be smarter
            standardQuantity: parseFloat(r.amount) || 30 // Parse amount if possible
        } as Ingredient)),
        categorias: ['Champion Mode', 'Experimental'],
        createdAt: new Date(),
        storytelling: `Creado en Champion Mode: "${proposal.description}"`,
        // Default values to satisfy interface
        costoTotal: 0,
        precioVenta: 0,
        margen: 0
    };
};

/**
 * Maps a Champion Proposal to a list of Pizarrón Tasks for training/execution.
 */
export const mapChampionProposalToTasks = (
    proposal: { title: string },
    appId: string,
    userId: string,
    userName: string
): Partial<PizarronTask>[] => {
    const timestamp = new Date();
    const baseTask = {
        boardId: 'b-general', // Assuming default board
        status: 'ideas',
        priority: 'media' as const,
        createdAt: timestamp,
        updatedAt: timestamp,
        userId,
        authorName: userName,
        labels: ['Champion Mode']
    };

    return [
        {
            ...baseTask,
            texto: `[Diseño] Estandarizar receta: ${proposal.title}`,
            category: 'Producción'
        },
        {
            ...baseTask,
            texto: `[Cata] Testing sensorial: ${proposal.title}`,
            category: 'Calidad'
        },
        {
            ...baseTask,
            texto: `[Training] Pitch de venta: ${proposal.title}`,
            category: 'Servicio'
        },
        {
            ...baseTask,
            texto: `[Mise en Place] Preparar stock para competición: ${proposal.title}`,
            category: 'Operaciones'
        }
    ];
};
