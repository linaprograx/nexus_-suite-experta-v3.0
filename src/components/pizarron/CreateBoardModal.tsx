import React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
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
  const [selectedTools, setSelectedTools] = React.useState<string[]>([]);

  const AVAILABLE_TOOLS = [
    { id: 'cerebrity', name: 'Cerebrity (IA)', icon: 'brain' },
    { id: 'thelab', name: 'The Lab', icon: 'beaker' },
    { id: 'make_menu', name: 'Make Menu', icon: 'menu' },
    { id: 'grimorium', name: 'Grimorium', icon: 'book' },
    { id: 'zero_waste', name: 'Zero Waste Chef', icon: 'leaf' },
    { id: 'costeo', name: 'Excelencia (Costeo)', icon: 'calculator' },
    { id: 'batcher', name: 'Batcher', icon: 'layers' },
    { id: 'stock', name: 'Stock & Inventory', icon: 'box' },
    { id: 'trend_locator', name: 'Trend Locator', icon: 'trending' },
  ];

  React.useEffect(() => {
    if (boardToEdit) {
      setName(boardToEdit.name);
      setCategory(boardToEdit.category);
      setThemeColor(boardToEdit.themeColor);
      setIcon(boardToEdit.icon);
      setDescription(boardToEdit.description || '');
      setSelectedTools(boardToEdit.enabledTools || []);
    } else {
      setName('');
      setCategory('general');
      setThemeColor('#60A5FA');
      setIcon('layout');
      setDescription('');
      setSelectedTools([]);
    }
  }, [boardToEdit, isOpen]);

  const handleToggleTool = (toolId: string) => {
    setSelectedTools(prev =>
      prev.includes(toolId) ? prev.filter(id => id !== toolId) : [...prev, toolId]
    );
  };

  /* eslint-disable @typescript-eslint/no-unused-vars */
  const [isSaving, setIsSaving] = React.useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setIsSaving(true);
    try {
      await onCreate({
        ...(boardToEdit ? { id: boardToEdit.id } : {}),
        name,
        category: category as any,
        themeColor,
        icon,
        description,
        enabledTools: selectedTools,
      });
      // Parent component (PizarronSidebar) usually handles closing, but we ensure button feedback
    } catch (error: any) {
      console.error("Error creating board:", error);
      alert("Error al guardar tablero: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const colors = [
    '#FBBF24', '#60A5FA', '#34D399', '#F472B6', '#A78BFA', '#F97316', '#EF4444', '#8B5CF6',
    '#EC4899', '#D946EF', '#84CC16', '#10B981', '#06B6D4', '#6366F1', '#3B82F6', '#14B8A6',
    '#F59E0B', '#EA580C', '#78716C', '#64748B', '#1E293B', '#FCA5A5', '#FCD34D', '#BEF264'
  ];
  const availableIcons = [
    'layout', 'grid', 'brain', 'book', 'calculator', 'school', 'flask', 'layers', 'box', 'trending', 'star', 'rocket',
    'home', 'briefcase', 'coffee', 'flag', 'map', 'globe', 'music', 'monitor', 'smartphone', 'shield', 'heart',
    'smile', 'award', 'gift', 'bookmark', 'tool', 'database', 'cloud', 'zap', 'activity', 'sparkles', 'calendar', 'clock'
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={
      <span className="font-extrabold text-2xl bg-gradient-to-r from-orange-500 to-amber-600 bg-clip-text text-transparent">
        {boardToEdit ? "Editar Tablero" : "Crear Nuevo Tablero"}
      </span>
    }>
      <div className="space-y-6 px-1 max-h-[70vh] overflow-y-auto custom-scrollbar">
        <div>
          <Label className="text-slate-700 dark:text-slate-300 font-semibold mb-1.5 block">Nombre del Tablero <span className="text-red-500">*</span></Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. Campaña Verano"
            className="h-11 text-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all rounded-xl"
            autoFocus
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-slate-700 dark:text-slate-300 font-semibold">Categoría</Label>
            <Select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-10 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 rounded-xl"
            >
              <option value="general">General</option>
              <option value="creativo">Creativo</option>
              <option value="operativo">Operativo</option>
              <option value="carta">Carta</option>
              <option value="producción">Producción</option>
              <option value="marketing">Marketing</option>
              <option value="finanzas">Finanzas</option>
              <option value="rrhh">RRHH</option>
            </Select>
            <p className="text-xs text-slate-500 ml-1">Organiza tus tableros por áreas.</p>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-700 dark:text-slate-300 font-semibold">Icono Identificativo</Label>
            <div className="grid grid-cols-6 gap-2 h-[140px] overflow-y-auto p-2 custom-scrollbar border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-800/50">
              {availableIcons.map(ic => (
                <button
                  key={ic}
                  onClick={() => setIcon(ic)}
                  className={`aspect-square rounded-lg flex justify-center items-center transition-all duration-200 hover:scale-105 ${icon === ic ? 'bg-gradient-to-br from-orange-400 to-amber-500 text-white shadow-md shadow-orange-500/30' : 'text-slate-500 hover:bg-white hover:shadow-sm dark:hover:bg-slate-700'}`}
                  title={ic}
                >
                  <Icon svg={(ICONS as any)[ic] || ICONS.layout} className="w-5 h-5" />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-slate-700 dark:text-slate-300 font-semibold flex items-center justify-between">
            Color del Tema
            <span className="text-xs font-normal text-slate-500" style={{ color: themeColor }}>Vista Previa</span>
          </Label>
          <div className="grid grid-cols-8 sm:grid-cols-10 md:grid-cols-12 gap-3 h-[100px] overflow-y-auto p-3 custom-scrollbar border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-800/50">
            {colors.map(c => (
              <button
                key={c}
                onClick={() => setThemeColor(c)}
                className={`w-8 h-8 rounded-full transition-all duration-300 hover:scale-110 shadow-sm flex items-center justify-center ${themeColor === c ? 'ring-2 ring-offset-2 ring-slate-400 scale-110 shadow-md' : 'hover:shadow'}`}
                style={{ backgroundColor: c }}
              >
                {themeColor === c && <Icon svg={ICONS.check} className="w-4 h-4 text-white drop-shadow-md" />}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-slate-700 dark:text-slate-300 font-semibold">Descripción Corta</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="¿Cuál es el objetivo de este tablero?"
            className="min-h-[80px] border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 rounded-xl focus:ring-orange-500/20 focus:border-orange-500"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-slate-700 dark:text-slate-300 font-semibold mb-2 block">Habilidades del Tablero</Label>
          <div className="grid grid-cols-2 gap-3">
            {AVAILABLE_TOOLS.map(tool => (
              <div
                key={tool.id}
                onClick={() => handleToggleTool(tool.id)}
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-200 ${selectedTools.includes(tool.id)
                  ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 shadow-sm'
                  : 'border-slate-200 dark:border-slate-700 hover:border-orange-200 dark:hover:border-orange-800 bg-white dark:bg-slate-800/50'
                  }`}
              >
                <div className={`p-2 rounded-lg ${selectedTools.includes(tool.id) ? 'bg-orange-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}>
                  <Icon svg={(ICONS as any)[tool.icon] || ICONS.sparkles} className="w-5 h-5" />
                </div>
                <span className={`text-sm font-medium ${selectedTools.includes(tool.id) ? 'text-slate-800 dark:text-slate-200' : 'text-slate-500'}`}>
                  {tool.name}
                </span>
                {selectedTools.includes(tool.id) && (
                  <Icon svg={ICONS.check} className="w-4 h-4 text-orange-500 ml-auto" />
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-1">Selecciona las herramientas que estarán activas en este tablero.</p>
        </div>

        <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800 mt-6">
          <Button
            variant="ghost"
            onClick={onClose}
            className="hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 rounded-xl"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!name.trim() || isSaving}
            className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white shadow-lg shadow-orange-500/30 border-0 rounded-xl px-6 font-medium transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-2"
          >
            {isSaving ? <Spinner className="w-5 h-5 border-white" /> : (boardToEdit ? "Guardar Cambios" : "Crear Tablero")}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
