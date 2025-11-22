import React from 'react';
import { Card } from '../ui/Card';

interface StatCardProps {
    title: string;
    value: string | number;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value }) => (
    <Card className="text-center p-4">
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm text-muted-foreground">{title}</p>
    </Card>
);
