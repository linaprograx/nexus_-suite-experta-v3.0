import React from 'react';
import { Firestore, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { TrendResult } from '../../../types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/Card';
import { Button } from '../ui/Button';

interface TrendResultCardProps {
    item: TrendResult;
    db: Firestore;
    userId: string;
    appId: string;
    trendHistoryPath: string;
}

export const TrendResultCard: React.FC<TrendResultCardProps> = ({ item, db, userId, appId, trendHistoryPath }) => {

    const handleSaveToPizarron = async () => {
        if(!db || !userId) return;
        const taskText = `[Trend] ${item.titulo}: ${item.resumen}`.substring(0, 500);
        await addDoc(collection(db, `artifacts/${appId}/public/data/pizarron-tasks`), {
            content: taskText, status: 'Ideas', category: 'Ideas', createdAt: serverTimestamp(), boardId: 'general'
        });
        alert("Idea guardada en el Pizarrón.");
    };

    const handleSaveToHistory = async () => {
        if(!db || !userId) return;
        await addDoc(collection(db, trendHistoryPath), { ...item, createdAt: serverTimestamp() });
        alert("Tendencia guardada en el historial.");
    };
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>{item.titulo}</CardTitle>
                <CardDescription>Fuente: {item.fuente}</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-sm">{item.resumen}</p>
            </CardContent>
            <CardFooter className="gap-4">
                <Button size="sm" onClick={handleSaveToPizarron}>Guardar en Pizarrón</Button>
                <Button size="sm" variant="outline" onClick={handleSaveToHistory}>Guardar en Historial</Button>
            </CardFooter>
        </Card>
    );
};
