import React from 'react';

export const Alert: React.FC<{ variant?: 'default' | 'destructive', title: string, description: string, className?: string }> = ({ variant = 'default', title, description, className = '' }) => {
    const colors = {
        default: 'bg-background border-border text-foreground',
        destructive: 'bg-destructive/10 border-destructive text-destructive'
    }
    return (
        <div className={`relative w-full rounded-lg border px-4 py-3 text-sm ${colors[variant]} ${className}`} role="alert">
            <span className="font-medium">{title}</span>
            <div className="text-sm">{description}</div>
        </div>
    );
};
