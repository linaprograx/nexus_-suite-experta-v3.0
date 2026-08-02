import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './Card';
import { Button } from './Button';
import { Icon } from './Icon';
import { ICONS } from './icons';

import ReactDOM from 'react-dom';

export const Modal: React.FC<{ isOpen: boolean, onClose: () => void, title?: React.ReactNode, children: React.ReactNode, className?: string, size?: 'default' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' }> = ({ isOpen, onClose, title, children, className, size = 'default' }) => {
    if (!isOpen) return null;
    const sizes = {
        default: 'max-w-lg',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        '2xl': 'max-w-2xl',
        '3xl': 'max-w-3xl',
        '4xl': 'max-w-4xl',
    };

    return ReactDOM.createPortal(
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-md"
            onClick={onClose}
            // Promote the backdrop to its own compositing layer so Safari doesn't
            // drop/repaint the backdrop-filter while the child card animates.
            style={{
                WebkitBackdropFilter: 'blur(12px)',
                backdropFilter: 'blur(12px)',
                transform: 'translateZ(0)',
                isolation: 'isolate',
            }}
        >
            <div
                className={`relative w-full ${sizes[size]} ${className} animate-in fade-in duration-200`}
                onClick={e => e.stopPropagation()}
            >
                <Card className="m-4 border-white/20 dark:border-white/10 shadow-premium bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl">
                    <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                        {title && <CardTitle className="text-lg font-semibold text-slate-800 dark:text-slate-100">{title}</CardTitle>}
                        <Button variant="ghost" size="icon" onClick={onClose} className="ml-auto h-8 w-8 text-slate-400 hover:text-slate-600"><Icon svg={ICONS.x} /></Button>
                    </CardHeader>
                    <CardContent className="pt-4">
                        {children}
                    </CardContent>
                </Card>
            </div>
        </div>,
        document.body
    );
};
