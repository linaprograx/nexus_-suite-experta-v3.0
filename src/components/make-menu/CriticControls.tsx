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
        <div className="backdrop-blur-xl bg-white/40 dark:bg-slate-900/40 border border-white/20 shadow-lg rounded-2xl h-full flex flex-col overflow-hidden">
            <div className="p-4 border-b border-white/10">
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
                        className="bg-white/40 dark:bg-slate-800/40 border-white/10 focus:border-amber-500 text-sm resize-none"
                    />
                </div>

                <div className="space-y-3">
                    <Label className="text-xs uppercase tracking-wider text-slate-500 font-bold">O Sube una Imagen</Label>
                    <div className="relative group cursor-pointer">
                        <Input
                            type="file"
                            accept=".txt,.jpg,.png,.jpeg"
                            onChange={(e) => onImageChange(e.target.files?.[0] || null)}
                            className="bg-white/40 dark:bg-slate-800/40 border-white/10 text-xs file:bg-amber-100 file:text-amber-700 file:border-0 file:rounded-md file:px-2 file:py-1 file:mr-3 file:font-semibold hover:file:bg-amber-200 transition-all cursor-pointer"
                        />
                    </div>
                    <p className="text-[10px] text-slate-400">Archivos soportados: JPG, PNG. El análisis de imagen consume más tokens.</p>
                </div>
            </div>

            <div className="p-4 border-t border-white/10 dark:border-white/5 bg-white/30 dark:bg-slate-900/20 space-y-3">
                <div className="grid grid-cols-2 gap-2 mb-2">
                    <button className="text-[10px] font-medium bg-amber-50 hover:bg-amber-100 text-amber-800 py-2 rounded-lg border border-amber-200 transition-colors">
                        🔍 Detectar Alérgenos
                    </button>
                    <button className="text-[10px] font-medium bg-amber-50 hover:bg-amber-100 text-amber-800 py-2 rounded-lg border border-amber-200 transition-colors">
                        🎨 Evaluar Diseño
                    </button>
                    <button className="text-[10px] font-medium bg-amber-50 hover:bg-amber-100 text-amber-800 py-2 rounded-lg border border-amber-200 transition-colors">
                        💰 Revisar Precios
                    </button>
                    <button className="text-[10px] font-medium bg-amber-50 hover:bg-amber-100 text-amber-800 py-2 rounded-lg border border-amber-200 transition-colors">
                        📝 Corregir Textos
                    </button>
                </div>

                <Button
                    onClick={onInvoke}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg py-3 transition-all hover:scale-[1.02]"
                >
                    {loading ? (
                        <span className="flex items-center gap-2">
                            <Spinner className="w-4 h-4" />
                            <span className="animate-pulse">Analizando carta...</span>
                        </span>
                    ) : (
                        <span className="flex items-center gap-2">
                            <Icon svg={ICONS.critic} className="w-4 h-4" />
                            <span>Invocar al Crítico</span>
                        </span>
                    )}
                </Button>
            </div>
        </div>
    );
};

export default CriticControls;
