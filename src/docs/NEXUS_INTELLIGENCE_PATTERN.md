# Nexus Intelligence Pattern

**Status:** REUSABLE PATTERN
**Date:** 2025-12-25
**Scope:** Global

## 1. Core Engines
The intelligence of Nexus is divided into 4 standardized capabilities (The Ladder):

### 1.1. Signal Engine (L1 - Passive)
-   **Goal:** Flag anomalies without analysis.
-   **Input:** Raw Entity + Rules.
-   **Output:** `Signal[]` (Severity: Info, Warning, Critical).
-   **UX:** Small badges, flags, or icons. No text unless hovered.

### 1.2. Assisted Engine (L2 - Contextual)
-   **Goal:** Provide context and "Why".
-   **Input:** Signals + Entity Context.
-   **Output:** `AssistedInsight[]` (Savings, Risk, Opportunity).
-   **UX:** Inline cards or tooltips. Purely informational.

### 1.3. Active Engine (L3 - Suggestions)
-   **Goal:** Propose specific changes.
-   **Input:** Insights + User Profile.
-   **Output:** `ActiveSuggestion[]` (Actionable Payload).
-   **UX:** Cards with "Actions". Requires Click to Preview.

### 1.4. Learning Engine (L4 - Adaptive)
-   **Goal:** Tune the noise.
-   **Input:** User Interactions (Views, Dismissals).
-   **Output:** `UserIntelProfile` (Adjusted Thresholds).
-   **UX:** Preferences Panel + Feedback Loops.

## 2. Selector & Memoization
Intelligence is expensive. NEVER calculate it on every render.
-   **Pattern:** Use `useMemo` or `reselect` for all Engine outputs.
-   **Keys:** Onlyre-calculate if critical data (`ingredient.price`, `stock.quantity`) changes.

## 3. Thresholds & Gating
Intelligence must earn the right to be seen.
-   **Confidence Score (0-100%):** Every suggestion has a score.
-   **The Gate:** If `Score < Profile.minConfidence`, the suggestion is HIDDEN.
-   **The Cap:** Max 2 suggestions per view to avoid cognitive overload.

## 4. Guardrails (Safety First)
Rules that CANNOT be broken, even by AI.
-   **No Auto-Write:** Zero database writes without user initiation.
-   **Preview Mandatory:** Must show `Before` -> `After` state.
-   **Impact Check:** If impact is > 10% of total cost, require "Double Confirmation".

## 5. Learning Transparency
Users must trust the "Brain".
-   **Changelog:** All automated adjustments (e.g., "Snoozed 'Price Alerts' for Tomato") must be visible.
-   **Reversibility:** Users can "Reset" their profile or "Undo" a learning event.
