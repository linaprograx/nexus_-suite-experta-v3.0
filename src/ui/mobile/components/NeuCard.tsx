import React, { HTMLAttributes } from 'react';
import { motion } from 'framer-motion';

interface Props extends HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    variant?: 'flat' | 'pressed';
    animated?: boolean;
    delay?: number;
}

const NeuCard: React.FC<Props> = ({ children, className = "", variant = 'flat', animated = true, delay = 0, onClick, ...props }) => {

    const baseClass = variant === 'pressed' ? 'neu-pressed' : 'neu-flat';

    const variants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.4,
                ease: "easeOut",
                delay: delay
            }
        }
    };

    return (
        <motion.div
            className={`${baseClass} ${className}`}
            initial={animated ? "hidden" : undefined}
            animate={animated ? "visible" : undefined}
            variants={variants}
            whileTap={onClick ? { scale: 0.98 } : undefined}
            onClick={onClick}
            {...props as any}
        >
            {children}
        </motion.div>
    );
};

export default NeuCard;
