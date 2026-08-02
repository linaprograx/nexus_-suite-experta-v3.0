/**
 * Shared dashboard card styles.
 * Neutral by default (no permanent indigo glow) so only the hero element
 * (ActionCenter) commands attention. Cards lift gently on hover.
 */
export const dashboardPanel =
    "bg-white/70 dark:bg-slate-800/60 backdrop-blur-xl rounded-[24px] p-6 " +
    "border border-slate-200/70 dark:border-white/5 shadow-sm " +
    "hover:shadow-xl hover:-translate-y-0.5 hover:border-slate-300 dark:hover:border-white/10 " +
    "transition-all duration-300 relative overflow-hidden group";

/** Subtle top highlight overlay used inside panels. */
export const panelHighlight =
    "absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none";
