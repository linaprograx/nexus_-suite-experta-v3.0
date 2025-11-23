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
}

export const CreateBoardModal: React.FC<CreateBoardModalProps> = ({ isOpen, onClose, onCreate }) => {
  const [name, setName] = React.useState('');
  const [category, setCategory] = React.useState('general');
  const [themeColor, setThemeColor] = React.useState('#60A5FA');
  const [icon, setIcon] = React.useState('layout');
  const [description, setDescription] = React.useState('');

  const handleSubmit = () => {
    if (!name.trim()) return;
    onCreate({
      name,
      category: category as any,
      themeColor,
      icon,
      description
    });
    onClose();
    // Reset form
    setName('');
    setCategory('general');
    setThemeColor('#60A5FA');
    setIcon('layout');
    setDescription('');
  };

  const colors = ['#FBBF24', '#60A5FA', '#34D399', '#F472B6', '#A78BFA'];
  const icons = ['layout', 'grid', 'list', 'briefcase', 'star', 'heart', 'flag', 'rocket']; // Added some dummy icons if not in ICONS, I should check ICONS. 'briefcase', 'heart', 'flag', 'rocket' might not be in ICONS. I'll stick to existing ones or simple strings.
  // Checking ICONS from environment... 'grid', 'list' (I added list), 'star' exists. 'layout' exists.
  // I'll use keys from ICONS that I know exist or generic ones.
  const availableIcons = ['layout', 'grid', 'list', 'star', 'brain', 'book', 'beaker', 'leaf'];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Crear Nuevo Tablero">
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
             <div className="flex gap-2 mt-2">
                {availableIcons.slice(0, 4).map(ic => (
                    <button 
                        key={ic} 
                        onClick={() => setIcon(ic)}
                        className={`p-2 rounded-md border ${icon === ic ? 'bg-indigo-100 border-indigo-500' : 'border-gray-200 hover:bg-gray-50'}`}
                    >
                        <Icon svg={(ICONS as any)[ic] || ICONS.layout} className="w-4 h-4" />
                    </button>
                ))}
             </div>
          </div>
        </div>

        <div>
            <Label>Color del Tema</Label>
            <div className="flex gap-3 mt-2">
                {colors.map(c => (
                    <button
                        key={c}
                        onClick={() => setThemeColor(c)}
                        className={`w-8 h-8 rounded-full transition-transform hover:scale-110 ${themeColor === c ? 'ring-2 ring-offset-2 ring-gray-400' : ''}`}
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
          <Button onClick={handleSubmit} disabled={!name.trim()}>Crear Tablero</Button>
        </div>
      </div>
    </Modal>
  );
};
