import React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Textarea } from '../ui/Textarea';
import { Select } from '../ui/Select';
import { Icon } from '../ui/Icon';
import { ICONS } from '../ui/icons';
import { PizarronBoard } from '../../types';

interface CreateBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (boardData: Partial<PizarronBoard>) => void;
  boardToEdit?: PizarronBoard | null;
}

export const CreateBoardModal: React.FC<CreateBoardModalProps> = ({ isOpen, onClose, onCreate, boardToEdit }) => {
  const [name, setName] = React.useState('');
  const [category, setCategory] = React.useState('general');
  const [themeColor, setThemeColor] = React.useState('#60A5FA');
  const [icon, setIcon] = React.useState('layout');
  const [description, setDescription] = React.useState('');

  React.useEffect(() => {
    if (boardToEdit) {
      setName(boardToEdit.name);
      setCategory(boardToEdit.category);
      setThemeColor(boardToEdit.themeColor);
      setIcon(boardToEdit.icon);
      setDescription(boardToEdit.description || '');
    } else {
      setName('');
      setCategory('general');
      setThemeColor('#60A5FA');
      setIcon('layout');
      setDescription('');
    }
  }, [boardToEdit, isOpen]);

  const handleSubmit = () => {
    if (!name.trim()) return;
    onCreate({
      ...(boardToEdit ? { id: boardToEdit.id } : {}),
      name,
      category: category as any,
      themeColor,
      icon,
      description
    });
    // onClose is handled by parent usually, but we can call it if parent doesn't auto-close
    // actually parent closes on onCreate success usually. But here we can safe-guard.
  };

  const colors = ['#FBBF24', '#60A5FA', '#34D399', '#F472B6', '#A78BFA', '#F97316', '#EF4444', '#8B5CF6'];
  const availableIcons = ['layout', 'grid', 'brain', 'book', 'calculator', 'school', 'flask', 'layers', 'box', 'trending', 'star', 'rocket'];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={boardToEdit ? "Editar Tablero" : "Crear Nuevo Tablero"}>
      <div className="space-y-4">
        <div>
          <Label>Nombre del Tablero *</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Campaña Verano" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Categoría</Label>
            <Select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="general">General</option>
              <option value="creativo">Creativo</option>
              <option value="operativo">Operativo</option>
              <option value="carta">Carta</option>
              <option value="producción">Producción</option>
            </Select>
          </div>
          <div>
            <Label>Icono</Label>
            <div className="grid grid-cols-4 gap-2 mt-2 max-h-32 overflow-y-auto p-1">
              {availableIcons.map(ic => (
                <button
                  key={ic}
                  onClick={() => setIcon(ic)}
                  className={`p-2 rounded-md border flex justify-center items-center transition-all ${icon === ic ? 'bg-indigo-100 border-indigo-500 shadow-sm ring-1 ring-indigo-500' : 'border-gray-200 hover:bg-gray-50'}`}
                  title={ic}
                >
                  <Icon svg={(ICONS as any)[ic] || ICONS.layout} className="w-5 h-5 text-slate-600" />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <Label>Color del Tema</Label>
          <div className="flex flex-wrap gap-3 mt-2">
            {colors.map(c => (
              <button
                key={c}
                onClick={() => setThemeColor(c)}
                className={`w-8 h-8 rounded-full transition-transform hover:scale-110 shadow-sm ${themeColor === c ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        <div>
          <Label>Descripción Corta</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="¿Cuál es el objetivo de este tablero?" />
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={!name.trim()}>{boardToEdit ? "Guardar Cambios" : "Crear Tablero"}</Button>
        </div>
      </div>
    </Modal>
  );
};
