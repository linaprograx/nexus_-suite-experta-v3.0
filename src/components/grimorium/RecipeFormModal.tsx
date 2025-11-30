import React from 'react';
import { Firestore, updateDoc, addDoc, collection, doc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { Autocomplete } from '../ui/Autocomplete';
import { ICONS } from '../ui/icons';
import { Recipe, Ingredient, IngredientLineItem } from '../../../types';
import { useApp } from '../../context/AppContext';

interface RecipeFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    db: Firestore;
    userId: string;
    initialData: Partial<Recipe> | null;
    allIngredients: Ingredient[];
}

export const RecipeFormModal: React.FC<RecipeFormModalProps> = ({ isOpen, onClose, db, userId, initialData, allIngredients }) => {
    const { storage } = useApp();
    const [recipe, setRecipe] = React.useState<Partial<Recipe>>({});
    const [lineItems, setLineItems] = React.useState<IngredientLineItem[]>([]);
    const [isUploading, setIsUploading] = React.useState(false);

    React.useEffect(() => {
        setRecipe(initialData || {});
        setLineItems(initialData?.ingredientes || []);
    }, [initialData]);

    const handleRecipeChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setRecipe(prev => ({...prev, [e.target.name]: e.target.value }));
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !recipe || !storage) return;

        setIsUploading(true);
        try {
            const storageRef = ref(storage, `recipes/${recipe.id || Date.now()}.jpg`);
            await uploadBytes(storageRef, file);
            const imageUrl = await getDownloadURL(storageRef);
            setRecipe(prev => ({ ...prev, imageUrl }));
        } catch (error) {
            console.error("Error uploading image:", error);
            alert("Error al subir la imagen.");
        } finally {
            setIsUploading(false);
        }
    };

    const addLineItem = () => setLineItems(prev => [...prev, { ingredientId: null, nombre: '', cantidad: 0, unidad: 'ml' }]);
    
    const updateLineItem = (index: number, field: keyof IngredientLineItem, value: any) => {
        const items = [...lineItems];
        if (field === 'ingredientId') {
            const selected = allIngredients.find(i => i.id === value);
            items[index] = { ...items[index], ingredientId: value, nombre: selected?.nombre || '', unidad: selected?.standardUnit || 'ml' };
        } else {
            items[index] = { ...items[index], [field]: value };
        }
        setLineItems(items);
    };

    const removeLineItem = (index: number) => setLineItems(prev => prev.filter((_, i) => i !== index));

    const calculateCost = React.useCallback(() => {
        return lineItems.reduce((total, item) => {
            const ingredient = allIngredients.find(i => i.id === item.ingredientId);
            if (!ingredient || !ingredient.standardPrice) return total;
            return total + (ingredient.standardPrice * item.cantidad);
        }, 0);
    }, [lineItems, allIngredients]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const dataToSave = { ...recipe, ingredientes: lineItems, costoReceta: calculateCost() };
        if (dataToSave.id) {
            await updateDoc(doc(db, `users/${userId}/grimorio`, dataToSave.id), dataToSave);
        } else {
            await addDoc(collection(db, `users/${userId}/grimorio`), dataToSave);
        }
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={recipe.id ? "Editar Receta" : "Nueva Receta"} size="2xl">
            <form onSubmit={handleSubmit} className="space-y-4">
                {recipe.imageUrl && (
                    <div className="mb-4">
                        <img src={recipe.imageUrl} alt="Vista previa" className="w-full h-48 object-cover rounded-lg" />
                    </div>
                )}
                <div className="text-sm">
                    <label htmlFor="photo-upload" className="font-medium text-gray-700 dark:text-gray-300">Cambiar Foto</label>
                    <Input id="photo-upload" name="photo" type="file" accept="image/*" onChange={handleImageUpload} disabled={isUploading} />
                    {isUploading && <p className="text-xs text-blue-500 mt-1">Subiendo imagen...</p>}
                </div>

                <Input name="nombre" value={recipe.nombre || ''} onChange={handleRecipeChange} placeholder="Nombre de la Receta" required />
                <Input name="categorias" value={recipe.categorias?.join(', ') || ''} onChange={e => setRecipe(r => ({...r, categorias: e.target.value.split(',').map(c => c.trim())}))} placeholder="Categorías (separadas por coma)" />
                <Textarea name="preparacion" value={recipe.preparacion || ''} onChange={handleRecipeChange} placeholder="Preparación" />
                <Textarea name="garnish" value={recipe.garnish || ''} onChange={handleRecipeChange} placeholder="Garnish" />
                
                <div>
                    <h4 className="font-semibold mb-2">Ingredientes</h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                        {lineItems.map((item, index) => (
                            <div key={index} className="grid grid-cols-12 gap-2 items-center">
                                <div className="col-span-6">
                                    <Autocomplete
                                        items={allIngredients}
                                        selectedId={item.ingredientId}
                                        onSelect={(id) => updateLineItem(index, 'ingredientId', id)}
                                        placeholder="Buscar ingrediente..."
                                    />
                                </div>
                                <Input className="col-span-2" type="number" step="0.1" value={item.cantidad} onChange={e => updateLineItem(index, 'cantidad', parseFloat(e.target.value))} placeholder="Cant." />
                                <Select className="col-span-3" value={item.unidad} onChange={e => updateLineItem(index, 'unidad', e.target.value)}>
                                    <option>ml</option><option>g</option><option>und</option>
                                </Select>
                                <Button type="button" variant="ghost" size="icon" onClick={() => removeLineItem(index)} className="col-span-1"><Icon svg={ICONS.trash} className="h-4 w-4"/></Button>
                            </div>
                        ))}
                    </div>
                     <Button type="button" size="sm" variant="outline" onClick={addLineItem} className="mt-2">Añadir Ingrediente</Button>
                </div>

                <div className="flex justify-between items-center pt-4">
                    <p>Costo Total: <span className="font-bold">€{calculateCost().toFixed(2)}</span></p>
                    <Button type="submit">Guardar Receta</Button>
                </div>
            </form>
        </Modal>
    );
};
