
import { PageName } from './types';

export const PAGE_THEMES: Record<PageName, {
  gradient: string;
  accent: string;
  dark: string;
  glow: string;
}> = {
  [PageName.Login]: {
    gradient: 'from-indigo-600 via-indigo-600 to-transparent',
    accent: 'indigo-500',
    dark: 'slate-950',
    glow: 'rgba(99, 102, 241, 0.4)'
  },
  [PageName.Dashboard]: {
    gradient: 'from-violet-600 via-purple-500/40 to-transparent',
    accent: 'violet-600',
    dark: 'slate-900',
    glow: 'rgba(124, 58, 237, 0.3)'
  },
  [PageName.GrimorioRecipes]: {
    gradient: 'from-emerald-600 via-teal-500/40 to-transparent',
    accent: 'emerald-600',
    dark: 'slate-950',
    glow: 'rgba(5, 150, 105, 0.3)'
  },
  [PageName.GrimorioMarket]: {
    gradient: 'from-amber-500 via-orange-400/20 to-transparent',
    accent: 'amber-500',
    dark: 'slate-900',
    glow: 'rgba(245, 158, 11, 0.2)'
  },
  [PageName.GrimorioStock]: {
    gradient: 'from-blue-600 via-indigo-500/30 to-transparent',
    accent: 'blue-600',
    dark: 'slate-900',
    glow: 'rgba(37, 99, 235, 0.2)'
  },
  [PageName.Pizarron]: {
    gradient: 'from-slate-700 via-slate-500/20 to-transparent',
    accent: 'slate-800',
    dark: 'slate-950',
    glow: 'rgba(51, 65, 85, 0.2)'
  },
  [PageName.CerebritySynthesis]: {
    gradient: 'from-violet-600 via-indigo-500/30 to-transparent',
    accent: 'violet-600',
    dark: 'black',
    glow: 'rgba(139, 92, 246, 0.3)'
  },
  [PageName.CerebrityMakeMenu]: {
    gradient: 'from-indigo-600 via-blue-500/20 to-transparent',
    accent: 'indigo-600',
    dark: 'slate-900',
    glow: 'rgba(79, 70, 229, 0.2)'
  },
  [PageName.CerebrityCritic]: {
    gradient: 'from-orange-600 via-amber-500/30 to-transparent',
    accent: 'orange-600',
    dark: 'slate-900',
    glow: 'rgba(234, 88, 12, 0.3)'
  },
  [PageName.CerebrityLab]: {
    gradient: 'from-cyan-600 via-blue-400/20 to-transparent',
    accent: 'cyan-500',
    dark: 'slate-950',
    glow: 'rgba(6, 182, 212, 0.2)'
  },
  [PageName.CerebrityTrend]: {
    gradient: 'from-pink-600 via-rose-500/20 to-transparent',
    accent: 'pink-600',
    dark: 'zinc-950',
    glow: 'rgba(219, 39, 119, 0.2)'
  },
  [PageName.AvatarCore]: {
    gradient: 'from-slate-900 via-slate-800/80 to-transparent',
    accent: 'slate-900',
    dark: 'zinc-950',
    glow: 'rgba(15, 23, 42, 0.3)'
  },
  [PageName.AvatarIntelligence]: {
    gradient: 'from-red-600 via-rose-500/40 to-transparent',
    accent: 'red-600',
    dark: 'zinc-950',
    glow: 'rgba(220, 38, 38, 0.3)'
  },
  [PageName.AvatarCompetition]: {
    gradient: 'from-lime-500 via-green-500/40 to-transparent',
    accent: 'lime-600',
    dark: 'zinc-950',
    glow: 'rgba(132, 204, 22, 0.3)'
  },
  [PageName.Colegium]: {
    gradient: 'from-violet-600 via-purple-500/40 to-transparent',
    accent: 'violet-600',
    dark: 'zinc-950',
    glow: 'rgba(124, 58, 237, 0.3)'
  },
  [PageName.Personal]: {
    gradient: 'from-slate-400 via-slate-200/20 to-transparent',
    accent: 'slate-800',
    dark: 'slate-900',
    glow: 'rgba(148, 163, 184, 0.1)'
  }
};
