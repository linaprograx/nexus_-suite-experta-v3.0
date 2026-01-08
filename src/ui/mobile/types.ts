export enum PageName {
    Login = 'Login',
    Dashboard = 'Dashboard',
    GrimorioRecipes = 'Grimorio – Recipes',
    GrimorioMarket = 'Grimorio – Market',
    GrimorioStock = 'Grimorio – Stock',
    Pizarron = 'Pizarrón',
    CerebritySynthesis = 'Cerebrity – Synthesis',
    CerebrityMakeMenu = 'Cerebrity – Make Menu',
    CerebrityCritic = 'Cerebrity – The Critic',
    CerebrityLab = 'Cerebrity – The Lab',
    CerebrityTrend = 'Cerebrity – Trend Locator',
    AvatarCore = 'Avatar – Core',
    AvatarIntelligence = 'Avatar – Intelligence',
    AvatarCompetition = 'Avatar – Competition',
    Colegium = 'Colegium',
    Personal = 'Personal'
}

export interface UserProfile {
    name: string;
    photo: string;
    role: string;
}

export interface StockItem {
    id: string;
    name: string;
    current: number;
    min: number;
    unit: string;
    supplier: string;
    price: number;
}

// Pizarron Node Types
export type NodeType = 'task' | 'idea' | 'recipe' | 'decision' | 'note';
export type NodeStatus = 'draft' | 'active' | 'blocked' | 'completed';
export type NodePriority = 'low' | 'medium' | 'high' | 'urgent';

export interface PizarronNode {
    id: string;
    type: NodeType;
    title: string;
    description: string;
    status: NodeStatus;
    priority: NodePriority;
    x: number;
    y: number;
    width: number;
    height: number;
    color: string;
    accent: string;
}

export interface NavigationProps {
    currentPage: string;
    onNavigate: (page: string) => void;
}

export const PAGE_THEMES: Record<PageName | string, { gradient: string; accent: string }> = {
    [PageName.Login]: { gradient: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)', accent: '#4338ca' },
    [PageName.Dashboard]: { gradient: 'linear-gradient(135deg, #FFDEE9 0%, #B5FFFC 100%)', accent: '#6D28D9' },
    [PageName.GrimorioRecipes]: { gradient: 'linear-gradient(135deg, #d9f99d 0%, #bef264 100%)', accent: '#10B981' }, // Lime/Green
    [PageName.GrimorioStock]: { gradient: 'linear-gradient(135deg, #fecaca 0%, #fca5a5 100%)', accent: '#EF4444' }, // Red
    [PageName.GrimorioMarket]: { gradient: 'linear-gradient(135deg, #fde68a 0%, #fcd34d 100%)', accent: '#F59E0B' }, // Amber
    [PageName.Pizarron]: { gradient: 'linear-gradient(135deg, #E0EAFC 0%, #CFDEF3 100%)', accent: '#3B82F6' },
    [PageName.CerebritySynthesis]: { gradient: 'linear-gradient(135deg, #fae8ff 0%, #e879f9 100%)', accent: '#D946EF' },
    [PageName.AvatarCore]: { gradient: 'linear-gradient(135deg, #f3f4f6 0%, #d1d5db 100%)', accent: '#1F2937' },
    // Fallbacks
    'default': { gradient: 'linear-gradient(135deg, #FFDEE9 0%, #B5FFFC 100%)', accent: '#6D28D9' }
};
