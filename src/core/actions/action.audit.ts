
import { ExecutableAction } from './action.types';

export interface AuditRecord {
    id: string;
    actionId: string;
    timestamp: number;
    userId: string;
    details: string;
    status: 'success' | 'failed' | 'reverted';
}

export const logActionExecution = (action: ExecutableAction, userId: string = 'system') => {
    const record: AuditRecord = {
        id: `audit_${Date.now()}`,
        actionId: action.id,
        timestamp: Date.now(),
        userId,
        details: `Executed ${action.type}: ${action.title}`,
        status: 'success'
    };
    console.log('[AUDIT] Action Executed:', record);
    // In real app, push to DB log
};
