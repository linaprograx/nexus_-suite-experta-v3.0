import * as React from 'react';

const Card: React.FC<{ children: React.ReactNode } & React.HTMLAttributes<HTMLDivElement>> = ({ children, className, ...props }) => <div className={`rounded-xl border bg-card text-card-foreground shadow ${className}`} {...props}>{children}</div>;
const CardHeader: React.FC<{children: React.ReactNode, className?: string}> = ({ children, className }) => <div className={`flex flex-col space-y-1.5 p-6 ${className}`}>{children}</div>;
const CardTitle: React.FC<{children: React.ReactNode, className?: string}> = ({ children, className }) => <h3 className={`font-semibold leading-none tracking-tight ${className}`}>{children}</h3>;
const CardDescription: React.FC<{children: React.ReactNode, className?: string}> = ({ children, className }) => <p className={`text-sm text-muted-foreground ${className}`}>{children}</p>;
const CardContent: React.FC<{children: React.ReactNode, className?: string}> = ({ children, className }) => <div className={`p-6 pt-0 ${className}`}>{children}</div>;
const CardFooter: React.FC<{children: React.ReactNode, className?: string}> = ({ children, className }) => <div className={`flex items-center p-6 pt-0 ${className}`}>{children}</div>;

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
