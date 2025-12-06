import React from 'react';
import { Label } from '../ui/Label';
import { Textarea } from '../ui/Textarea';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Spinner } from '../ui/Spinner';
import { Icon } from '../ui/Icon';
import { ICONS } from '../ui/icons';

interface CriticControlsProps {
    criticMenuText: string;
    loading: boolean;
    onTextChange: (text: string) => void;
    onImageChange: (file: File | null) => void;
    onInvoke: () => void;
}

const CriticControls: React.FC<CriticControlsProps> = ({
    criticMenuText,
    loading,
    onTextChange,
    onImageChange,
    onInvoke
}) => {
    return (
        <div className="bg-white/60 dark:bg-slate-900/30 backdrop-blur-md rounded-2xl border border-white/20 dark:border-white/5 h-full flex flex-col overflow-hidden">
            <div className="p-4 border-b border-white/10 dark:border-white/5 bg-white/40 dark:bg-slate-900/40">
                <h3 className="font-semibold text-slate-800 dark:text-slate-200">The Critic Eye</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Sube tu material para análisis</p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
                <div className="space-y-3">
                    <Label className="text-xs uppercase tracking-wider text-slate-500 font-bold">Contenido del Menú</Label>
                    <Textarea
                        placeholder="Pega aquí el texto de tu menú, nombres de cócteles, descripciones..."
                        rows={8}
                        value={criticMenuText}
                        onChange={(e) => onTextChange(e.target.value)}
                        className="bg-white/40 dark:bg-slate-800/40 border-white/10 focus:border-rose-500 text-sm resize-none"
                    />
                </div>

                <div className="space-y-3">
                    <Label className="text-xs uppercase tracking-wider text-slate-500 font-bold">O Sube una Imagen</Label>
                    <div className="relative group cursor-pointer">
                        <Input
                            type="file"
                            accept=".txt,.jpg,.png,.jpeg"
                            onChange={(e) => onImageChange(e.target.files?.[0] || null)}
                            className="bg-white/40 dark:bg-slate-800/40 border-white/10 text-xs file:bg-rose-100 file:text-rose-700 file:border-0 file:rounded-md file:px-2 file:py-1 file:mr-3 file:font-semibold hover:file:bg-rose-200 transition-all cursor-pointer"
                        />
                    </div>
                    <p className="text-[10px] text-slate-400">Archivos soportados: JPG, PNG. El análisis de imagen consume más tokens.</p>
                </div>
            </div>

            <div className="p-4 border-t border-white/10 dark:border-white/5 bg-white/30 dark:bg-slate-900/20">
                <Button
                    onClick={onInvoke}
                    disabled={loading}
                    className="w-full bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-500/20"
                >
                    {loading ? <Spinner className="w-4 h-4 mr-2" /> : <Icon svg={ICONS.critic} className="w-4 h-4 mr-2" />}
                    Invocar Crítica
                </Button>
            </div>
        </div>
    );
};

export default CriticControls;
