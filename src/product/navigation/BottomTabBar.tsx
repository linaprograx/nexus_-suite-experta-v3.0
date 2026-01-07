import React from 'react';
import { useProductNavigation, ProductTab } from './ProductRouter';

// Simple Icons (inline for simplicity or import if available)
const Icons = {
    Home: () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
    Avatar: () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
    Cerebrity: () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>,
};

export const BottomTabBar: React.FC = () => {
    const { currentTab, switchTab } = useProductNavigation();

    const TabItem = ({ tab, icon: Icon, label }: { tab: ProductTab, icon: any, label: string }) => {
        const isActive = currentTab === tab;
        return (
            <button
                onClick={() => switchTab(tab)}
                className={`flex flex-col items-center justify-center flex-1 py-3 transition-all duration-300 ${isActive ? 'text-violet-600 scale-105' : 'text-slate-400 hover:text-slate-600'}`}
            >
                <div className={`transition-all duration-300 ${isActive ? 'drop-shadow-[0_0_8px_rgba(139,92,246,0.5)]' : ''}`}>
                    <Icon />
                </div>
                <span className={`text-[10px] font-medium mt-1 ${isActive ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>{label}</span>
                {isActive && <div className="absolute top-0 w-8 h-1 bg-gradient-to-r from-violet-500 to-cyan-500 rounded-b-full shadow-[0_4px_12px_rgba(139,92,246,0.4)]" />}
            </button>
        );
    };

    return (
        <div className="fixed bottom-6 left-4 right-4 h-16 bg-white/70 backdrop-blur-xl border border-white/40 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.1)] flex items-center justify-around z-50 ring-1 ring-white/50">
            <TabItem tab="home" icon={Icons.Home} label="Home" />
            <TabItem tab="cerebrity" icon={Icons.Cerebrity} label="Cerebrity" />
            <TabItem tab="avatar" icon={Icons.Avatar} label="Avatar" />
        </div>
    );
};
