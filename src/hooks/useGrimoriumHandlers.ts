import { useState, useCallback } from 'react';
import { Firestore, writeBatch, doc } from 'firebase/firestore';
import { FirebaseStorage } from 'firebase/storage';
import { QueryClient } from '@tanstack/react-query';
import { Recipe, Ingredient } from '../types';

interface UseGrimoriumHandlersProps {
    db: Firestore;
    userId: string;
    appId: string;
    storage: FirebaseStorage;
    allIngredients: Ingredient[];
    allRecipes: Recipe[];
    selectedRecipes: string[];
    selectedRecipeId: string | null;
    selectedIngredients: string[];
    queryClient: QueryClient;
    setSelectedRecipes: (ids: string[]) => void;
    setSelectedRecipeId: (id: string | null) => void;
    setSelectedIngredients: (ids: string[]) => void;
    setLoading: (loading: boolean) => void;
    showToast: (message: string, type: 'success' | 'error' | 'info') => void;
    setShowTxtImportModal: (show: boolean) => void;
    setShowPdfImportModal: (show: boolean) => void;
    setShowCsvImportModal: (show: boolean) => void;
    setShowImportChoiceModal: (show: boolean) => void;
    onOpenRecipeModal: (recipe: Recipe | null) => void;
    onDragRecipeStart?: (recipe: Recipe) => void;
}

export const useGrimoriumHandlers = ({
    db, userId, appId, storage, allIngredients, allRecipes,
    selectedRecipes, selectedRecipeId, selectedIngredients,
    queryClient, setSelectedRecipes, setSelectedRecipeId, setSelectedIngredients,
    setLoading, showToast,
    setShowTxtImportModal, setShowPdfImportModal, setShowCsvImportModal, setShowImportChoiceModal,
    onOpenRecipeModal, onDragRecipeStart
}: UseGrimoriumHandlersProps) => {

    const [csvSupplierId, setCsvSupplierId] = useState<string>("");
    const [useOcr, setUseOcr] = useState(false);

    // --- DELETE HANDLERS ---
    const handleDeleteSelectedRecipes = useCallback(async () => {
        if (window.confirm(`¿Seguro que quieres eliminar ${selectedRecipes.length} recetas?`)) {
            try {
                const batch = writeBatch(db);
                selectedRecipes.forEach(id => batch.delete(doc(db, `users/${userId}/grimorio`, id)));
                await batch.commit();
                queryClient.invalidateQueries({ queryKey: ['recipes'] });
                setSelectedRecipes([]);
                setSelectedRecipeId(null);
                showToast(`${selectedRecipes.length} recetas eliminadas.`, 'success');
            } catch (error) {
                console.error("Error deleting recipes:", error);
                showToast("Error al eliminar las recetas seleccionadas.", 'error');
            }
        }
    }, [selectedRecipes, db, userId, queryClient, setSelectedRecipes, setSelectedRecipeId, showToast]);

    const handleDeleteSelectedIngredients = useCallback(async () => {
        if (window.confirm(`¿Seguro que quieres eliminar ${selectedIngredients.length} ingredientes?`)) {
            try {
                const batch = writeBatch(db);
                const ingredientsColPath = `artifacts/${appId}/users/${userId}/grimorio-ingredients`;
                selectedIngredients.forEach(id => batch.delete(doc(db, ingredientsColPath, id)));
                await batch.commit();
                queryClient.invalidateQueries({ queryKey: ['ingredients'] });
                setSelectedIngredients([]);
                showToast(`${selectedIngredients.length} ingredientes eliminados.`, 'success');
            } catch (error) {
                console.error("Error deleting ingredients:", error);
                showToast("Error al eliminar los ingredientes seleccionados.", 'error');
            }
        }
    }, [selectedIngredients, db, appId, userId, queryClient, setSelectedIngredients, showToast]);

    // --- IMPORT HANDLERS ---
    const handleTxtImport = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !db || !userId) return;
        setLoading(true);
        try {
            const { recipeImporter } = await import('../services/import/recipeImporter');
            const count = await recipeImporter.importFromTxt(file, db, userId, allIngredients);
            if (count > 0) {
                queryClient.invalidateQueries({ queryKey: ['recipes'] });
                showToast(`${count} recetas importadas.`, 'success');
            } else {
                showToast("No se encontraron recetas válidas.", 'error');
            }
        } catch (error) {
            console.error(error);
            showToast("Error importando TXT.", 'error');
        } finally {
            setLoading(false);
            setShowTxtImportModal(false);
        }
    }, [db, userId, allIngredients, queryClient, setLoading, showToast, setShowTxtImportModal]);

    const handlePdfImport = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !db || !userId || !storage) return;
        setLoading(true);
        try {
            const { recipeImporter } = await import('../services/import/recipeImporter');
            const count = await recipeImporter.importFromPdf(file, db, storage, userId, allIngredients, useOcr);
            if (count > 0) {
                queryClient.invalidateQueries({ queryKey: ['recipes'] });
                showToast(`${count} recetas importadas.`, 'success');
            } else {
                showToast("No se encontraron recetas.", 'error');
            }
        } catch (error) {
            console.error(error);
            showToast("Error importando PDF.", 'error');
        } finally {
            setLoading(false);
            setShowPdfImportModal(false);
        }
    }, [db, userId, storage, allIngredients, useOcr, queryClient, setLoading, showToast, setShowPdfImportModal]);

    const handleCsvImport = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !db || !userId) return;
        setLoading(true);
        try {
            const { recipeImporter } = await import('../services/import/recipeImporter');
            const { created, updated } = await recipeImporter.importIngredientsFromCsv(
                file, db, appId, userId, allIngredients, csvSupplierId
            );
            queryClient.invalidateQueries({ queryKey: ['ingredients'] });
            showToast(`Importación completada: ${created} nuevos, ${updated} actualizados.`, 'success');
        } catch (error) {
            console.error(error);
            showToast("Error importando CSV de ingredientes.", 'error');
        } finally {
            setLoading(false);
            setShowCsvImportModal(false);
            setCsvSupplierId("");
        }
    }, [db, userId, appId, allIngredients, csvSupplierId, queryClient, setLoading, showToast, setShowCsvImportModal]);

    const handleRecipeCsvImport = useCallback(async (file: File) => {
        if (!db || !userId) return;
        setLoading(true);
        try {
            const { recipeImporter } = await import('../services/import/recipeImporter');
            const { recipesCount, ingredientsCount } = await recipeImporter.importRecipesFromCsv(
                file, db, appId, userId, allIngredients
            );

            if (recipesCount > 0) {
                queryClient.invalidateQueries({ queryKey: ['recipes'] });
                queryClient.invalidateQueries({ queryKey: ['ingredients'] });
                showToast(`Importación exitosa: ${recipesCount} recetas, ${ingredientsCount} ingredientes nuevos.`, 'success');
            } else {
                showToast("No se encontraron recetas válidas en el CSV.", 'error');
            }
        } catch (error) {
            console.error("Error CSV Import:", error);
            showToast("Error al importar el archivo CSV.", 'error');
        } finally {
            setLoading(false);
            setShowImportChoiceModal(false);
        }
    }, [db, userId, appId, allIngredients, queryClient, setLoading, showToast, setShowImportChoiceModal]);

    const handleRecipePdfImportDirect = useCallback(async (file: File) => {
        if (!db || !userId || !storage) return;
        setLoading(true);
        try {
            const { recipeImporter } = await import('../services/import/recipeImporter');
            const count = await recipeImporter.importFromPdf(file, db, storage, userId, allIngredients, useOcr);
            if (count > 0) {
                queryClient.invalidateQueries({ queryKey: ['recipes'] });
                showToast(`${count} recetas importadas.`, 'success');
            } else {
                showToast("No se encontraron recetas.", 'error');
            }
        } catch (err) {
            console.error(err);
            showToast("Error importando PDF.", 'error');
        } finally {
            setLoading(false);
            setShowImportChoiceModal(false);
        }
    }, [db, userId, storage, allIngredients, useOcr, queryClient, setLoading, showToast, setShowImportChoiceModal]);

    // --- RECIPE CARD HANDLERS ---
    const handleSelectRecipeCard = useCallback((r: Recipe) => {
        setSelectedRecipeId(r.id);
    }, [setSelectedRecipeId]);

    const handleAddRecipeClick = useCallback(() => {
        onOpenRecipeModal(null);
    }, [onOpenRecipeModal]);

    const handleDragStartWrapper = useCallback((e: React.DragEvent, r: Recipe) => {
        if (onDragRecipeStart) onDragRecipeStart(r);
    }, [onDragRecipeStart]);

    return {
        // State
        csvSupplierId,
        setCsvSupplierId,
        useOcr,
        setUseOcr,

        // Handlers
        handleDeleteSelectedRecipes,
        handleDeleteSelectedIngredients,
        handleTxtImport,
        handlePdfImport,
        handleCsvImport,
        handleRecipeCsvImport,
        handleRecipePdfImportDirect,
        handleSelectRecipeCard,
        handleAddRecipeClick,
        handleDragStartWrapper
    };
};
