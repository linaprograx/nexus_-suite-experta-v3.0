import React, { ReactNode } from 'react';
import { GLASS_TOKENS } from '../../styles/nexusGlass.tokens';

interface GlassModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: ReactNode;
    header?: ReactNode;
    footer?: ReactNode;
}

export const GlassModal: React.FC<GlassModalProps> = ({ isOpen, onClose, children, header, footer }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div
                className="relative z-10 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                style={{
                    background: 'rgba(255, 255, 255, 0.85)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    borderRadius: GLASS_TOKENS.radius.lg,
                    border: '1px solid rgba(255, 255, 255, 0.8)',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.1)'
                }}
            >
                {header && (
                    <div className="p-4 border-b border-white/40">
                        {header}
                    </div>
                )}
                <div className="p-6">
                    {children}
                </div>
                {footer && (
                    <div className="p-4 bg-white/30 border-t border-white/40">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};
