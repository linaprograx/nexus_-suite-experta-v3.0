import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Label } from '../ui/Label';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';

interface QuizSettings {
    topic: string;
    difficulty: string;
    numQuestions: number;
}

interface QuizSetupProps {
    quizSettings: QuizSettings;
    setQuizSettings: React.Dispatch<React.SetStateAction<QuizSettings>>;
    handleStartQuiz: () => void;
    onBack: () => void;
}

export const QuizSetup: React.FC<QuizSetupProps> = ({ quizSettings, setQuizSettings, handleStartQuiz, onBack }) => {
    return (
        <Card className="w-full max-w-md">
            <CardHeader><CardTitle>Configurar Ejercicio: {quizSettings.topic}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                 <div className="space-y-1">
                    <Label>Dificultad</Label>
                    <Select value={quizSettings.difficulty} onChange={e => setQuizSettings(s => ({...s, difficulty: e.target.value}))}>
                        <option>Fácil</option><option>Media</option><option>Difícil</option>
                    </Select>
                </div>
                 <div className="space-y-1">
                    <Label>Nº Preguntas</Label>
                    <Select value={quizSettings.numQuestions} onChange={e => setQuizSettings(s => ({...s, numQuestions: parseInt(e.target.value)}))}>
                        <option value={5}>5</option><option value={10}>10</option><option value={20}>20</option>
                    </Select>
                </div>
                <Button className="w-full" onClick={handleStartQuiz}>Iniciar Ejercicio</Button>
                <Button variant="outline" className="w-full" onClick={onBack}>Volver</Button>
            </CardContent>
        </Card>
    );
};
