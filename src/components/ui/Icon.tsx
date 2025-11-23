import React from 'react';

export const Icon: React.FC<{ svg: string, className?: string, strokeWidth?: number | string }> = ({ svg, className = 'w-6 h-6', strokeWidth = 2 }) => {
    if (!svg) {
        // Fallback Circle
        return (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
                <circle cx="12" cy="12" r="10" />
            </svg>
        );
    }
    
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} dangerouslySetInnerHTML={{ __html: svg }} />
    );
};
