import React from 'react';
import { motion } from 'framer-motion';

interface QuizResultProps {
    score: number;
    total: number;
    onBack: () => void;
}

export const QuizResult: React.FC<QuizResultProps> = ({ score, total, onBack }) => {
    const percentage = Math.round((score / total) * 100);
    const xpEarned = score * 15; // Estimado visual, el real se calcula en backend

    return (
        <div className="h-full flex items-center justify-center p-8">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 rounded-[40px] p-10 text-center shadow-2xl relative overflow-hidden"
            >
                {/* Background Decor */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/20 blur-[80px] rounded-full translate-x-1/2 -translate-y-1/2" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/20 blur-[80px] rounded-full -translate-x-1/2 translate-y-1/2" />
                </div>

                <div className="relative z-10">
                    <div className="mb-8 relative inline-block">
                        {/* Circular Score Placeholder */}
                        <div className="w-40 h-40 rounded-full border-4 border-emerald-500/30 flex flex-col items-center justify-center bg-emerald-950/30 backdrop-blur-md shadow-lg mx-auto">
                            <span className="text-5xl font-serif text-white">{percentage}%</span>
                            <span className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold mt-1">Precisión</span>
                        </div>
                    </div>

                    <h2 className="text-3xl font-serif text-white mb-2">¡Entrenamiento Completo!</h2>
                    <p className="text-sm text-indigo-200/80 mb-8 max-w-[280px] mx-auto leading-relaxed">
                        Has demostrado gran habilidad. Tu progreso ha sido registrado en el Nexus.
                    </p>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                            <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1">Aciertos</p>
                            <p className="text-2xl font-serif text-white">{score} <span className="text-base text-white/40">/ {total}</span></p>
                        </div>
                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4">
                            <p className="text-[10px] font-black text-emerald-300 uppercase tracking-widest mb-1">XP Ganado</p>
                            <p className="text-2xl font-serif text-emerald-400">+{xpEarned}</p>
                        </div>
                    </div>

                    <button
                        onClick={onBack}
                        className="w-full py-4 bg-white text-indigo-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-50 transition-all shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 active:translate-y-0"
                    >
                        Volver al Dashboard
                    </button>
                </div>
            </motion.div>
        </div>
    );
};
