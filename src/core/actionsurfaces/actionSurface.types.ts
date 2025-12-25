
export type ActionScope = 'market' | 'cost' | 'stock' | 'recipe';
export type ActionType = 'informational' | 'navigational_stub';

export interface ActionSurface {
    id: string;
    label: string;
    description?: string;
    scope: ActionScope;
    anchor?: string;
    actionType: ActionType;
    /**
     * Target would be used for real navigation in Phase 3.
     * For now it's just metadata.
     */
    target?: {
        view?: string;
        entityId?: string;
    };
}
