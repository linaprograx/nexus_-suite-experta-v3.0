import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { QuizQuestion } from '../../../types';

interface QuizInProgressProps {
    quizData: QuizQuestion[];
    currentQuestionIndex: number;
    quizSettings: { topic: string };
    timer: number;
    answerFeedback: number | null;
    handleAnswer: (index: number) => void;
}

export const QuizInProgress: React.FC<QuizInProgressProps> = ({ quizData, currentQuestionIndex, quizSettings, timer, answerFeedback, handleAnswer }) => {
    const currentQ = quizData[currentQuestionIndex];
    if (!currentQ) return null;

    return (
        <Card className="w-full max-w-2xl">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle>Pregunta {currentQuestionIndex + 1} / {quizData.length}</CardTitle>
                    {quizSettings.topic === 'Speed Round' && (
                        <div className="text-2xl font-bold text-primary">{timer}s</div>
                    )}
                </div>
                <CardDescription>{currentQ.question}</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentQ.options.map((option, index) => {
                    let variant: "default" | "secondary" | "destructive" = "secondary";
                    if (answerFeedback !== null) {
                       if(index === currentQ.correctAnswerIndex) variant = "default";
                       else if (index === answerFeedback) variant = "destructive";
                    }
                    return <Button key={index} variant={variant} className="h-auto py-3 justify-start text-left whitespace-normal" onClick={() => handleAnswer(index)}>{option}</Button>
                })}
            </CardContent>
        </Card>
    );
};
