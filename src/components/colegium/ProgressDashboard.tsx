import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/Card';
import { Button } from '../ui/Button';

interface ProgressDashboardProps {
    onStart: () => void;
}

export const ProgressDashboard: React.FC<ProgressDashboardProps> = ({ onStart }) => {
    const lastScores = [
        { name: 'Partida 1', score: 8 },
        { name: 'Partida 2', score: 6 },
        { name: 'Partida 3', score: 9 },
        { name: 'Partida 4', score: 7 },
        { name: 'Partida 5', score: 10 },
    ];

    const improvementAreas = [
        { question: '¿Cuál es el garnish de un Negroni?', answer: 'Piel de naranja' },
        { question: '¿Qué significa "stir"?', answer: 'Remover con cucharilla' },
    ];

    return (
        <div className="w-full max-w-4xl mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl">Tu Progreso en Colegium</CardTitle>
                    <CardDescription>Revisa tus últimas partidas y áreas a mejorar.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2">
                        <h3 className="font-semibold mb-4">Últimos 5 Puntajes</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={lastScores}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="score" fill="#8884d8" name="Puntaje" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div>
                        <h3 className="font-semibold mb-4">Áreas de Mejora</h3>
                        <div className="space-y-4">
                            {improvementAreas.map((item, index) => (
                                <div key={index} className="text-sm p-3 bg-secondary rounded-md">
                                    <p className="font-bold">{item.question}</p>
                                    <p className="text-primary">{item.answer}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button className="w-full" onClick={onStart}>Comenzar Nuevo Ejercicio</Button>
                </CardFooter>
            </Card>
        </div>
    );
};
