import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from './Icon';
import { ICONS } from './icons';

export interface ToastProps {
    message: string;
    type?: 'success' | 'error' | 'info';
    isVisible: boolean;
    onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'success', isVisible, onClose }) => {
    const [show, setShow] = useState(false);

    useEffect(() => {
        if (isVisible) {
            setShow(true);
            const timer = setTimeout(() => {
                setShow(false);
                setTimeout(onClose, 300); // Wait for exit animation
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [isVisible, onClose]);

    if (!isVisible && !show) return null;

    const getTypeStyles = () => {
        switch (type) {
            case 'success':
                return 'bg-emerald-50/90 dark:bg-emerald-900/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-100 shadow-emerald-500/10';
            case 'error':
                return 'bg-red-50/90 dark:bg-red-900/40 border-red-200 dark:border-red-800 text-red-800 dark:text-red-100 shadow-red-500/10';
            case 'info':
            default:
                return 'bg-indigo-50/90 dark:bg-indigo-900/40 border-indigo-200 dark:border-indigo-800 text-indigo-800 dark:text-indigo-100 shadow-indigo-500/10';
        }
    };

    const getIcon = () => {
        switch (type) {
            case 'success': return <Icon svg={ICONS.check} className="w-5 h-5 text-emerald-500" />;
            case 'error': return <Icon svg={ICONS.alertTriangle} className="w-5 h-5 text-red-500" />;
            case 'info': return <Icon svg={ICONS.info} className="w-5 h-5 text-indigo-500" />;
        }
    };

    return createPortal(
        <div className={`fixed top-24 right-6 z-[100] transition-all duration-500 transform ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0 pointer-events-none'}`}>
            <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-xl backdrop-blur-xl ${getTypeStyles()} min-w-[300px]`}>
                <div className="p-1.5 bg-white/50 dark:bg-black/20 rounded-full">
                    {getIcon()}
                </div>
                <div className="flex-1">
                    <p className="text-sm font-semibold">{message}</p>
                </div>
                <button onClick={onClose} className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors">
                    <Icon svg={ICONS.x} className="w-4 h-4 opacity-60" />
                </button>
            </div>
        </div>,
        document.body
    );
};
