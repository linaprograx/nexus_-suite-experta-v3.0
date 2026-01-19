import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { CerebrityHeader } from '../components/CerebrityHeader';
import { PageName } from '../types';

export const CerebrityLayout: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const getCurrentPage = (): PageName => {
        const path = location.pathname;
        if (path.includes('/cerebrity/critic')) return PageName.CerebrityCritic;
        if (path.includes('/cerebrity/lab')) return PageName.CerebrityLab;
        if (path.includes('/cerebrity/trend')) return PageName.CerebrityTrend;
        if (path.includes('/cerebrity/make-menu')) return PageName.CerebrityMakeMenu;
        return PageName.CerebritySynthesis;
    };

    const handleNavigate = (page: PageName) => {
        switch (page) {
            case PageName.CerebritySynthesis: navigate('/cerebrity/synthesis'); break;
            case PageName.CerebrityCritic: navigate('/cerebrity/critic'); break;
            case PageName.CerebrityLab: navigate('/cerebrity/lab'); break;
            case PageName.CerebrityTrend: navigate('/cerebrity/trend'); break;
            case PageName.CerebrityMakeMenu: navigate('/cerebrity/make-menu'); break;
        }
    };

    return (
        <div className="flex flex-col h-full">
            <CerebrityHeader
                currentPage={getCurrentPage()}
                onNavigate={handleNavigate}
            />
            <div className="flex-1 overflow-hidden relative">
                <Outlet />
            </div>
        </div>
    );
};
