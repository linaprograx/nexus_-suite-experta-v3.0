import React from 'react';
import { motion } from 'framer-motion';
import { fireConfetti, playSound } from '../../utils/feedbackFx';

interface QuizResultProps {
    score: number;
    total: number;
    xpEarned?: number;
    leveledUp?: boolean;
    newLevel?: number;
    certificationTitle?: string;
    onBack: () => void;
}

export const QuizResult: React.FC<QuizResultProps> = ({ score, total, xpEarned = 0, leveledUp = false, newLevel = 1, certificationTitle, onBack }) => {
    const percentage = total > 0 ? Math.round((score / total) * 100) : 0;

    // Celebrate on mount: confetti + sound scaled to performance
    React.useEffect(() => {
        if (percentage === 100 || leveledUp) {
            fireConfetti();
            playSound(leveledUp ? 'levelup' : 'win');
        } else if (percentage >= 80) {
            playSound('win');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Performance-based messaging
    const verdict = percentage === 100
        ? { title: '¡Puntaje Perfecto!', msg: 'Dominio absoluto. Eres una referencia en la barra.', accent: 'amber' }
        : percentage >= 80
        ? { title: '¡Excelente!', msg: 'Gran nivel técnico. Sigue afinando los detalles.', accent: 'emerald' }
        : percentage >= 50
        ? { title: '¡Buen Trabajo!', msg: 'Vas por buen camino. La práctica te hará maestro.', accent: 'indigo' }
        : { title: 'Sigue Entrenando', msg: 'Cada error es aprendizaje. Repasa y vuelve a intentarlo.', accent: 'rose' };

    const ring = {
        amber: 'border-amber-500/40 bg-amber-100/70 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400',
        emerald: 'border-emerald-500/40 bg-emerald-100/70 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400',
        indigo: 'border-indigo-500/40 bg-indigo-100/70 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400',
        rose: 'border-rose-500/40 bg-rose-100/70 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400',
    }[verdict.accent];

    return (
        <div className="h-full flex items-center justify-center p-8">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md bg-white/80 dark:bg-white/10 backdrop-blur-xl border border-slate-200 dark:border-white/20 rounded-[40px] p-10 text-center shadow-2xl relative overflow-hidden"
            >
                {/* Background Decor */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/20 blur-[80px] rounded-full translate-x-1/2 -translate-y-1/2" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/20 blur-[80px] rounded-full -translate-x-1/2 translate-y-1/2" />
                </div>

                <div className="relative z-10">
                    {/* Level-up banner */}
                    {leveledUp && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="mb-6 py-2.5 px-4 rounded-2xl bg-gradient-to-r from-amber-400/30 to-yellow-400/30 dark:from-amber-500/20 dark:to-yellow-500/20 border border-amber-400/50 dark:border-amber-400/40 flex items-center justify-center gap-2"
                        >
                            <span className="text-lg">🎉</span>
                            <span className="text-xs font-black uppercase tracking-widest text-amber-700 dark:text-amber-300">¡Subiste a Nivel {newLevel}!</span>
                        </motion.div>
                    )}

                    <div className="mb-8 relative inline-block">
                        <div className={`w-40 h-40 rounded-full border-4 flex flex-col items-center justify-center backdrop-blur-md shadow-lg mx-auto ${ring}`}>
                            <span className="text-5xl font-serif text-slate-800 dark:text-white">{percentage}%</span>
                            <span className="text-[10px] uppercase tracking-widest font-bold mt-1">Precisión</span>
                        </div>
                    </div>

                    {/* Certification award */}
                    {certificationTitle && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.4 }}
                            className="mb-5 py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-400/30 to-yellow-300/30 dark:from-amber-500/20 dark:to-yellow-500/15 border border-amber-400/50 flex flex-col items-center gap-1"
                        >
                            <span className="text-2xl">🎖️</span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-300">Certificación Obtenida</span>
                            <span className="text-sm font-bold text-slate-800 dark:text-white">{certificationTitle}</span>
                        </motion.div>
                    )}

                    <h2 className="text-3xl font-serif text-slate-800 dark:text-white mb-2">{verdict.title}</h2>
                    <p className="text-sm text-slate-500 dark:text-indigo-200/80 mb-8 max-w-[280px] mx-auto leading-relaxed">
                        {verdict.msg}
                    </p>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="bg-white/60 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4">
                            <p className="text-[10px] font-black text-indigo-500 dark:text-indigo-300 uppercase tracking-widest mb-1">Aciertos</p>
                            <p className="text-2xl font-serif text-slate-800 dark:text-white">{score} <span className="text-base text-slate-400 dark:text-white/40">/ {total}</span></p>
                        </div>
                        <div className="bg-emerald-100/70 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/20 rounded-2xl p-4">
                            <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-300 uppercase tracking-widest mb-1">XP Ganado</p>
                            <p className="text-2xl font-serif text-emerald-600 dark:text-emerald-400">+{xpEarned}</p>
                        </div>
                    </div>

                    <button
                        onClick={onBack}
                        className="w-full py-4 bg-indigo-600 dark:bg-white text-white dark:text-indigo-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-500 dark:hover:bg-indigo-50 transition-all shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 active:translate-y-0"
                    >
                        Volver al Dashboard
                    </button>
                </div>
            </motion.div>
        </div>
    );
};
