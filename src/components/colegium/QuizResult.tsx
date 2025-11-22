import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';

interface QuizResultProps {
    score: number;
    total: number;
    onBack: () => void;
}

export const QuizResult: React.FC<QuizResultProps> = ({ score, total, onBack }) => {
    return (
        <Card className="w-full max-w-md text-center">
            <CardHeader><CardTitle>¡Ejercicio Completo!</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <p className="text-lg">Tu puntaje:</p>
                <p className="text-5xl font-bold text-primary">{score} / {total}</p>
                <Button className="w-full" onClick={onBack}>Volver al Dashboard</Button>
            </CardContent>
        </Card>
    );
};
