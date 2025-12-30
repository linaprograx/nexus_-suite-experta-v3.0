# Grimorio Reference Architecture

**Status:** LOCKED REFERENCE (Phase 5.5)
**Date:** 2025-12-25
**Scope:** Core Financial-Operational Module

## 1. Role in Nexus
Grimorio is the **Master Financial Core** of the Nexus Suite. It is responsible for the single source of truth regarding Ingredients, Recipes, Costs, and Market Relationships.
- **Authority:** It owns the `ingredients` and `recipes` collections.
- **Dependency:** All other modules (Batcher, Stock, Menu) consume Grimorio's definitions.
- **UX Goal:** Make cost control addictive, transparent, and intelligent.

## 2. Conceptual Architecture

### 2.1. The "Shell" Concept
Grimorio is not a collection of pages, but a **Single Tool Shell**.
-   `GrimoriumShell.tsx`: The immutable container.
-   **Toolbar:** Persistent top bar for Global Search and Filters.
-   **Sidebar:** Navigation between Layers (not Pages).
-   **Main Stage:** The workspace where the user interacts with Items.

### 2.2. Data Context (`ItemContext`)
Navigation logic is **State, not Routing**.
-   `ItemContext.tsx`: Holds `activeItem`, `viewMode`, and `activeLayer`.
-   **Persistence:** Uses `sessionStorage` to maintain state across module switches.
-   **Selection:** Clicking an item in the Sidebar sets it strictly as the `activeItem` in the Context. There are no URL parameters for item selection (to maintain tool-like feel).

### 2.3. The Layer Model
Grimorio avoids "Tabs" in the traditional sense. It uses **Functional Layers** applied to the Active Item.
-   **Composition:** The structure of the recipe (Ingredients).
-   **Cost:** The financial breakdown (Escandallo).
-   **Optimization:** Zero Waste and efficiency analysis.

## 3. Data Flow
The flow of value through Grimorio is unidirectional and hierarchical:
1.  **Market (Input)**: Raw `Ingredient` data (price, unit, supplier).
2.  **Stock (Reality)**: The `StockItem` operational reality (what you actually have).
3.  **Cost (Derived)**: The `Recipe` cost, derived from *Stock* (Real Cost) or *Market* (Theoretical Cost).

```mermaid
graph LR
    Market[Market / Vendor] -->|Price & Unit| Stock[Stock / Inventory]
    Stock -->|Avg Cost & Yield| Recipe[Recipe / Escandallo]
    Recipe -->|Margins| Menu[Menu / Sales]
```

## 4. Intelligence Ladder
Grimorio implements the Nexus Intelligence Pattern (see `NEXUS_INTELLIGENCE_PATTERN.md`):
1.  **Passive**: Signals (Flags, Alerts) that do not interrupt.
2.  **Assisted**: Insights (Savings, Risks) visible in context.
3.  **Active**: Suggestions (Switch Provider, Adjust Price) that require Opt-in.
4.  **Adaptive**: Learning profile (UserIntelProfile) that tunes noise levels.

## 5. UX Rules
-   **No Pages**: Everything happens inside the Shell.
-   **Context is King**: Always show *why* a number is red (Tooltips/Explainers).
-   **Fluidity**: Transitions between layers must be instant (<100ms).
-   **Standard Layout**: Left (List/Nav) -> Center (Workspace) -> Right (Detail/Action).

## 6. Trust Principles
-   **Opt-in Only**: The system NEVER executes a write operation without user click.
-   **Undo Always**: Every executed action provides an immediate Undo.
-   **Audit Trail**: Every automated suggestion and execution is logged.

## 7. What Grimorio DOES NOT do
-   It does **NOT** manage physical inventory counts (That is Stock Module).
-   It does **NOT** simple Point of Sale (That is Menu/Ticket Module).
-   It does **NOT** predict future sales (That is Cerebrity Module).
