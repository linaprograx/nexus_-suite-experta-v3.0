import { isBeta } from '../config/appMode';
import { FullRoutes } from './FullRoutes';
import { BetaRoutes } from './BetaRoutes';

// Dynamic selection of routes based on APP_MODE
// This ensures clear separation of concerns without duplicating logic in App.tsx
export const AppRoutes = isBeta() ? BetaRoutes : FullRoutes;
