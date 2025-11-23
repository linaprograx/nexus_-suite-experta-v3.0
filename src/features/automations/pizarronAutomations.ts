import { Firestore, doc, getDoc } from 'firebase/firestore';
import { PizarronTask } from '../../types';
import { recipeService } from '../recipes/recipeService';
import { usePizarraStore } from '../../store/pizarraStore';

export const createDraftRecipeFromTask = async (
    db: Firestore, 
    userId: string, 
    taskId: string, 
    appId: string
) => {
    const { automationsEnabled } = usePizarraStore.getState();
    if (!automationsEnabled) return;

    try {
        // 1. Fetch task details (if we only have ID)
        // In this context, we might only have the ID or the partial task object.
        // It is safer to fetch the fresh task data or accept the task object.
        // Assuming we fetch it to be safe, or pass it.
        // Let's fetch it for simplicity and correctness.
        const taskRef = doc(db, `artifacts/${appId}/public/data/pizarron-tasks`, taskId);
        const taskSnap = await getDoc(taskRef);
        
        if (!taskSnap.exists()) return;
        const task = taskSnap.data() as PizarronTask;

        // 2. Create Recipe
        // "crear una receta en Grimorium con el mismo nombre, estado='borrador', categoría='General', imagen vacía."
        // We will assume 'estado' needs to be handled via category or similar if not in schema.
        // But given the instruction "estado='borrador'", and Recipe schema doesn't have it,
        // we will append 'Borrador' to categories or just ignore if strict schema.
        // However, I will add 'Borrador' to categories to be helpful.
        
        await recipeService.addRecipe(db, userId, {
            nombre: task.texto,
            categorias: ['General', 'Borrador'],
            imageUrl: null,
            // Initialize other required fields
            ingredientes: [],
            preparacion: '',
            storytelling: '',
            elementoCreativo: '',
            ingredientesTexto: '',
            garnish: '',
            elaboracionesComplejas: ''
        });

        console.log(`Automation: Created draft recipe for task "${task.texto}"`);

    } catch (error) {
        console.error("Error in approve automation:", error);
    }
};

export const runAutomations = async (task: PizarronTask, sourceColumn: string, destinationColumn: string) => {
    console.log("Running automations for task:", task.id);
    console.log(`Moved from ${sourceColumn} to ${destinationColumn}`);
    // Future automation logic here
};
