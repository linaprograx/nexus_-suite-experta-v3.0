import React, { useRef } from 'react';
import { Modal } from '../ui/Modal';
import { Card } from '../ui/Card';
import { Icon } from '../ui/Icon';
import { ICONS } from '../ui/icons';

interface ImportRecipeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectCsv: (file: File) => void;
    onSelectPdf: (file: File) => void;
}

export const ImportRecipeModal: React.FC<ImportRecipeModalProps> = ({ isOpen, onClose, onSelectCsv, onSelectPdf }) => {
    const csvInputRef = useRef<HTMLInputElement>(null);
    const pdfInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'csv' | 'pdf') => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (type === 'csv') onSelectCsv(file);
        else onSelectPdf(file);

        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Importar Recetas">
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* OPTION A: STRUCTUED DATA (CSV) */}
                <Card
                    className="p-6 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-all border-2 border-transparent hover:border-emerald-500/30 group"
                    onClick={() => csvInputRef.current?.click()}
                >
                    <div className="flex flex-col items-center text-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                            <Icon svg={ICONS.fileText} className="w-8 h-8" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">Datos Estructurados</h3>
                            <p className="text-sm text-slate-500 mt-1">Importar archivo CSV</p>
                            <div className="mt-3 text-xs bg-slate-100 dark:bg-slate-900 p-2 rounded text-slate-400 font-mono">
                                recipe, ingredient, qty, unit
                            </div>
                        </div>
                        <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider mt-2">Recomendado</span>
                    </div>
                    <input
                        type="file"
                        ref={csvInputRef}
                        className="hidden"
                        accept=".csv,.txt"
                        onChange={(e) => handleFileChange(e, 'csv')}
                    />
                </Card>

                {/* OPTION B: UNSTRUCTURED DOCS (PDF/IMG) */}
                <Card
                    className="p-6 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-all border-2 border-transparent hover:border-indigo-500/30 group"
                    onClick={() => pdfInputRef.current?.click()}
                >
                    <div className="flex flex-col items-center text-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                            <Icon svg={ICONS.upload} className="w-8 h-8" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">Documentos</h3>
                            <p className="text-sm text-slate-500 mt-1">Importar PDF o Imagen</p>
                            <div className="mt-3 text-xs bg-indigo-50 dark:bg-indigo-900/20 p-2 rounded text-indigo-400 border border-indigo-100 dark:border-indigo-800">
                                Powered by AI OCR
                            </div>
                        </div>
                        <span className="text-xs font-bold text-indigo-500 uppercase tracking-wider mt-2">PRO Feature</span>
                    </div>
                    <input
                        type="file"
                        ref={pdfInputRef}
                        className="hidden"
                        accept=".pdf,.png,.jpg,.jpeg"
                        onChange={(e) => handleFileChange(e, 'pdf')}
                    />
                </Card>

            </div>
        </Modal>
    );
};
