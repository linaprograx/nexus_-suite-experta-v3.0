# Nexus Module Replication Guide

**Status:** OPERATIONAL GUIDE
**Date:** 2025-12-25
**Target:** Batcher, Stock, Menu, Pizarrón

## 1. Prerequisites
Before replicating the Grimorio Pattern, ensure the module:
-   Has a clear "Shell" (Main view container).
-   Has a defined "Item" (e.g., Batch, StockEntry, Ticket).
-   Requires Logic/Calculation (Passive views don't need this pattern).

## 2. What to Replatform (Copy & Adapt)
-   **Engines:** Import `evaluateCostSignals`, `generateActiveSuggestions` directly. Do NOT rewrite them.
-   **Context:** Create a module-specific context (e.g., `BatchContext`) mirroring `ItemContext` structure (Active/ViewMode).
-   **UX:** Use `AssistedInsightsInline` and `ActiveSuggestionCard`. They are generic.

## 3. What NOT to Copy
-   **Business Rules:** `signal.rules.*` are specific. Create `signal.rules.batcher.ts` if needed, but extend the Type, don't break it.

## 4. Adaptation Steps
1.  **Define the Item:** What is the atomic unit? (e.g., a Production Batch).
2.  **Define the Signals:** What defines a "Bad" batch? (Low yield, slow time).
3.  **Define the Actions:** What can I do? (Adjust dilution, Change bottle type).
4.  **Wire the Engines:** Connect Item -> Signals -> Actions using the Standard Pattern.

## 5. Checklist
-   [ ] Does it use the standard `Icon` set?
-   [ ] Is navigation state persisted in `sessionStorage`?
-   [ ] Are actions gated by `UserIntelProfile`?
-   [ ] Is there an Undo button?

## 6. Anti-Patterns (Red Flags)
-   **"Smart Page":** A page that calculates logic inside the Component body. -> MOVE TO ENGINE.
-   **"Silent Save":** Updating the DB as soon as a slider moves. -> USE CONFIRMATION.
-   **"Hardcoded Thresholds":** `if (cost > 10)`. -> USE PROFILE PREFERENCES.
