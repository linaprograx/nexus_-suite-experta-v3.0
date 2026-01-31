import React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Supplier } from '../../types';

interface GrimoriumImportModalsProps {
    // CSV Ingredients
    showCsvImport: boolean;
    onCloseCsv: () => void;
    onCsvImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
    csvSupplierId: string;
    setCsvSupplierId: (id: string) => void;
    suppliers: Supplier[];

    // TXT Recipes
    showTxtImport: boolean;
    onCloseTxt: () => void;
    onTxtImport: (e: React.ChangeEvent<HTMLInputElement>) => void;

    // PDF Recipes
    showPdfImport: boolean;
    onClosePdf: () => void;
    onPdfImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
    useOcr: boolean;
    setUseOcr: (val: boolean) => void;
}

export const GrimoriumImportModals: React.FC<GrimoriumImportModalsProps> = ({
    showCsvImport, onCloseCsv, onCsvImport, csvSupplierId, setCsvSupplierId, suppliers,
    showTxtImport, onCloseTxt, onTxtImport,
    showPdfImport, onClosePdf, onPdfImport, useOcr, setUseOcr
}) => {
    return (
        <>
            {/* CSV Import Modal */}
            <Modal isOpen={showCsvImport} onClose={onCloseCsv} title="Importar Ingredientes CSV">
                <div className="space-y-4 p-4">
                    <p className="text-sm text-slate-500">Formato: Nombre;Categoria;Precio;Unidad.</p>
                    <div className="space-y-2">
                        <Label>Proveedor (Opcional)</Label>
                        <select
                            className="w-full h-10 pl-3 pr-8 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                            value={csvSupplierId}
                            onChange={(e) => setCsvSupplierId(e.target.value)}
                        >
                            <option value="">-- Sin asignar --</option>
                            {suppliers.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                        <p className="text-[10px] text-slate-400">Todos los ingredientes importados se vincularán a este proveedor.</p>
                    </div>
                    <Input type="file" accept=".csv" onChange={onCsvImport} />
                </div>
                <div className="p-4 border-t border-slate-100 flex justify-end gap-2">
                    <Button variant="ghost" onClick={onCloseCsv}>Cancelar</Button>
                    <Button onClick={onCloseCsv}>Cerrar</Button>
                </div>
            </Modal>

            {/* TXT Import Modal */}
            <Modal isOpen={showTxtImport} onClose={onCloseTxt} title="Importar Recetas TXT">
                <div className="space-y-4 p-4">
                    <p className="text-sm text-slate-500">Formato Nexus TXT.</p>
                    <Input type="file" accept=".txt" onChange={onTxtImport} />
                </div>
            </Modal>

            {/* PDF Import Modal */}
            <Modal isOpen={showPdfImport} onClose={onClosePdf} title="Importar Recetas PDF PRO">
                <div className="space-y-4 p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <input
                            type="checkbox"
                            checked={useOcr}
                            onChange={() => setUseOcr(!useOcr)}
                            id="ocr"
                            className="rounded border-gray-300 text-emerald-600 shadow-sm focus:border-emerald-300 focus:ring focus:ring-emerald-200 focus:ring-opacity-50"
                        />
                        <label htmlFor="ocr" className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                            Usar OCR (Lento pero preciso)
                        </label>
                    </div>
                    <Input type="file" accept=".pdf" onChange={onPdfImport} />
                </div>
            </Modal>
        </>
    );
};
