/**
 * NEXUS GLASS NARRATIVE TOKENS
 * ----------------------------
 * Source of Truth: nexus_glass_narrative_system.md
 * Identity: Silent Expert Copilot
 * Principles: Clarity, Precision, Context-only.
 */

export const MSG_LAYER = {
    STATUS: {
        SAVED: 'Saved',
        PENDING: 'Pending',
        SYNCED: 'Synced',
        EMPTY: 'No items',
    },
    CONTEXT: {
        // Prefix for context explanations
        BECAUSE_RECENT: 'Based on recent activity',
        BECAUSE_POLICY: 'Required by policy',
        MISSING_INPUT: 'Input required to proceed',
    },
    GUIDE: {
        SELECT_ITEM: 'Select an item',
        VERIFY_INPUTS: 'Review inputs',
        CONFIRM_ACTION: 'Confirm action',
    },
} as const;

export const SYS_STATE = {
    NEUTRAL: (fact: string) => `${fact}`,
    SUCCESS: (action: string, result: string) => `${action} ${result}`, // e.g., "Export complete"
    WARNING: (impact: string, cause: string) => `${impact}. ${cause}`, // e.g. "Sync paused. Network down."
    ERROR: (problem: string, fix: string) => `${problem}. ${fix}`, // e.g. "Failed. Retry."
} as const;

export const LABEL = {
    MEMBER_SINCE: 'Member since',
    ROLE: 'Role',
    STATUS: 'Status',
    LEVEL: 'Level',
    XP: 'XP',
} as const;

export const BTN_TEXT = {
    SAVE: 'Save',
    CANCEL: 'Cancel',
    DELETE: 'Delete',
    CONFIRM: 'Confirm',
    NEXT: 'Next',
    BACK: 'Back',
    RETRY: 'Retry',
    VIEW_PROFILE: 'View Profile',
    VALIDATE_MEMBERSHIP: 'Validate Membership',
    // Prohibiting "Let's go", "Start journey", etc.
} as const;

export const NARRATIVE_UTILS = {
    /**
     * Enforces "Active + Benefit" structure where possible, keeping it short.
     */
    actionLabel: (verb: string, object?: string) => object ? `${verb} ${object}` : verb,

    /**
     * Formats a system message preventing emoji overload and marketing fluff.
     */
    systemMessage: (text: string) => text.replace(/[!]/g, ''), // Strip exclamation marks to keep "Calm" tone
};
