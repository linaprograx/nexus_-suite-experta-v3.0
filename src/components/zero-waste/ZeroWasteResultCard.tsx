import React from 'react';
import { Firestore, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { ZeroWasteResult } from '../../types';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { ICONS } from '../ui/icons';

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

        <div className="bg-white/60 dark:bg-slate-900/30 backdrop-blur-md rounded-2xl border border-white/20 dark:border-white/5 overflow-hidden transition-all hover:shadow-lg hover:border-lime-200/50 dark:hover:border-lime-800/50">
            <div className="p-5 border-b border-white/10 dark:border-white/5 bg-gradient-to-r from-white/40 to-transparent dark:from-slate-800/40 flex justify-between items-start">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-lime-100 dark:bg-lime-900/30 rounded-lg text-lime-600 dark:text-lime-400">
                        <Icon svg={ICONS.recycle} className="w-5 h-5" />
                    </div>
                    <h3 className="font-semibold text-lg text-slate-800 dark:text-slate-100">{recipe.nombre}</h3>
                </div>
                <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={handleSaveToPizarron} title="Guardar en Pizarrón">
                        <Icon svg={ICONS.plusCircle} className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h4 className="font-semibold text-xs uppercase tracking-wider text-lime-700 dark:text-lime-400 mb-3 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-lime-500"></span>
                        Ingredientes
                    </h4>
                    <div className="bg-white/30 dark:bg-slate-800/30 p-0 rounded-xl border border-white/10 overflow-hidden">
                        <table className="w-full text-sm">
                            <tbody className="divide-y divide-white/10 dark:divide-white/5">
                                {recipe.ingredientes.split('\n').filter(line => line.trim()).map((line, idx) => (
                                    <tr key={idx} className="hover:bg-white/20">
                                        <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{line.replace(/^[-*•]\s*/, '')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div>
                    <h4 className="font-semibold text-xs uppercase tracking-wider text-lime-700 dark:text-lime-400 mb-3 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-lime-500"></span>
                        Preparación
                    </h4>
                    <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed pl-2">
                        <ol className="list-decimal space-y-2 pl-4 marker:text-lime-500 marker:font-bold">
                            {recipe.preparacion.split('\n').filter(line => line.trim()).map((line, idx) => (
                                <li key={idx} className="pl-1">
                                    {line.replace(/^\d+\.\s*/, '')}
                                </li>
                            ))}
                        </ol>
                    </div>
                </div>
            </div>

            <div className="px-6 py-4 bg-white/30 dark:bg-slate-900/20 border-t border-white/10 flex justify-end gap-3">
                <Button variant="outline" size="sm" onClick={handleSaveToPizarron} className="dark:border-white/10 dark:hover:bg-slate-800">
                    <Icon svg={ICONS.list} className="w-4 h-4 mr-2" />
                    Pizarrón
                </Button>
                <Button variant="secondary" size="sm" onClick={handleAddToCritic} className="bg-lime-100 text-lime-800 hover:bg-lime-200 dark:bg-lime-900/40 dark:text-lime-300 dark:hover:bg-lime-900/60 border-none">
                    <Icon svg={ICONS.critic} className="w-4 h-4 mr-2" />
                    Enviar a Crítico
                </Button>
            </div>
        </div>
    );
};

export default ZeroWasteResultCard;

