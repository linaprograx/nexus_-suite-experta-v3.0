import React from 'react';
import { FaBook, FaBolt, FaWineGlassAlt } from 'react-icons/fa';
import { Card } from '../ui/Card';

interface GameModeSelectorProps {
    onSelectMode: (mode: string) => void;
}

export const GameModeSelector: React.FC<GameModeSelectorProps> = ({ onSelectMode }) => {
    const modes = [
        { name: 'Quiz Clásico', icon: <FaBook className="w-12 h-12 mx-auto mb-4" />, description: "Pon a prueba tu teoría." },
        { name: 'Speed Round', icon: <FaBolt className="w-12 h-12 mx-auto mb-4" />, description: "30 segundos. ¿Cuántas aciertas?" },
        { name: 'Cata a Ciegas', icon: <FaWineGlassAlt className="w-12 h-12 mx-auto mb-4" />, description: "Adivina el cóctel por su sabor." },
    ];

    return (
        <div className="w-full max-w-4xl mx-auto text-center">
             <h2 className="text-2xl font-bold mb-2">Elige tu modo de juego</h2>
             <p className="text-muted-foreground mb-8">Selecciona una de las opciones para continuar.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {modes.map(mode => (
                    <Card key={mode.name} className="p-6 text-center cursor-pointer hover:shadow-lg hover:border-primary transition-all" onClick={() => onSelectMode(mode.name)}>
                        {mode.icon}
                        <h3 className="font-semibold text-lg">{mode.name}</h3>
                        <p className="text-sm text-muted-foreground mt-2">{mode.description}</p>
                    </Card>
                ))}
            </div>
        </div>
    );
};
