import React from 'react';

export const Label: React.FC<{children: React.ReactNode, htmlFor?: string, className?: string}> = ({ children, htmlFor, className }) => <label htmlFor={htmlFor} className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`}>{children}</label>;
