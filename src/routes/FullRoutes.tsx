import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import DashboardView from "../views/DashboardView";
import GrimoriumView from "../views/GrimoriumView";
import PizarronView from "../views/PizarronView";
import CerebrityView from "../views/CerebrityView";
import TrendLocatorView from "../views/TrendLocatorView";
import UnleashView from "../views/UnleashView";
import AvatarView from "../views/AvatarView";
import MakeMenuView from "../views/MakeMenuView";
import ColegiumView from "../views/ColegiumView";
import PersonalView from "../views/PersonalView";
import { PlaceholderView } from "../components/ui/PlaceholderView";

export const FullRoutes = ({
    db,
    userId,
    appId,
    // allRecipes, allIngredients, allPizarronTasks, notifications, userProfile REMOVED
    onOpenRecipeModal,
    taskToOpen,
    onTaskOpened,
    draggingRecipe,
    draggingTask,
    onDropEnd,
    onDragTaskStart,
    onAnalyze,
    initialText,
    onAnalysisDone,
    onDragRecipeStart,

    auth,
    storage
}: any) => {
    return (
        <Routes>
            <Route path="/" element={<DashboardView />} />
            <Route path="/grimorium" element={
                <GrimoriumView
                    onOpenRecipeModal={onOpenRecipeModal}
                    onDragRecipeStart={onDragRecipeStart}
                    setCurrentView={() => { }}
                />
            } />
            <Route path="/pizarron" element={
                <PizarronView
                    db={db} userId={userId} appId={appId} auth={auth} storage={storage}
                    taskToOpen={taskToOpen} onTaskOpened={onTaskOpened}
                    draggingRecipe={draggingRecipe} draggingTask={draggingTask} onDropEnd={onDropEnd}
                    onDragTaskStart={onDragTaskStart} onAnalyze={onAnalyze}
                    userProfile={{}} // View uses hook now
                />
            } />
            <Route path="/cerebrity" element={
                <CerebrityView
                    db={db} userId={userId} storage={storage} appId={appId}
                    onOpenRecipeModal={onOpenRecipeModal}
                    initialText={initialText}
                    onAnalysisDone={onAnalysisDone}
                />
            } />
            <Route path="/trend-locator" element={<TrendLocatorView db={db} userId={userId} appId={appId} />} />
            <Route path="/unleash" element={<Navigate to="/cerebrity" replace />} />
            <Route path="/avatar" element={<AvatarView />} />
            <Route path="/make-menu" element={<MakeMenuView db={db} userId={userId} appId={appId} />} />
            <Route path="/collegium" element={<ColegiumView />} />
            <Route path="/colegium" element={<ColegiumView />} />
            <Route path="/personal" element={<PersonalView db={db} userId={userId} storage={storage} auth={auth} />} />

            {/* Catch-all for legacy or undefined routes */}
            <Route path="*" element={<PlaceholderView title="404 - Not Found" />} />
        </Routes>
    );
};
