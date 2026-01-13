import { pizarronStore } from '../state/store';

/**
 * KeyboardShortcutsManager
 * Centralized keyboard shortcut handling for Pizarron
 * Implements desktop-level shortcuts (Figma/Miro-style)
 */
export class KeyboardShortcutsManager {
    private isAttached = false;
    private temporaryPanMode = false;

    /**
     * Attach keyboard listeners to window
     */
    attach() {
        if (this.isAttached) return;
        window.addEventListener('keydown', this.handleKeyDown);
        window.addEventListener('keyup', this.handleKeyUp);
        this.isAttached = true;
        console.log('[KeyboardShortcuts] Attached');
    }

    /**
     * Detach keyboard listeners
     */
    detach() {
        if (!this.isAttached) return;
        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('keyup', this.handleKeyUp);
        this.isAttached = false;
        console.log('[KeyboardShortcuts] Detached');
    }

    /**
     * Main keydown handler
     */
    private handleKeyDown = (e: KeyboardEvent) => {
        // Ignore if typing in input/textarea
        if (this.isTyping(e.target)) return;

        const isMod = e.metaKey || e.ctrlKey;
        const isShift = e.shiftKey;

        // --- COPY/PASTE/DUPLICATE ---
        if (isMod && e.key === 'c') {
            e.preventDefault();
            this.handleCopy();
            return;
        }

        if (isMod && e.key === 'v') {
            e.preventDefault();
            this.handlePaste();
            return;
        }

        if (isMod && e.key === 'd') {
            e.preventDefault();
            this.handleDuplicate();
            return;
        }

        // --- SELECTION ---
        if (isMod && e.key === 'a') {
            e.preventDefault();
            this.handleSelectAll();
            return;
        }

        // --- GROUPING ---
        if (isMod && e.key === 'g') {
            e.preventDefault();
            if (isShift) {
                this.handleUngroup();
            } else {
                this.handleGroup();
            }
            return;
        }

        // --- UNDO/REDO ---
        if (isMod && e.key === 'z') {
            e.preventDefault();
            if (isShift) {
                this.handleRedo();
            } else {
                this.handleUndo();
            }
            return;
        }

        // Ctrl+Y for Redo (Windows standard)
        if (isMod && e.key === 'y') {
            e.preventDefault();
            this.handleRedo();
            return;
        }

        // --- LAYER ORDERING ---
        if (isMod && e.key === ']') {
            e.preventDefault();
            if (isShift) {
                pizarronStore.bringToFront();
            } else {
                pizarronStore.bringForward();
            }
            return;
        }

        if (isMod && e.key === '[') {
            e.preventDefault();
            if (isShift) {
                pizarronStore.sendToBack();
            } else {
                pizarronStore.sendBackward();
            }
            return;
        }

        // --- ZOOM ---
        if (isMod && (e.key === '+' || e.key === '=')) {
            e.preventDefault();
            this.handleZoomIn();
            return;
        }

        if (isMod && (e.key === '-' || e.key === '_')) {
            e.preventDefault();
            this.handleZoomOut();
            return;
        }

        if (isMod && e.key === '0') {
            e.preventDefault();
            this.handleFitView();
            return;
        }

        // --- DELETE ---
        if (e.key === 'Delete' || e.key === 'Backspace') {
            // Only if not editing text
            const state = pizarronStore.getState();
            if (!state.interactionState.editingTextId && !state.interactionState.editingNodeId) {
                e.preventDefault();
                this.handleDelete();
            }
            return;
        }

        // --- ARROW KEYS (NUDGE) ---
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            // Only nudge if something is selected and not editing
            const state = pizarronStore.getState();
            if (state.selection.size > 0 && !state.interactionState.editingTextId) {
                e.preventDefault();
                const direction = {
                    'ArrowUp': 'up',
                    'ArrowDown': 'down',
                    'ArrowLeft': 'left',
                    'ArrowRight': 'right'
                }[e.key] as 'up' | 'down' | 'left' | 'right';
                this.handleNudge(direction, isShift);
            }
            return;
        }

        // --- ESCAPE ---
        if (e.key === 'Escape') {
            e.preventDefault();
            this.handleEscape();
            return;
        }

        // --- SPACEBAR (Pan Mode) ---
        if (e.key === ' ') {
            // Only activate pan if not typing
            const state = pizarronStore.getState();
            if (!state.interactionState.editingTextId && !this.temporaryPanMode) {
                e.preventDefault();
                this.temporaryPanMode = true;
                document.body.style.cursor = 'grab';
                // Update store to reflect pan mode
                pizarronStore.setState(s => {
                    s.interactionState.temporaryPanMode = true;
                });
            }
            return;
        }
    };

    /**
     * Main keyup handler
     */
    private handleKeyUp = (e: KeyboardEvent) => {
        // --- SPACEBAR RELEASE ---
        if (e.key === ' ') {
            if (this.temporaryPanMode) {
                this.temporaryPanMode = false;
                document.body.style.cursor = '';
                pizarronStore.setState(s => {
                    s.interactionState.temporaryPanMode = false;
                });
            }
        }
    };

    /**
     * Check if user is typing in an input field
     */
    private isTyping(target: EventTarget | null): boolean {
        if (!target) return false;
        const el = target as HTMLElement;
        return (
            el instanceof HTMLInputElement ||
            el instanceof HTMLTextAreaElement ||
            el.isContentEditable
        );
    }

    // --- ACTION HANDLERS ---

    private handleCopy() {
        pizarronStore.copySelection();
        console.log('[Shortcuts] Copy');
    }

    private handlePaste() {
        pizarronStore.paste();
        console.log('[Shortcuts] Paste');
    }

    private handleDuplicate() {
        const selected = pizarronStore.getSelectedNodes();
        if (selected.length > 0) {
            pizarronStore.copySelection();
            pizarronStore.paste();
            console.log('[Shortcuts] Duplicate');
        }
    }

    private handleSelectAll() {
        const state = pizarronStore.getState();
        // Select all top-level, non-collapsed nodes
        const allTopLevel = Object.values(state.nodes)
            .filter(n => !n.parentId && !n.collapsed)
            .map(n => n.id);
        pizarronStore.setSelection(allTopLevel);
        console.log('[Shortcuts] Select All:', allTopLevel.length, 'nodes');
    }

    private handleGroup() {
        const state = pizarronStore.getState();
        if (state.selection.size >= 2) {
            pizarronStore.groupSelection();
            console.log('[Shortcuts] Group');
        }
    }

    private handleUngroup() {
        const selected = pizarronStore.getSelectedNodes();
        const hasGroups = selected.some(n => n.type === 'group');
        if (hasGroups) {
            pizarronStore.ungroupSelection();
            console.log('[Shortcuts] Ungroup');
        }
    }

    private handleUndo() {
        pizarronStore.undo();
        console.log('[Shortcuts] Undo');
    }

    private handleRedo() {
        pizarronStore.redo();
        console.log('[Shortcuts] Redo');
    }

    private handleDelete() {
        const state = pizarronStore.getState();
        if (state.selection.size > 0) {
            const ids = Array.from(state.selection);
            pizarronStore.deleteNodes(ids);
            pizarronStore.setSelection([]);
            console.log('[Shortcuts] Delete:', ids.length, 'nodes');
        }
    }

    private handleNudge(direction: 'up' | 'down' | 'left' | 'right', isShift: boolean) {
        const distance = isShift ? 10 : 1; // 10px with Shift, 1px without
        const selected = pizarronStore.getSelectedNodes();

        selected.forEach(node => {
            const delta = {
                up: { x: 0, y: -distance },
                down: { x: 0, y: distance },
                left: { x: -distance, y: 0 },
                right: { x: distance, y: 0 }
            }[direction];

            pizarronStore.updateNode(node.id, {
                x: node.x + delta.x,
                y: node.y + delta.y
            }, true); // saveHistory = true
        });

        console.log('[Shortcuts] Nudge', direction, distance + 'px');
    }

    private handleEscape() {
        const state = pizarronStore.getState();

        // Priority 1: Text editing
        if (state.interactionState.editingTextId) {
            pizarronStore.updateInteractionState({ editingTextId: undefined });
            console.log('[Shortcuts] Escape: Closed text editor');
            return;
        }

        // Priority 2: Node editing (Inspector)
        if (state.interactionState.editingNodeId) {
            pizarronStore.updateInteractionState({
                editingNodeId: undefined,
                editingSubId: undefined
            });
            console.log('[Shortcuts] Escape: Closed node editor');
            return;
        }

        // Priority 3: Modals/Panels
        if (state.uiFlags.showLibrary) {
            pizarronStore.setUIFlag('showLibrary', false);
            console.log('[Shortcuts] Escape: Closed library');
            return;
        }

        if (state.uiFlags.showProjectManager) {
            pizarronStore.setUIFlag('showProjectManager', false);
            console.log('[Shortcuts] Escape: Closed project manager');
            return;
        }

        if (state.uiFlags.showOverview) {
            pizarronStore.setState(s => { s.uiFlags.showOverview = false });
            console.log('[Shortcuts] Escape: Closed overview');
            return;
        }

        if (state.uiFlags.grimorioPickerOpen) {
            pizarronStore.setUIFlag('grimorioPickerOpen', null);
            console.log('[Shortcuts] Escape: Closed grimorio picker');
            return;
        }

        if (state.uiFlags.showMenuGenerator) {
            pizarronStore.setUIFlag('showMenuGenerator', false);
            console.log('[Shortcuts] Escape: Closed menu generator');
            return;
        }

        // Priority 4: Creation draft
        if (state.interactionState.creationDraft) {
            pizarronStore.updateInteractionState({ creationDraft: undefined });
            console.log('[Shortcuts] Escape: Cancelled creation');
            return;
        }

        // Priority 5: Selection
        if (state.selection.size > 0) {
            pizarronStore.clearSelection();
            console.log('[Shortcuts] Escape: Cleared selection');
            return;
        }

        console.log('[Shortcuts] Escape: Nothing to cancel');
    }

    private handleZoomIn() {
        const state = pizarronStore.getState();
        const newZoom = Math.min(state.viewport.zoom + 0.1, 5);
        pizarronStore.updateViewport({ zoom: newZoom });
        console.log('[Shortcuts] Zoom In:', Math.round(newZoom * 100) + '%');
    }

    private handleZoomOut() {
        const state = pizarronStore.getState();
        const newZoom = Math.max(state.viewport.zoom - 0.1, 0.1);
        pizarronStore.updateViewport({ zoom: newZoom });
        console.log('[Shortcuts] Zoom Out:', Math.round(newZoom * 100) + '%');
    }

    private handleFitView() {
        pizarronStore.fitContent();
        console.log('[Shortcuts] Fit View');
    }
}
