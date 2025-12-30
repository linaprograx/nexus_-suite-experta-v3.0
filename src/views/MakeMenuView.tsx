import React, { useState } from 'react';
import { Firestore } from 'firebase/firestore';
import { Type } from "@google/genai";
import { useSearchParams } from 'react-router-dom';
import { Recipe, PizarronTask, MenuLayout } from '../types';
import { makeMenuService } from '../services/makeMenuService';
import { callGeminiApi } from '../utils/gemini';
// import { PremiumLayout } from '../components/layout/PremiumLayout';

// Sub-components
import MakeMenuSidebar from '../components/make-menu/MakeMenuSidebar';
import DesignerControls from '../components/make-menu/DesignerControls';
import DesignerResults from '../components/make-menu/DesignerResults';

import { useRecipes } from '../hooks/useRecipes';
import { usePizarronData } from '../hooks/usePizarronData';

interface MakeMenuViewProps {
    db: Firestore;
    userId: string;
    appId: string;
    // allRecipes, allPizarronTasks REMOVED
}

const MakeMenuView: React.FC<MakeMenuViewProps> = ({ db, userId, appId }) => {
    const { recipes: allRecipes } = useRecipes();
    const { tasks: allPizarronTasks } = usePizarronData();

    // --- Designer State ---
    const [selectedRecipeIds, setSelectedRecipeIds] = useState<string[]>([]);
    const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
    const [loadingDesigner, setLoadingDesigner] = useState(false);
    const [errorDesigner, setErrorDesigner] = useState<string | null>(null);
    const [menuResults, setMenuResults] = useState<MenuLayout[]>([]);
    const [pizarronDraft, setPizarronDraft] = useState<any>(null);
    const [searchParams, setSearchParams] = useSearchParams();

    // Phase 6.2: Listen for Pizarrón drafts
    React.useEffect(() => {
        const checkDraft = () => {
            const raw = localStorage.getItem('pizarron_menu_draft');
            if (raw) {
                try {
                    const draft = JSON.parse(raw);
                    setPizarronDraft(draft);
                    return draft;
                } catch (e) {
                    console.error("Failed to parse Pizarrón draft", e);
                }
            }
            return null;
        };

        const draft = checkDraft();

        // Phase 6.2.B: Auto-trigger FIX
        if (searchParams.get('trigger') === 'pizarron' && draft) {
            console.log("[MakeMenuView] 🚀 Pizarrón Trigger Detected. Auto-generating...");

            // 1. Resolve recipes from draft immediately
            const draftRecipeIds: string[] = [];
            draft.sections.forEach((s: any) => {
                s.items.forEach((itemId: string) => {
                    const data = draft._nodeData?.[itemId];
                    if (data?.recipeId) draftRecipeIds.push(data.recipeId);
                });
            });

            // 2. Clear param to avoid loop on refresh
            const newParams = new URLSearchParams(searchParams);
            newParams.delete('trigger');
            setSearchParams(newParams, { replace: true });

            // 3. Trigger generation
            if (draftRecipeIds.length > 0) {
                // We need to pass IDs directly to bypass state lag
                handleGenerateMenus(draftRecipeIds, draft);
            }
        }

        window.addEventListener('storage', checkDraft);
        return () => window.removeEventListener('storage', checkDraft);
    }, [searchParams]);

    // --- Designer Handlers ---
    const handleDesignerSelection = (id: string, type: 'recipe' | 'task') => {
        const updater = type === 'recipe' ? setSelectedRecipeIds : setSelectedTaskIds;
        updater(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const applyPizarronIntention = () => {
        if (!pizarronDraft) return;

        const recipeIds: string[] = [];
        pizarronDraft.sections.forEach((s: any) => {
            s.items.forEach((itemId: string) => {
                const data = pizarronDraft._nodeData?.[itemId];
                if (data?.recipeId) {
                    recipeIds.push(data.recipeId);
                }
            });
        });

        if (recipeIds.length > 0) {
            setSelectedRecipeIds(prev => {
                const combined = new Set([...prev, ...recipeIds]);
                return Array.from(combined);
            });
            console.log("[MakeMenuView] Applied Pizarrón Intention:", recipeIds.length, "recipes added.");
        }
    };

    const handleGenerateMenus = async (manualRecipeIds?: string[], manualDraft?: any) => {
        setLoadingDesigner(true);
        setErrorDesigner(null);
        setMenuResults([]);

        // Phase 6.2.B: Use manual IDs ONLY if it's a valid array (prevents MouseEvent leak)
        const isManual = Array.isArray(manualRecipeIds);
        const effectiveRecipeIds = isManual ? manualRecipeIds : selectedRecipeIds;
        const effectiveDraft = isManual ? manualDraft : pizarronDraft;

        if (isManual) {
            setSelectedRecipeIds(manualRecipeIds);
        }

        const selectedRecipes = allRecipes.filter(r => effectiveRecipeIds.includes(r.id));
        const pizarronAprobado = allPizarronTasks.filter(task => task.status === 'aprobado');
        const selectedTasks = pizarronAprobado.filter(t => selectedTaskIds.includes(t.id));

        const sectionTitles = effectiveDraft?.sections?.map((s: any) => s.title) || [];

        try {
            const results = await makeMenuService.generateProposals(
                selectedRecipes,
                selectedTasks,
                sectionTitles
            );

            // Map service results to MenuLayout expected by DesignerResults
            const layouts: MenuLayout[] = results.map(r => ({
                themeName: r.themeName,
                description: r.description,
                suggestedTypography: r.suggestedTypography,
                htmlContent: r.htmlContent
            }));

            setMenuResults(layouts);
        } catch (e: any) {
            console.error("Designer Error:", e);
            setErrorDesigner(e.message || "Error al generar menús");
        } finally {
            setLoadingDesigner(false);
        }
    };

    return (
        <div className="h-full grid grid-cols-1 lg:grid-cols-[220px,minmax(0,1fr),220px] gap-6">
            {/* Left Sidebar */}
            <div className="h-full min-h-0 flex flex-col relative z-20">
                <MakeMenuSidebar
                    activeMode={'designer'}
                    onModeChange={() => { }}
                />
            </div>

            {/* Main Content */}
            <div className="h-full min-h-0 overflow-hidden flex flex-col relative rounded-2xl z-20">
                <DesignerResults
                    results={menuResults}
                    loading={loadingDesigner}
                    error={errorDesigner}
                    db={db}
                    userId={userId}
                    appId={appId}
                />
            </div>

            {/* Right Sidebar */}
            <div className="h-full min-h-0 flex flex-col relative z-20">
                <DesignerControls
                    allRecipes={allRecipes}
                    allPizarronTasks={allPizarronTasks}
                    selectedRecipeIds={selectedRecipeIds}
                    selectedTaskIds={selectedTaskIds}
                    loading={loadingDesigner}
                    onSelectionChange={handleDesignerSelection}
                    onGenerate={handleGenerateMenus}
                    onApplyIntention={applyPizarronIntention}
                    pizarronDraft={pizarronDraft}
                />
            </div>
        </div>
    );
};

export default MakeMenuView;


