import React from 'react';
import { Firestore, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { ZeroWasteResult } from '../../../types';
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
        <div className="bg-white/60 dark:bg-slate-900/30 backdrop-blur-md rounded-2xl border border-white/20 dark:border-white/5 overflow-hidden transition-all hover:shadow-lg hover:border-cyan-200/50 dark:hover:border-cyan-800/50">
            <div className="p-5 border-b border-white/10 dark:border-white/5 bg-gradient-to-r from-white/40 to-transparent dark:from-slate-800/40 flex justify-between items-start">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg text-cyan-600 dark:text-cyan-400">
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
                    <h4 className="font-semibold text-xs uppercase tracking-wider text-cyan-700 dark:text-cyan-400 mb-3 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span>
                        Ingredientes
                    </h4>
                    <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-white/30 dark:bg-slate-800/30 p-4 rounded-xl border border-white/10">
                        <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: recipe.ingredientes.replace(/\n/g, '<br/>') }} />
                    </div>
                </div>
                <div>
                    <h4 className="font-semibold text-xs uppercase tracking-wider text-cyan-700 dark:text-cyan-400 mb-3 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span>
                        Preparación
                    </h4>
                    <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                        <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: recipe.preparacion.replace(/\n/g, '<br/>') }} />
                    </div>
                </div>
            </div>

            <div className="px-6 py-4 bg-white/30 dark:bg-slate-900/20 border-t border-white/10 flex justify-end gap-3">
                <Button variant="outline" size="sm" onClick={handleSaveToPizarron} className="dark:border-white/10 dark:hover:bg-slate-800">
                    <Icon svg={ICONS.list} className="w-4 h-4 mr-2" />
                    Pizarrón
                </Button>
                <Button variant="secondary" size="sm" onClick={handleAddToCritic} className="bg-cyan-100 text-cyan-800 hover:bg-cyan-200 dark:bg-cyan-900/40 dark:text-cyan-300 dark:hover:bg-cyan-900/60 border-none">
                    <Icon svg={ICONS.critic} className="w-4 h-4 mr-2" />
                    Enviar a Crítico
                </Button>
            </div>
        </div>
    );
};

export default ZeroWasteResultCard;

