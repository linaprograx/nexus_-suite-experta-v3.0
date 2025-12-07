import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './Card';
import { Button } from './Button';
import { Icon } from './Icon';
import { ICONS } from './icons';

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
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm" onClick={onClose}>
            <div className={`relative w-full ${sizes[size]} ${className}`} onClick={e => e.stopPropagation()}>
                <Card className="m-4">
                    <CardHeader className="flex flex-row items-center justify-between">
                        {title && <CardTitle className="text-xl">{title}</CardTitle>}
                        <Button variant="ghost" size="icon" onClick={onClose} className="ml-auto"><Icon svg={ICONS.x} /></Button>
                    </CardHeader>
                    <CardContent>
                        {children}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
