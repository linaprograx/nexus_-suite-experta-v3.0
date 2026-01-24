---
name: Migrator Style Mobile-Desktop
description: Specialized skill for migrating legacy desktop UIs to the vibrant, mobile-first "Cerebrity Style". Defines strict rules for gradients, color synchronization, navigation, and typography.
---

# Migrator Style: Mobile-Desktop

This skill embodies the "Cerebrity Visual Identity" refactor logic. Use it to transform any functional/legacy interface into a **Premium Mobile-First Experience** on Desktop.

## Core Philosophy: "Vibrant minimalism"
Every screen must feel alive (Vibrancy) but readable (Minimalism). We achieve this through aggressive color synchronization and specific gradient physics.

## The 5 Pillars of Style (Strict Rules)

### 1. The "Fade-Out" Gradient Rule
Backgrounds are NEVER flat colors. They are "Atmospheric Drapes".
- **Concept:** Color starts strong at top, fades to nothing at 40% height.
- **Code Pattern:**
  ```tsx
  // BAD (Too long, or opaque bottom)
  background: 'linear-gradient(180deg, #FF00CC 0%, #a21caf 100%)'

  // GOOD (The "Cerebrity Standard")
  <div
    className="absolute inset-0 pointer-events-none transition-all duration-700 ease-in-out rounded-3xl z-0"
    style={{
      background: activeTab === 'sectionKey'
        ? 'linear-gradient(180deg, #HEXCODE 0%, rgba(R,G,B, 0.4) 30%, rgba(R,G,B, 0) 45%)'
        : '...' // Fallback
    }}
  />
  ```
- **Crucial:** Use `rgba(..., 0)` at 40-45% to ensure the bottom of the screen is white/clean for readability.

### 2. Radical Color Synchronization (Monochromatic Zones)
If a section is "Green", EVERYTHING interactive is Green.
- **Header:** Gradient starts Green (#84CC16).
- **Navigation:** Active Tab Text/Icon is Green.
- **Primary CTA:** Button Gradient is Green.
- **Charts/Accents:** Use tints of Green.

**Approved Color Palette (The "Moods"):**
- **Synthesis (Creation):** Neon Pink (`#FF00CC`) -> `rgba(255, 0, 204, 0)`
- **Make Menu (Action):** Lime Green (`#84CC16`) -> `rgba(132, 204, 22, 0)`
- **Critic (Review):** Cyan (`#06b6d4`) -> `rgba(6, 182, 212, 0)`
- **The Lab (Science):** Electric Purple (`#8b5cf6`) -> `rgba(139, 92, 246, 0)`
- **Trends (Discovery):** Amber (`#F59E0B`) -> `rgba(245, 158, 11, 0)`

### 3. "Sleek Pill" Navigation
Navigation buttons are capsules, not rectangles.
- **Common Classes:** `relative px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all duration-300`
- **Inactive State:** `bg-white/10 text-white hover:bg-white/20 border border-white/10`
- **Active State:** `bg-white shadow-xl scale-105`
  - **IMPORTANT:** Apply color via `style={{ color: '#HEX' }}` to the button or `inherit` on the icon. NEVER use `text-white` on active state.
- **Layout Safety:** The container MUST have ample padding (e.g., `p-4`) to prevent the `scale-105` active item from being clipped by `overflow-hidden`.

### 4. Impact Typography (Serif Headers)
Headers must command attention.
- **Font Stack:** `fontFamily: 'Georgia, serif'` (or similar high-quality Serif).
- **Style:** `font-black italic tracking-tighter leading-[0.8] mb-1 drop-shadow-xl`.
- **Size:** `text-7xl` or larger.
- **Effect:** Text Shadow `0 4px 30px rgba(0,0,0,0.3)`.

### 5. Glassmorphism & Depth
Inner content sits on "Glass Sheets".
- **Container:** `backdrop-blur-xl bg-white/40 dark:bg-slate-900/40 border border-white/20 shadow-lg rounded-2xl`.
- **Z-Index:** Always explicit. Background `z-0`, Header `z-10`, Content `z-20`.

## Migration Checklist
When tasked to "Migrate to Cerebrity Style":
1.  [ ] **Identify the Mood:** Pick one dominant color from the Palette.
2.  [ ] **Install the Gradient:** Add the absolute positioned background div with the 45% fade.
3.  [ ] **Refactor Header:** Apply Serif font and huge size.
4.  [ ] **Refactor Nav:** Convert tabs to "Sleek Pills". Ensure padding prevents clipping.
5.  [ ] **Sync Inner UI:** Find the primary Action Button and `Card` headers in sub-components. Force them to match the Mood Color.
