
import { UserIntelProfile } from './learning.types';

export interface LearningAuditLog {
    id: string;
    timestamp: number;
    trigger: string;
    change: string;
    before: any;
    after: any;
    revertible: boolean;
}

export const logLearningAdjustment = (trigger: string, changeDescription: string, before: any, after: any) => {
    const log: LearningAuditLog = {
        id: `LOG_${Date.now()}`,
        timestamp: Date.now(),
        trigger,
        change: changeDescription,
        before,
        after,
        revertible: true
    };
    console.log('[LEARNING AUDIT]', log);
    // In real app, persist to DB collection 'learning_audit'
    return log;
};
