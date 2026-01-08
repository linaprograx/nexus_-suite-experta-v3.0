import React from 'react';
import { motion } from 'framer-motion';
import { PAGE_THEMES } from '../types';

interface Props {
    currentPage: string;
}

const Atmosphere: React.FC<Props> = ({ currentPage }) => {
    const theme = PAGE_THEMES[currentPage] || PAGE_THEMES['default'];

    return (
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden rounded-[2.5rem]">
            {/* Primary Gradient Orb */}
            <motion.div
                className="absolute top-[-20%] left-[-20%] w-[140%] h-[80%] rounded-full opacity-30 blur-[100px]"
                animate={{
                    background: theme.gradient,
                    x: [0, 20, 0],
                    y: [0, -20, 0],
                }}
                transition={{
                    background: { duration: 1 },
                    x: { duration: 10, repeat: Infinity, ease: "easeInOut" },
                    y: { duration: 8, repeat: Infinity, ease: "easeInOut" }
                }}
            />

            {/* Secondary Orb */}
            <motion.div
                className="absolute bottom-[-10%] right-[-10%] w-[80%] h-[60%] rounded-full opacity-20 blur-[80px]"
                style={{ background: theme.accent }}
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.1, 0.2, 0.1]
                }}
                transition={{ duration: 5, repeat: Infinity }}
            />
        </div>
    );
};

export default Atmosphere;
