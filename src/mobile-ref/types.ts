
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

export type AvatarSubSection = 'Core' | 'Intelligence' | 'Competition';

export interface UserProfile {
  name: string;
  photo: string;
  role: string;
}

export interface NavigationProps {
  currentPage: PageName;
  onNavigate: (page: PageName) => void;
}

export interface NotificationState {
  show: boolean;
  message: string;
  type: 'success' | 'error' | 'loading';
}

export interface Recipe {
  id: string;
  name: string;
  type: string;
  cost: number;
  price: number;
  margin: string;
  stock: string;
  trend: string;
  status: string;
  color: string;
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
