import React from 'react';
import { Drawer } from '../../../components/ui/Drawer';
import { Button } from '../../../components/ui/Button';
import { EscandalloResult } from '../calcEscandallo';

interface EscandalloModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: EscandalloResult | null;
}

export const EscandalloModal: React.FC<EscandalloModalProps> = ({ isOpen, onClose, result }) => {
  // Even if no result, we might want to render Drawer if isOpen (though it shouldn't happen)
  // But Drawer expects children.
  if (!result && !isOpen) return null;

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title={result ? `Escandallo: ${result.recipeName}` : 'Escandallo'} className="max-w-2xl">
      {result && (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <span className="text-xs text-slate-500 block">Batch Size</span>
            <span className="font-bold text-lg">{result.batchSize} pax</span>
          </div>
          <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <span className="text-xs text-slate-500 block">Costo Total</span>
            <span className="font-bold text-lg">€{result.totalCost.toFixed(2)}</span>
          </div>
          <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl">
             <span className="text-xs text-slate-500 block">Costo / pax</span>
             <span className="font-bold text-lg">€{result.costPerUnit.toFixed(2)}</span>
          </div>
          <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl">
             <span className="text-xs text-slate-500 block">Tiempo Est.</span>
             <span className="font-bold text-lg">{result.productionTimeEstimado}</span>
          </div>
        </div>

        <div>
           <h3 className="font-semibold mb-2">Requerimientos de Ingredientes</h3>
           <div className="border rounded-lg overflow-hidden">
             <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-900">
                   <tr>
                      <th className="p-3 text-left">Ingrediente</th>
                      <th className="p-3 text-right">Cantidad Total</th>
                      <th className="p-3 text-right">Costo Estimado</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {result.ingredientRequirements.map((req, idx) => (
                    <tr key={idx}>
                       <td className="p-3">{req.name}</td>
                       <td className="p-3 text-right">{req.totalQuantity.toFixed(2)} {req.unit}</td>
                       <td className="p-3 text-right">€{req.cost.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
             </table>
           </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
           <Button variant="outline" onClick={onClose}>Cerrar</Button>
           <Button onClick={() => window.print()}>Imprimir / PDF</Button>
        </div>
      </div>
      )}
    </Drawer>
  );
};
