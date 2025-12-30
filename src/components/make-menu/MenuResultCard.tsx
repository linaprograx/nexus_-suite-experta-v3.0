import React from 'react';
import { Firestore, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { MenuLayout } from '../../types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/Card';
import { Button } from '../ui/Button';
import { MenuDesignRendererCore } from '../shared/MenuDesignRendererCore';

interface MenuResultCardProps {
    item: MenuLayout;
    db: Firestore;
    userId: string;
    appId: string;
}

export const MenuResultCard: React.FC<MenuResultCardProps> = ({ item, db, userId, appId }) => {
    const handleSaveToPizarron = async () => {
        const taskContent = `[Diseño Menú] Adaptar el concepto '${item.themeName}'. Descripción: ${item.description}`.substring(0, 500);
        await addDoc(collection(db, `artifacts/${appId}/public/data/pizarron-tasks`), {
            content: taskContent,
            status: 'ideas',
            category: 'Marketing',
            createdAt: serverTimestamp(),
            boardId: 'general'
        });
        alert("Concepto de menú guardado en Pizarrón.");
    };

    return (
        <Card className="h-full flex flex-col">
            <CardHeader>
                <CardTitle>{item.themeName}</CardTitle>
                <CardDescription>{item.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto border-t border-b p-4 bg-secondary/30">
                <MenuDesignRendererCore
                    themeName={item.themeName}
                    description={item.description}
                    suggestedTypography={item.suggestedTypography}
                    htmlContent={item.htmlContent}
                />
            </CardContent>
            <CardFooter>
                <Button onClick={handleSaveToPizarron}>Guardar en Pizarrón</Button>
            </CardFooter>
        </Card>
    );
};
