import React from 'react';
import { Modal } from '../../../components/ui/Modal';
import PremiumButton from './PremiumButton';

interface CerebrityResponseModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message?: string;
    type?: 'success' | 'error' | 'info' | 'ai';
    children?: React.ReactNode;
    buttonText?: string;
}

export const CerebrityResponseModal: React.FC<CerebrityResponseModalProps> = ({
    isOpen,
    onClose,
    title,
    message,
    type = 'info',
    children,
    buttonText = 'ENTENDIDO'
}) => {
    const getTypeStyles = () => {
        switch (type) {
            case 'success': return { icon: 'check_circle', color: '#10b981', bg: 'from-emerald-50' };
            case 'error': return { icon: 'error', color: '#ef4444', bg: 'from-rose-50' };
            case 'ai': return { icon: 'psychology', color: '#8b5cf6', bg: 'from-violet-50' };
            default: return { icon: 'info', color: '#0ea5e9', bg: 'from-sky-50' };
        }
    };

    const styles = getTypeStyles();

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined fill-1" style={{ color: styles.color }}>
                        {styles.icon}
                    </span>
                    <span className="text-zinc-900 font-black uppercase tracking-tighter text-sm">
                        {title}
                    </span>
                </div>
            }
        >
            <div className={`p-1 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300`}>
                <div className={`p-5 rounded-3xl bg-gradient-to-br ${styles.bg} to-white border border-white/50 shadow-inner`}>
                    {message && (
                        <p className="text-sm font-medium text-zinc-700 leading-relaxed whitespace-pre-wrap">
                            {message}
                        </p>
                    )}
                    {children}
                </div>

                <PremiumButton
                    variant="gradient"
                    customColor={styles.color}
                    fullWidth
                    onClick={onClose}
                    size="lg"
                >
                    {buttonText}
                </PremiumButton>
            </div>
        </Modal>
    );
};
