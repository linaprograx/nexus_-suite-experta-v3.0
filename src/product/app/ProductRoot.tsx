import React from 'react';
import { ProductNavigationProvider, useProductNavigation } from '../navigation/ProductRouter';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { HomeScreen } from '../screens/home/HomeScreen';
import { AvatarScreen } from '../screens/avatar/AvatarScreen';
import { CerebrityScreen } from '../screens/cerebrity/CerebrityScreen';
import { BottomTabBar } from '../navigation/BottomTabBar';

const ProductShell: React.FC = () => {
    const { currentRoute, currentTab } = useProductNavigation();

    // Route: Login
    if (currentRoute === 'login') {
        return <LoginScreen />;
    }

    // Route: App (Authenticated)
    return (
        <div className="flex-1 flex flex-col h-screen relative bg-gradient-to-br from-slate-100 via-indigo-50/50 to-slate-200 overflow-hidden">
            {/* Background Mesh (Persistent) */}
            <div className="fixed inset-0 pointer-events-none opacity-40 mix-blend-multiply" style={{ background: 'radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.05) 0%, transparent 60%)' }} />

            <main className="flex-1 overflow-y-auto">
                {currentTab === 'home' && <HomeScreen />}
                {currentTab === 'avatar' && <AvatarScreen />}
                {currentTab === 'cerebrity' && <CerebrityScreen />}
            </main>

            <BottomTabBar />
        </div>
    );
};

export const ProductRoot: React.FC = () => {
    return (
        <ProductNavigationProvider>
            <div className="h-screen w-full flex flex-col bg-slate-50 text-slate-900 font-sans antialiased">
                <ProductShell />
                {/* Mode Indicator */}
                <div className="fixed top-4 right-4 px-2 py-0.5 bg-slate-200/50 rounded text-[9px] text-slate-400 font-mono pointer-events-none z-[60]">
                    v3.0-mobile
                </div>
            </div>
        </ProductNavigationProvider>
    );
};
