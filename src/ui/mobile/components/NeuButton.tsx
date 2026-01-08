import React, { ButtonHTMLAttributes } from 'react';
import { motion } from 'framer-motion';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
    variant?: 'flat' | 'pressed' | 'primary' | 'ghost';
}

const NeuButton: React.FC<Props> = ({ children, className = "", variant = 'flat', onClick, ...props }) => {

    let baseClass = "neu-btn";
    if (variant === 'pressed') baseClass = "neu-pressed";
    if (variant === 'ghost') baseClass = "bg-transparent text-neu-sec hover:text-neu-main";

    const tapAnimation = {
        scale: 0.95,
        transition: { type: "spring", stiffness: 400, damping: 17 }
    };

    return (
        <motion.button
            className={`${baseClass} relative overflow-hidden flex items-center justify-center ${className}`}
            whileTap={tapAnimation}
            whileHover={{ scale: 1.02 }}
            onClick={onClick}
            {...props as any}
        >
            {children}
        </motion.button>
    );
};

export default NeuButton;
