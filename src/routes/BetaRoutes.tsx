import React from 'react';
import { Routes, Route, Navigate } from "react-router-dom";
import { PlaceholderView } from "../components/ui/PlaceholderView";

export const BetaRoutes = ({
    // Accepting same props to ensure interface compatibility with App.tsx
    db, userId, appId, onOpenRecipeModal, taskToOpen, onTaskOpened,
    draggingRecipe, draggingTask, onDropEnd, onDragTaskStart,
    onAnalyze, initialText, onAnalysisDone, onDragRecipeStart,
    auth, storage
}: any) => {
    return (
        <Routes>
            {/* Mobile-First simplified routes */}
            <Route path="/" element={<PlaceholderView title="Mobile Dashboard (Beta)" />} />
            <Route path="/onboarding" element={<PlaceholderView title="Mobile Onboarding (Beta)" />} />
            <Route path="/grimorium" element={<PlaceholderView title="Mobile Grimorium (Beta)" />} />

            {/* Redirect unknown routes to root in Beta for now */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
};
