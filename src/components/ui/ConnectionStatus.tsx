import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from './Icon';
import { ICONS } from './icons';

/**
 * ConnectionStatus Component
 * 
 * Displays a subtle indicator when the app is offline
 * and shows a success message when connection is restored
 */

export const ConnectionStatus: React.FC = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [showReconnected, setShowReconnected] = useState(false);
    const [wasOffline, setWasOffline] = useState(false);

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            if (wasOffline) {
                setShowReconnected(true);
                setTimeout(() => setShowReconnected(false), 3000);
                setWasOffline(false);
            }
        };

        const handleOffline = () => {
            setIsOnline(false);
            setWasOffline(true);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [wasOffline]);

    return (
        <>
            {/* Offline Indicator */}
            <AnimatePresence>
                {!isOnline && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999]"
                    >
                        <div className="
              flex items-center gap-2 px-4 py-2 rounded-full
              bg-amber-500/90 dark:bg-amber-600/90
              backdrop-blur-sm
              text-white text-sm font-medium
              shadow-lg
            ">
                            <Icon icon={ICONS.WIFI_OFF} className="w-4 h-4" />
                            <span>Sin conexión - Trabajando offline</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Reconnected Success Message */}
            <AnimatePresence>
                {showReconnected && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999]"
                    >
                        <div className="
              flex items-center gap-2 px-4 py-2 rounded-full
              bg-emerald-500/90 dark:bg-emerald-600/90
              backdrop-blur-sm
              text-white text-sm font-medium
              shadow-lg
            ">
                            <Icon icon={ICONS.CHECK_CIRCLE} className="w-4 h-4" />
                            <span>Conexión restaurada - Sincronizando...</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};
