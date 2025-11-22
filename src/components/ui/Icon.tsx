import React from 'react';

export const Icon: React.FC<{ svg: string, className?: string }> = ({ svg, className = 'w-6 h-6' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} dangerouslySetInnerHTML={{ __html: svg }} />
);
