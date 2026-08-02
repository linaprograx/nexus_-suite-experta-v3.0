import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { APP_SECTIONS, AppSection } from '../../../config/appSections';
import { useSectionsStore } from '../../../store/sectionsStore';
import { Icon } from '../../../components/ui/Icon';
import { ICONS } from '../../../components/ui/icons';
import { BottomSheet } from '../../../components/ui/BottomSheet';

/** Height of the bar itself, excluding the safe-area inset. */
export const BOTTOM_NAV_HEIGHT = 60;

/**
 * How many destinations fit before we spill into a "Más" sheet.
 * At 390px a comfortable touch target is ~64px wide, so five is the honest
 * maximum. Beyond that the bar either shrinks below the 44px guideline or
 * starts scrolling horizontally — and a nav bar you have to scroll to find
 * things in is worse than one extra tap.
 */
const MAX_SLOTS = 5;

/** Per-section accent, so the active tab tells you where you are by colour. */
const SECTION_ACCENT: Record<string, string> = {
    dashboard: '#0ea5e9',
    grimorium: '#10b981',
    cerebrIty: '#ec4899',
    pizarron: '#6366f1',
    avatar: '#8b5cf6',
    colegium: '#f59e0b',
    personal: '#64748b',
};

const PERSONAL: AppSection = {
    id: 'personal', label: 'Perfil', icon: ICONS.user, path: '/personal', locked: true,
};

interface NavButtonProps {
    section: AppSection;
    active: boolean;
    onClick: () => void;
}

const NavButton: React.FC<NavButtonProps> = ({ section, active, onClick }) => {
    const accent = SECTION_ACCENT[section.id] || '#64748b';
    return (
        <button
            onClick={onClick}
            aria-label={section.label}
            aria-current={active ? 'page' : undefined}
            // Colour lives here: Icon renders currentColor, so the whole button
            // (icon + label) tints from one place.
            className={`relative flex-1 min-w-0 h-full flex flex-col items-center justify-center gap-0.5 active:scale-90 transition-transform duration-150 ${active ? '' : 'text-slate-400 dark:text-slate-500'}`}
            style={active ? { color: accent } : undefined}
        >
            {/* Active pill sits behind the icon rather than resizing the button,
                so tapping never makes the row reflow under the thumb. */}
            {active && (
                <span
                    className="absolute inset-x-1 inset-y-1 rounded-2xl transition-opacity"
                    style={{ backgroundColor: `${accent}1f` }}
                />
            )}
            <span className="relative">
                <Icon svg={section.icon} className="w-[22px] h-[22px]" />
            </span>
            <span className="relative text-[9px] font-semibold tracking-wide truncate max-w-full px-0.5">
                {section.label}
            </span>
        </button>
    );
};

/**
 * Mobile bottom navigation.
 *
 * Drives off APP_SECTIONS + the sections store, so it shows exactly what the
 * user enabled in Personal → Configuración; there is no second list to keep in
 * sync with the desktop sidebar.
 *
 * Replaces the old top header (logo + hamburger), which spent ~64px of a phone
 * screen on a title each view already renders itself, and hid navigation behind
 * an extra tap.
 */
const FloatingBottomNav: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const hiddenSections = useSectionsStore(s => s.hiddenSections);
    const [moreOpen, setMoreOpen] = React.useState(false);

    const visible = React.useMemo(
        () => APP_SECTIONS.filter(s => s.locked || !hiddenSections.includes(s.id)),
        [hiddenSections]
    );

    // Everything that doesn't fit, plus the profile, lives behind "Más".
    const { primary, overflow } = React.useMemo(() => {
        const all = [...visible, PERSONAL];
        if (all.length <= MAX_SLOTS) return { primary: all, overflow: [] as AppSection[] };
        return { primary: all.slice(0, MAX_SLOTS - 1), overflow: all.slice(MAX_SLOTS - 1) };
    }, [visible]);

    /**
     * Longest matching path wins, so /grimorium doesn't lose to the "/" of
     * Dashboard — which is a prefix of literally every route.
     */
    const activeId = React.useMemo(() => {
        const path = location.pathname;
        let best: AppSection | undefined;
        for (const s of [...visible, PERSONAL]) {
            const match = s.path === '/' ? path === '/' : path.toLowerCase().startsWith(s.path.toLowerCase());
            if (match && (!best || s.path.length > best.path.length)) best = s;
        }
        return best?.id;
    }, [location.pathname, visible]);

    const overflowActive = overflow.some(s => s.id === activeId);

    const go = (section: AppSection) => {
        navigate(section.path);
        setMoreOpen(false);
    };

    return (
        <>
            <nav
                className="fixed inset-x-0 bottom-0 z-50 lg:hidden border-t border-slate-200/70 dark:border-white/10 bg-white/75 dark:bg-slate-950/75 backdrop-blur-xl"
                style={{
                    height: `calc(${BOTTOM_NAV_HEIGHT}px + env(safe-area-inset-bottom))`,
                    paddingBottom: 'env(safe-area-inset-bottom)',
                }}
            >
                <div className="flex items-stretch h-full px-1">
                    {primary.map(s => (
                        <NavButton key={s.id} section={s} active={activeId === s.id} onClick={() => go(s)} />
                    ))}

                    {overflow.length > 0 && (
                        <NavButton
                            section={{ id: 'more', label: 'Más', icon: ICONS.menu, path: '#' }}
                            active={overflowActive}
                            onClick={() => setMoreOpen(true)}
                        />
                    )}
                </div>
            </nav>

            <BottomSheet
                open={moreOpen}
                onClose={() => setMoreOpen(false)}
                title="Más"
                snaps={['peek', 'half']}
                initialSnap="peek"
            >
                <div className="grid grid-cols-3 gap-3 p-4">
                    {overflow.map(s => {
                        const accent = SECTION_ACCENT[s.id] || '#64748b';
                        const active = activeId === s.id;
                        return (
                            <button
                                key={s.id}
                                onClick={() => go(s)}
                                className="flex flex-col items-center justify-center gap-2 py-4 rounded-2xl border transition-colors active:scale-95"
                                style={{
                                    borderColor: active ? accent : 'transparent',
                                    backgroundColor: `${accent}14`,
                                    color: accent,
                                }}
                            >
                                <Icon svg={s.icon} className="w-6 h-6" />
                                <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200">{s.label}</span>
                            </button>
                        );
                    })}
                </div>
            </BottomSheet>
        </>
    );
};

export default FloatingBottomNav;
