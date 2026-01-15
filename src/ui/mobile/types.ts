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
    displayName?: string;
    photo: string;
    photoURL?: string;
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
export type NodeType = 'task' | 'idea' | 'recipe' | 'decision' | 'note' | 'shape' | 'sticker';
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
    currentPage: PageName;
    onNavigate: (page: PageName) => void;
}

export interface PizarronTask {
    id: string;
    title: string;
    description?: string;
    texto?: string; // Legacy fallback
    content?: string; // Legacy fallback
    status?: string;
    priority?: string;
    position?: { x: number; y: number };
    width?: number;
    height?: number;
    style?: { backgroundColor?: string };
    type?: string;
    boardId?: string;
    createdAt?: any;
    authorName?: string;
}

export const PAGE_THEMES: Record<PageName | string, { gradient: string; accent: string; glowColor?: string }> = {
    [PageName.Login]: {
        gradient: 'linear-gradient(180deg, #2563EB 0%, #7C3AED 25%, #DB2777 50%, rgba(248, 249, 250, 0) 80%)',
        accent: '#4338ca',
        glowColor: '#7C3AED'
    },
    [PageName.Dashboard]: {
        gradient: 'linear-gradient(180deg, #0066FF 0%, #00C2FF 35%, rgba(0, 102, 255, 0) 55%)',
        accent: '#0066FF',
        glowColor: '#0066FF'
    },

    // Grimorium Theme Parity - Ultra-Vivid
    [PageName.GrimorioRecipes]: {
        gradient: 'linear-gradient(180deg, #ff5e00 0%, #ff8800 25%, rgba(255, 136, 0, 0) 45%)',
        accent: '#ff6a00',
        glowColor: '#ff8800'
    },
    [PageName.GrimorioStock]: {
        gradient: 'linear-gradient(180deg, #FF2E2E 0%, #FF4D4D 35%, rgba(255, 46, 77, 0) 55%)',
        accent: '#FF2E2E',
        glowColor: '#FF4D4D'
    },
    [PageName.GrimorioMarket]: {
        gradient: 'linear-gradient(180deg, #00E096 0%, #10B981 35%, rgba(16, 185, 129, 0) 65%)',
        accent: '#00E096',
        glowColor: '#10B981'
    },

    [PageName.Pizarron]: {
        gradient: 'linear-gradient(180deg, rgba(0, 229, 255, 0.15) 0%, rgba(240, 249, 250, 0) 100%)',
        accent: '#00E5FF',
        glowColor: '#00E5FF'
    },

    // Cerebrity Distinct Themes - Ultra-Vivid
    [PageName.CerebritySynthesis]: {
        gradient: 'linear-gradient(180deg, #FF00CC 0%, #8F00FF 35%, rgba(143, 0, 255, 0) 65%)',
        accent: '#FF00CC',
        glowColor: '#8F00FF'
    },
    [PageName.CerebrityCritic]: {
        gradient: 'linear-gradient(180deg, #00E5FF 0%, #0097A7 35%, rgba(0, 151, 167, 0) 65%)',
        accent: '#00E5FF',
        glowColor: '#0097A7'
    },
    [PageName.CerebrityLab]: {
        gradient: 'linear-gradient(180deg, #F000FF 0%, #6200EE 40%, rgba(98, 0, 238, 0) 100%)',
        accent: '#F000FF',
        glowColor: '#6200EE'
    },
    [PageName.CerebrityTrend]: {
        gradient: 'linear-gradient(180deg, #FFD700 0%, #D97706 35%, rgba(217, 119, 6, 0) 65%)',
        accent: '#FFD700',
        glowColor: '#D97706'
    },
    [PageName.CerebrityMakeMenu]: {
        gradient: 'linear-gradient(180deg, rgba(255, 230, 0, 0.3) 0%, rgba(255, 230, 0, 0.1) 35%, rgba(255, 230, 0, 0) 60%)',
        accent: '#FFE600',
        glowColor: '#FFE600'
    },

    // Avatar Themes - Ultra-Vivid
    [PageName.AvatarCore]: {
        gradient: 'linear-gradient(180deg, #312E81 0%, #4338ca 30%, #7C3AED 55%, rgba(124, 58, 237, 0) 85%)',
        accent: '#7C3AED',
        glowColor: '#8B5CF6'
    },
    [PageName.AvatarIntelligence]: {
        gradient: 'linear-gradient(180deg, #DC2626 0%, #EF4444 35%, rgba(239, 68, 68, 0) 65%)',
        accent: '#DC2626',
        glowColor: '#EF4444'
    },
    [PageName.AvatarCompetition]: {
        gradient: 'linear-gradient(180deg, #10B981 0%, #34D399 35%, rgba(52, 211, 153, 0) 65%)',
        accent: '#10B981',
        glowColor: '#34D399'
    },

    [PageName.Colegium]: {
        gradient: 'linear-gradient(180deg, #ea580c 0%, #f97316 35%, rgba(249, 115, 22, 0) 65%)',
        accent: '#ea580c',
        glowColor: '#f97316'
    },
    [PageName.Personal]: {
        gradient: 'linear-gradient(180deg, #172554 0%, #1E293B 45%, rgba(30, 41, 59, 0) 80%)',
        accent: '#3B82F6',
        glowColor: '#3B82F6'
    },

    // Fallbacks
    'default': {
        gradient: 'linear-gradient(135deg, #FFDEE9 0%, #B5FFFC 100%)',
        accent: '#6D28D9',
        glowColor: '#8B5CF6'
    }
};

