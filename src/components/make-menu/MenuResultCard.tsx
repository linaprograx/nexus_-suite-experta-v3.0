import React from 'react';
import { addDoc, collection, serverTimestamp, Firestore } from 'firebase/firestore';
import { MenuLayout } from '../../types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/Card';
import { Button } from '../ui/Button';
import { MenuDesignRendererCore } from '../shared/MenuDesignRendererCore';
import { usePizarronData } from '../../hooks/usePizarronData';

interface MenuResultCardProps {
    item: MenuLayout;
    db: Firestore;
    userId: string;
    appId: string;
}

export const MenuResultCard: React.FC<MenuResultCardProps> = ({ item, db, appId }) => {
    const { activeBoardId } = usePizarronData();
    const [saved, setSaved] = React.useState(false);
    const [saving, setSaving] = React.useState(false);

    const handleSaveToPizarron = async () => {
        setSaving(true);
        try {
            // Proper Pizarrón card shape: the board reader needs title/texto + type +
            // position; htmlContent/suggestedTypography let it render the actual design.
            await addDoc(collection(db, `artifacts/${appId}/public/data/pizarron-tasks`), {
                type: 'card',
                title: `🍸 Menú · ${item.themeName}`,
                texto: `🍸 Menú · ${item.themeName}`,
                body: item.description,
                htmlContent: item.htmlContent,
                suggestedTypography: item.suggestedTypography,
                position: { x: 80 + Math.round(Math.random() * 200), y: 80 + Math.round(Math.random() * 160) },
                width: 320,
                height: 420,
                zIndex: 1,
                boardId: activeBoardId,
                style: { backgroundColor: '#fff7ed' },
                createdAt: serverTimestamp(),
                updatedAt: Date.now(),
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 2500);
        } catch (e) {
            console.error('Error guardando menú en Pizarrón:', e);
        } finally {
            setSaving(false);
        }
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
                <Button onClick={handleSaveToPizarron} disabled={saving || saved}>
                    {saved ? '✓ Guardado en Pizarrón' : saving ? 'Guardando…' : 'Guardar en Pizarrón'}
                </Button>
            </CardFooter>
        </Card>
    );
};
