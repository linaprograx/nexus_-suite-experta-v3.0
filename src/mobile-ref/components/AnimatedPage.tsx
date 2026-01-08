
import React, { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
    children: ReactNode;
    className?: string;
}

const pageVariants = {
    initial: { opacity: 0, y: 10, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, scale: 0.98, transition: { duration: 0.15 } }
};

const AnimatedPage: React.FC<Props> = ({ children, className = "" }) => {
    return (
        <motion.div
            className={`flex-1 flex flex-col h-full ${className}`}
            initial="initial"
            animate="animate"
            exit="exit"
            variants={pageVariants}
            transition={{ duration: 0.3, ease: "easeOut" }}
        >
            {children}
        </motion.div>
    );
};

export default AnimatedPage;
