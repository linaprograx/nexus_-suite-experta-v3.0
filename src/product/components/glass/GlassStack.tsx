import React, { ReactNode } from 'react';

interface GlassStackProps {
    children: ReactNode;
    className?: string;
    gap?: 'sm' | 'md' | 'lg';
    scrollable?: boolean;
}

const gapMap = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6'
};

export const GlassStack: React.FC<GlassStackProps> = ({ children, className = '', gap = 'md', scrollable = false }) => {
    return (
        <div className={`flex flex-col ${gapMap[gap]} ${scrollable ? 'overflow-y-auto max-h-full' : ''} ${className}`}>
            {children}
        </div>
    );
};
