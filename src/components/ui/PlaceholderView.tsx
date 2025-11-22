import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './Card';
import { Icon } from './Icon';

export const PlaceholderView: React.FC<{title: string, icon?: string}> = ({ title, icon }) => (
    <div className="p-6 lg:p-8">
        <Card>
            <CardHeader className="flex-row items-center gap-4">
                {icon && <Icon svg={icon} className="w-8 h-8 text-primary" />}
                <div>
                    <CardTitle>{title}</CardTitle>
                    <CardDescription>Este módulo está en construcción.</CardDescription>
                </div>
            </CardHeader>
            <CardContent>
                <p>La funcionalidad para el módulo {title} se implementará en una futura iteración del Ecosistema v2.</p>
            </CardContent>
        </Card>
    </div>
);
