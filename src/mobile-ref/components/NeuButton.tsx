
import React, { ButtonHTMLAttributes } from 'react';
import { motion } from 'framer-motion';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
    variant?: 'flat' | 'pressed' | 'primary' | 'ghost'; // 'flat' is standard convex, 'pressed' is concave
}

const NeuButton: React.FC<Props> = ({ children, className = "", variant = 'flat', onClick, ...props }) => {

    // Base classes mapped to our CSS utility classes
    let baseClass = "neu-btn"; // default
    if (variant === 'pressed') baseClass = "neu-pressed";
    if (variant === 'ghost') baseClass = "bg-transparent text-neu-sec hover:text-neu-main";

    // Framer Motion variants
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
            {...props as any} // Cast to any to avoid conflict with motion props and HTML button props
        >
            {children}
        </motion.button>
    );
};

export default NeuButton;
