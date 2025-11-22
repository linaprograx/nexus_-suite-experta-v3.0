import React from 'react';
import { Firestore, doc, setDoc, addDoc, collection } from 'firebase/firestore';
import { Ingredient } from '../../../types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Label } from '../ui/Label';

export const IngredientFormModal: React.FC<{isOpen: boolean, onClose: () => void, db: Firestore, userId: string, appId: string, editingIngredient: Ingredient | null}> = 
  ({ isOpen, onClose, db, userId, appId, editingIngredient }) => {

  const [formData, setFormData] = React.useState({
    nombre: '',
    categoria: 'General',
    precioCompra: 0,
    unidadCompra: 'Botella (700ml)',
    standardUnit: 'ml',
    standardQuantity: 700,
  });

  React.useEffect(() => {
    if (editingIngredient) {
      setFormData(editingIngredient as any);
    } else {
      // Resetear
      setFormData({
        nombre: '', categoria: 'General', precioCompra: 0, unidadCompra: 'Botella (700ml)', standardUnit: 'ml', standardQuantity: 700
      });
    }
  }, [editingIngredient, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    const ingredientsColPath = `artifacts/${appId}/users/${userId}/grimorio-ingredients`;

    const precioCompra = parseFloat(String(formData.precioCompra)) || 0;
    const standardQuantity = parseFloat(String(formData.standardQuantity)) || 0;

    let standardPrice = 0;
    if (standardQuantity > 0 && precioCompra > 0) {
      standardPrice = precioCompra / standardQuantity;
    }

    const dataToSave = {
      ...formData,
      precioCompra,
      standardQuantity,
      standardPrice
    };

    if (editingIngredient) {
      await setDoc(doc(db, ingredientsColPath, editingIngredient.id), dataToSave);
    } else {
      await addDoc(collection(db, ingredientsColPath), dataToSave);
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editingIngredient ? "Editar Ingrediente" : "Añadir Ingrediente"}>
      <div className="space-y-4">
        <Label>Nombre</Label>
        <Input name="nombre" value={formData.nombre} onChange={handleChange} />
        <Label>Categoría</Label>
        <Input name="categoria" value={formData.categoria} onChange={handleChange} />
        <Label>Precio de Compra (€)</Label>
        <Input name="precioCompra" type="number" value={formData.precioCompra} onChange={handleChange} />
        <Label>Unidad de Compra (ej. Botella 700ml, Saco 1kg)</Label>
        <Input name="unidadCompra" value={formData.unidadCompra} onChange={handleChange} />
        <Label>Unidad Estándar</Label>
        <Select name="standardUnit" value={formData.standardUnit} onChange={handleChange}>
          <option value="ml">ml (Líquidos)</option>
          <option value="g">g (Sólidos)</option>
          <option value="und">und (Unidad)</option>
        </Select>
        <Label>Cantidad Estándar (en esa unidad)</Label>
        <Input name="standardQuantity" type="number" value={formData.standardQuantity} onChange={handleChange} />
        <Button onClick={handleSubmit} className="w-full">Guardar</Button>
      </div>
    </Modal>
  );
};
