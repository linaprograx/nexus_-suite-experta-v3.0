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

export const AppRouter = ({
    db,
    userId,
    appId,
    allRecipes,
    allIngredients,
    allPizarronTasks,
    notifications,
    userProfile,
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
            <Route path="/" element={
                <DashboardView
                    allRecipes={allRecipes}
                    allPizarronTasks={allPizarronTasks}
                    allIngredients={allIngredients}

                    auth={auth}
                />
            } />
            <Route path="/grimorium" element={
                <GrimoriumView
                    db={db}
                    userId={userId}
                    appId={appId}
                    allIngredients={allIngredients}
                    allRecipes={allRecipes}
                    onOpenRecipeModal={onOpenRecipeModal}
                    onDragRecipeStart={onDragRecipeStart}
                    setCurrentView={() => { }}
                />
            } />
            <Route path="/pizarron" element={
                <PizarronView
                    db={db}
                    userId={userId}
                    appId={appId}
                    auth={auth}
                    storage={storage}
                    allPizarronTasks={allPizarronTasks}
                    taskToOpen={taskToOpen}
                    onTaskOpened={onTaskOpened}
                    draggingRecipe={draggingRecipe}
                    draggingTask={draggingTask}
                    onDropEnd={onDropEnd}
                    onDragTaskStart={onDragTaskStart}
                    onAnalyze={onAnalyze}
                    userProfile={userProfile}
                />
            } />
            <Route path="/cerebrity" element={
                <CerebrityView
                    db={db} userId={userId} storage={storage} appId={appId}
                    allRecipes={allRecipes} allIngredients={allIngredients} onOpenRecipeModal={onOpenRecipeModal}
                    initialText={initialText}
                    onAnalysisDone={onAnalysisDone}
                />
            } />
            <Route path="/trend-locator" element={<TrendLocatorView db={db} userId={userId} appId={appId} />} />
            <Route path="/unleash" element={<UnleashView allRecipes={allRecipes} allIngredients={allIngredients} db={db} userId={userId} />} />
            <Route path="/avatar" element={<AvatarView />} />
            <Route path="/make-menu" element={<MakeMenuView db={db} userId={userId} appId={appId} allRecipes={allRecipes} allPizarronTasks={allPizarronTasks} />} />
            <Route path="/colegium" element={<ColegiumView db={db} userId={userId} allRecipes={allRecipes} allPizarronTasks={allPizarronTasks} />} />
            <Route path="/personal" element={<PersonalView db={db} userId={userId} storage={storage} auth={auth} allRecipes={allRecipes} allPizarronTasks={allPizarronTasks} />} />

            {/* Catch-all for legacy or undefined routes */}
            <Route path="*" element={<PlaceholderView title="404 - Not Found" />} />
        </Routes>
    );
};
