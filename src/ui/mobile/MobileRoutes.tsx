import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { PageName, UserProfile } from './types';
import Dashboard from './views/Dashboard';
import GrimorioRecipes from './views/GrimorioRecipes';
import GrimorioStock from './views/GrimorioStock';
import GrimorioMarket from './views/GrimorioMarket';
import Pizarron from './views/Pizarron';
import CerebritySynthesis from './views/CerebritySynthesis';
import CerebrityCritic from './views/CerebrityCritic';
import CerebrityMakeMenu from './views/CerebrityMakeMenu';
import CerebrityLab from './views/CerebrityLab';
import CerebrityTrend from './views/CerebrityTrend';
import Colegium from './views/Colegium';
import Personal from './views/Personal';
import Avatar from './views/Avatar';
import Login from './views/Login';

interface MobileRoutesProps {
    user: any; // Type strictly later
    onNavigate: (page: PageName) => void;
    notify: (msg: string, type?: 'success' | 'error' | 'loading') => void;
}

const MobileRoutes: React.FC<MobileRoutesProps> = ({ user, onNavigate, notify }) => {

    // Helper to adapt Views that expect PageName/onNavigate to URL navigation
    // Since we pass onNavigate that wraps navigate(), it should work.

    return (
        <Routes>
            <Route path="/" element={<Dashboard onNavigate={onNavigate} user={user} notify={notify} />} />

            {/* Grimorio Sub-routes */}
            <Route path="/grimorio" element={<Navigate to="/grimorio/recipes" replace />} />
            <Route path="/grimorio/recipes" element={<GrimorioRecipes onNavigate={onNavigate} user={user} />} />
            <Route path="/grimorio/stock" element={<GrimorioStock onNavigate={onNavigate} user={user} />} />
            <Route path="/grimorio/market" element={<GrimorioMarket onNavigate={onNavigate} user={user} />} />

            <Route path="/pizarron" element={<Pizarron onNavigate={onNavigate} user={user} notify={notify} />} />

            {/* Cerebrity Sub-routes */}
            <Route path="/cerebrity" element={<Navigate to="/cerebrity/synthesis" replace />} />
            <Route path="/cerebrity/synthesis" element={<CerebritySynthesis onNavigate={onNavigate} user={user} notify={notify} />} />
            <Route path="/cerebrity/critic" element={<CerebrityCritic onNavigate={onNavigate} />} />
            <Route path="/cerebrity/lab" element={<CerebrityLab onNavigate={onNavigate} />} />
            <Route path="/cerebrity/trend" element={<CerebrityTrend onNavigate={onNavigate} />} />
            <Route path="/cerebrity/make-menu" element={<CerebrityMakeMenu onNavigate={onNavigate} />} />

            <Route path="/avatar" element={<Navigate to="/avatar/core" replace />} />
            <Route path="/avatar/core" element={<Avatar onNavigate={onNavigate} user={user} notify={notify} initialTab="Core" />} />
            <Route path="/avatar/intelligence" element={<Avatar onNavigate={onNavigate} user={user} notify={notify} initialTab="Intelligence" />} />
            <Route path="/avatar/competition" element={<Avatar onNavigate={onNavigate} user={user} notify={notify} initialTab="Competition" />} />

            <Route path="/colegium" element={<Colegium onNavigate={onNavigate} />} />
            <Route path="/personal" element={<Personal onNavigate={onNavigate} user={user} />} />

            {/* Login Route - Render Login component instead of redirecting */}
            <Route path="/login" element={<Login onNavigate={onNavigate} />} />

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
};

export default MobileRoutes;
