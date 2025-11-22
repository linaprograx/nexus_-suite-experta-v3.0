import React from 'react';
import { Firestore, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { ZeroWasteResult } from '../../../types';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/Card';
import { Button } from '../ui/Button';
import { ICONS } from '../ui/icons';
import { Icon } from '../ui/Icon';

interface ZeroWasteResultCardProps {
    recipe: ZeroWasteResult;
    db: Firestore;
    userId: string;
    appId: string;
}

const ZeroWasteResultCard: React.FC<ZeroWasteResultCardProps> = ({ recipe, db, userId, appId }) => {

    const handleSaveToPizarron = async () => {
        const taskContent = `[Zero Waste] Desarrollar: ${recipe.nombre}`.substring(0, 500);
        await addDoc(collection(db, `artifacts/${appId}/public/data/pizarron-tasks`), {
            content: taskContent,
            status: 'Ideas',
            category: 'Desarrollo',
            createdAt: serverTimestamp(),
            boardId: 'general',
        });
        alert("Elaboración guardada en el Pizarrón.");
    };

    const handleAddToCritic = () => {
        const criticText = `## Elaboración Zero Waste: ${recipe.nombre}\n\n**Ingredientes:**\n${recipe.ingredientes}\n\n**Preparación:**\n${recipe.preparacion}`;
        localStorage.setItem('criticText', criticText);
        alert("¡Enviado a 'El Crítico'! Ve a la pestaña 'MakeMenu' para analizarlo.");
    };
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>{recipe.nombre}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <h4 className="font-semibold text-sm mb-1">Ingredientes</h4>
                    <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: recipe.ingredientes.replace(/\n/g, '<br/>') }} />
                </div>
                 <div>
                    <h4 className="font-semibold text-sm mb-1">Preparación</h4>
                    <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: recipe.preparacion.replace(/\n/g, '<br/>') }} />
                </div>
            </CardContent>
            <CardFooter className="gap-2">
                <Button size="sm" onClick={handleSaveToPizarron}>Guardar en Pizarrón</Button>
                <Button size="sm" variant="secondary" onClick={handleAddToCritic}>Añadir a El Crítico</Button>
            </CardFooter>
        </Card>
    );
};

export default ZeroWasteResultCard;
