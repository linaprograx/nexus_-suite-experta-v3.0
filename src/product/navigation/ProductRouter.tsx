import React, { createContext, useContext, useState, ReactNode } from 'react';

export type ProductTab = 'home' | 'avatar' | 'cerebrity';
export type ProductRoute = 'login' | 'app';

interface NavigationState {
    currentRoute: ProductRoute;
    currentTab: ProductTab;
    navigate: (route: ProductRoute) => void;
    switchTab: (tab: ProductTab) => void;
    isAuthenticated: boolean;
    login: () => void;
    logout: () => void;
}

const ProductNavigationContext = createContext<NavigationState | undefined>(undefined);

export const ProductNavigationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [currentRoute, setCurrentRoute] = useState<ProductRoute>('login');
    const [currentTab, setCurrentTab] = useState<ProductTab>('home');
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    const login = () => {
        setIsAuthenticated(true);
        setCurrentRoute('app');
        setCurrentTab('home');
    };

    const logout = () => {
        setIsAuthenticated(false);
        setCurrentRoute('login');
    };

    const navigate = (route: ProductRoute) => {
        if (route === 'app' && !isAuthenticated) return;
        setCurrentRoute(route);
    };

    const switchTab = (tab: ProductTab) => {
        setCurrentTab(tab);
    };

    return (
        <ProductNavigationContext.Provider value={{
            currentRoute,
            currentTab,
            navigate,
            switchTab,
            isAuthenticated,
            login,
            logout
        }}>
            {children}
        </ProductNavigationContext.Provider>
    );
};

export const useProductNavigation = () => {
    const context = useContext(ProductNavigationContext);
    if (!context) throw new Error('useProductNavigation must be used within ProductNavigationProvider');
    return context;
};
