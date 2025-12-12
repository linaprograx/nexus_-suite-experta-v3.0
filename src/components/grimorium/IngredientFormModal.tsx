import React from 'react';
import { Firestore, doc, setDoc, addDoc, collection } from 'firebase/firestore';
import { Ingredient } from '../../../types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Label } from '../ui/Label';
import { calculateIngredientPrice } from '../../utils/costCalculator';
import { classifyIngredient } from '../../modules/ingredients/families';

import { useSuppliers } from '../../features/suppliers/hooks/useSuppliers'; // Updated import

export const IngredientFormModal: React.FC<{ isOpen: boolean, onClose: () => void, db: Firestore, userId: string, appId: string, editingIngredient: Ingredient | null }> =
  ({ isOpen, onClose, db, userId, appId, editingIngredient }) => {

    // Providers Hook
    const { suppliers: proveedores } = useSuppliers({ db, userId }); // Mapped to match existing variable name 'proveedores'

    const predefinedCategories = ['General', 'Citrus', 'Fruits', 'Herbs', 'Spices', 'Floral', 'Vegetal', 'Toasted', 'Umami', 'Sweeteners', 'Fermented', 'Alcohol Base', 'Bitters', 'Syrups', 'Cordials', 'Infusions', 'Unknown'];

    const [formData, setFormData] = React.useState({
      nombre: '',
      categoria: 'General',
      precioCompra: 0,
      unidadCompra: 'Botella (700ml)',
      standardUnit: 'ml',
      standardQuantity: 700,
      wastePercentage: 0,
      proveedores: [] as string[],
      stockActual: 0,
      cantidadComprada: 0
    });

    React.useEffect(() => {
      // Force form rewrite whenever the modal opens or the editing ingredient changes
      if (isOpen) {
        if (editingIngredient) {
          setFormData({
            nombre: editingIngredient.nombre || '',
            categoria: editingIngredient.categoria || 'General',
            precioCompra: editingIngredient.precioCompra || 0,
            unidadCompra: editingIngredient.unidadCompra || 'Botella (700ml)',
            standardUnit: editingIngredient.standardUnit || 'ml',
            standardQuantity: editingIngredient.standardQuantity || 700,
            wastePercentage: editingIngredient.wastePercentage || 0,
            proveedores: editingIngredient.proveedores || [],
            stockActual: (editingIngredient as any).stockActual || 0,
            cantidadComprada: (editingIngredient as any).cantidadComprada || 0
          });
        } else {
          // Reset for new ingredient
          setFormData({
            nombre: '',
            categoria: 'General',
            precioCompra: 0,
            unidadCompra: 'Botella (700ml)',
            standardUnit: 'ml',
            standardQuantity: 700,
            wastePercentage: 0,
            proveedores: [],
            stockActual: 0,
            cantidadComprada: 0
          });
        }
      }
    }, [editingIngredient, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setFormData({ ...formData, [e.target.name]: e.target.value });

      // Auto-classify category when name changes
      if (e.target.name === 'nombre' && e.target.value.length > 2) {
        const family = classifyIngredient(e.target.value);
        if (family !== 'Unknown') {
          setFormData(prev => ({ ...prev, categoria: family }));
        }
      }
    };

    const handleSubmit = async () => {
      const ingredientsColPath = `artifacts/${appId}/users/${userId}/grimorio-ingredients`;

      const precioCompra = parseFloat(String(formData.precioCompra)) || 0;
      const standardQuantity = parseFloat(String(formData.standardQuantity)) || 0;
      const wastePercentage = parseFloat(String(formData.wastePercentage)) || 0;

      const standardPrice = calculateIngredientPrice(precioCompra, standardQuantity, wastePercentage);

      const dataToSave = {
        ...formData,
        precioCompra,
        standardQuantity,
        wastePercentage,
        standardPrice
      };

      if (editingIngredient) {
        await setDoc(doc(db, ingredientsColPath, editingIngredient.id), dataToSave);
      } else {
        await addDoc(collection(db, ingredientsColPath), dataToSave);
      }
      onClose();
    };

    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose} />

        {/* Premium Gradient Modal Content */}
        <div className="relative w-full max-w-lg flex flex-col bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-white/5 overflow-hidden animate-in zoom-in-95 duration-200">
          {/* Header with Gradient Background */}
          <div className="relative p-6 border-b border-white/10 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 opacity-100" />
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />

            <div className="relative flex items-center justify-between z-10">
              <h2 className="text-xl font-bold text-white shadow-sm">
                {editingIngredient ? "Editar Ingrediente" : "Nuevo Ingrediente"}
              </h2>
              <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/10">
                {/* Small close icon usually ICONS.x */}
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x"><path d="M18 6 6 18" /><path d="m6 6 18 18" /></svg>
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4 overflow-y-auto max-h-[70vh] custom-scrollbar">
            <div className="space-y-4">
              <div className="space-y-1">
                <Label className="text-xs uppercase tracking-wider text-slate-500">Nombre</Label>
                <Input name="nombre" value={formData.nombre} onChange={handleChange} className="bg-white/50 dark:bg-slate-800/50" placeholder="Ej. Vodka Absolute" />
              </div>

              <div className="flex justify-between items-center mt-2">
                <Label className="text-xs uppercase tracking-wider text-slate-500">Categoría</Label>
                <button
                  type="button"
                  className="text-[10px] text-emerald-500 hover:text-emerald-600 font-bold uppercase"
                  onClick={() => {
                    const newCat = prompt("Nombre de la nueva familia:");
                    if (newCat && newCat.trim()) {
                      setFormData(prev => ({ ...prev, categoria: newCat.trim() }));
                    }
                  }}
                >
                  + Nueva
                </button>
              </div>
              <Select name="categoria" value={formData.categoria} onChange={handleChange} className="bg-white/50 dark:bg-slate-800/50">
                {/* Add current if not in list, basic handling */}
                {!predefinedCategories.includes(formData.categoria) && (
                  <option value={formData.categoria}>{formData.categoria}</option>
                )}
                {predefinedCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </Select>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs uppercase tracking-wider text-slate-500">Precio de Compra (€)</Label>
                  <Input name="precioCompra" type="number" step="0.01" value={formData.precioCompra} onChange={handleChange} className="bg-white/50 dark:bg-slate-800/50" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs uppercase tracking-wider text-slate-500">Unidad de Compra</Label>
                  <Input name="unidadCompra" value={formData.unidadCompra} onChange={handleChange} className="bg-white/50 dark:bg-slate-800/50" placeholder="Ej. Botella 700ml" />
                </div>
                {/* New Fields */}
                <div className="space-y-1">
                  <Label className="text-xs uppercase tracking-wider text-slate-500">Stock Actual</Label>
                  <Input name="stockActual" type="number" value={formData.stockActual} onChange={handleChange} placeholder="0" className="bg-white/50 dark:bg-slate-800/50" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs uppercase tracking-wider text-slate-500">Cant. Últ. Compra</Label>
                  <Input name="cantidadComprada" type="number" value={formData.cantidadComprada} onChange={handleChange} placeholder="0" className="bg-white/50 dark:bg-slate-800/50" />
                </div>
              </div>

              {/* Provider Selector */}
              <div className="space-y-1">
                <Label className="text-xs uppercase tracking-wider text-slate-500">Proveedor Principal</Label>
                <div className="relative">
                  <select
                    name="proveedor"
                    className="w-full h-10 pl-3 pr-8 bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-emerald-500/50 appearance-none"
                    value={formData.proveedores?.[0] || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData(prev => ({ ...prev, proveedores: val ? [val] : [] }));
                    }}
                  >
                    <option value="">-- Sin asignar --</option>
                    {proveedores.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  {/* Custom Arrow */}
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <div className="space-y-1">
                  <Label className="text-xs uppercase tracking-wider text-slate-500">Unidad Estándar</Label>
                  <Select name="standardUnit" value={formData.standardUnit} onChange={handleChange} className="bg-white dark:bg-slate-900">
                    <option value="ml">ml (Líquidos)</option>
                    <option value="g">g (Sólidos)</option>
                    <option value="und">und (Unidad)</option>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs uppercase tracking-wider text-slate-500">Cantidad Estándar</Label>
                  <Input name="standardQuantity" type="number" value={formData.standardQuantity} onChange={handleChange} className="bg-white dark:bg-slate-900" />
                </div>
                <div className="col-span-2 text-[10px] text-slate-400">
                  Define cuánto contenido trae la unidad de compra (ej. 700 para una botella de 700ml).
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs uppercase tracking-wider text-slate-500">Merma (%)</Label>
                <Input
                  name="wastePercentage"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.wastePercentage}
                  onChange={handleChange}
                  placeholder="0"
                  className="bg-white/50 dark:bg-slate-800/50"
                />
                <p className="text-[10px] text-slate-400">Porcentaje de pérdida (0-100%). El precio se ajustará automáticamente.</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-slate-200/50 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50 flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={handleSubmit} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20 px-6">
              {editingIngredient ? "Guardar Cambios" : "Añadir Ingrediente"}
            </Button>
          </div>
        </div>
      </div>
    );
  };
