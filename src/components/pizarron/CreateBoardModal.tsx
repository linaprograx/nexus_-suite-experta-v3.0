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
    <Modal isOpen={isOpen} onClose={onClose} size="4xl" title={
      <span className="font-extrabold text-2xl bg-gradient-to-r from-orange-500 to-amber-600 bg-clip-text text-transparent">
        {boardToEdit ? "Editar Tablero" : "Diseñar Nuevo Tablero"}
      </span>
    }>
      <div className="flex flex-col md:flex-row h-[70vh] overflow-hidden rounded-xl border border-slate-100 dark:border-slate-800">

        {/* LEFT COLUMN: BASIC SETTINGS (Narrower) */}
        <div className="w-full md:w-[320px] bg-slate-50 dark:bg-slate-900/50 p-6 overflow-y-auto custom-scrollbar border-r border-slate-100 dark:border-slate-800 flex flex-col gap-6">

          <div>
            <Label className="text-slate-700 dark:text-slate-300 font-bold mb-2 block">Identidad</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre del tablero"
              className="mb-4 bg-white dark:bg-slate-800"
              autoFocus
            />
            <Select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="bg-white dark:bg-slate-800"
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
          </div>

          <div>
            <Label className="text-slate-700 dark:text-slate-300 font-bold mb-2 block">Icono</Label>
            <div className="grid grid-cols-5 gap-2 bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 h-32 overflow-y-auto custom-scrollbar">
              {availableIcons.map(ic => (
                <button
                  key={ic}
                  onClick={() => setIcon(ic)}
                  className={`aspect-square rounded flex justify-center items-center transition-all hover:bg-slate-100 dark:hover:bg-slate-700 ${icon === ic ? 'bg-orange-100 text-orange-600 ring-2 ring-orange-500' : 'text-slate-400'}`}
                >
                  <Icon svg={(ICONS as any)[ic] || ICONS.layout} className="w-5 h-5" />
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-slate-700 dark:text-slate-300 font-bold mb-2 block">Color</Label>
            <div className="flex flex-wrap gap-2">
              {colors.slice(0, 12).map(c => (
                <button
                  key={c}
                  onClick={() => setThemeColor(c)}
                  className={`w-6 h-6 rounded-full ${themeColor === c ? 'ring-2 ring-offset-1 ring-slate-400' : ''}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="flex-1"></div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
            <Button
              onClick={handleSubmit}
              disabled={!name.trim() || isSaving}
              className="w-full bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white shadow-lg shadow-orange-500/30"
            >
              {isSaving ? <Spinner className="w-5 h-5 border-white" /> : (boardToEdit ? "Guardar" : "Crear Ahora")}
            </Button>
          </div>

        </div>

        {/* RIGHT COLUMN: PREVIEW & TOOLS (Wider) */}
        <div className="flex-1 bg-white dark:bg-slate-900 p-8 overflow-y-auto custom-scrollbar flex flex-col">

          <div className="mb-8 p-6 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border border-slate-100 dark:border-slate-700 flex items-center gap-6 shadow-sm">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-white shadow-xl" style={{ backgroundColor: themeColor }}>
              <Icon svg={(ICONS as any)[icon] || ICONS.layout} className="w-10 h-10" />
            </div>
            <div>
              <h2 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 mb-1">{name || "Nuevo Tablero"}</h2>
              <p className="text-slate-500 text-lg">{description || "Visualiza tus proyectos y organiza tus ideas con potencia."}</p>
            </div>
          </div>

          <div className="mb-6">
            <Label className="text-slate-700 dark:text-slate-300 font-bold mb-2 block">Descripción Detallada</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe el propósito de este tablero..."
              className="resize-none bg-slate-50 dark:bg-slate-800/50 border-0 rounded-xl"
            />
          </div>

          <div>
            <Label className="text-slate-700 dark:text-slate-300 font-bold mb-4 block flex items-center gap-2">
              <Icon svg={ICONS.zap} className="w-5 h-5 text-amber-500" /> Power Tools & Integrations
            </Label>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {AVAILABLE_TOOLS.map(tool => (
                <div
                  key={tool.id}
                  onClick={() => handleToggleTool(tool.id)}
                  className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 group ${selectedTools.includes(tool.id)
                      ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-900/10'
                      : 'border-slate-100 dark:border-slate-800 hover:border-orange-200 dark:hover:border-slate-600 bg-white dark:bg-slate-800'
                    }`}
                >
                  <div className={`p-3 rounded-lg inline-flex mb-3 ${selectedTools.includes(tool.id) ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}>
                    <Icon svg={(ICONS as any)[tool.icon] || ICONS.sparkles} className="w-6 h-6" />
                  </div>
                  <h4 className={`font-bold ${selectedTools.includes(tool.id) ? 'text-slate-900 dark:text-slate-100' : 'text-slate-600 dark:text-slate-400'}`}>{tool.name}</h4>
                  {selectedTools.includes(tool.id) && (
                    <div className="absolute top-3 right-3 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white shadow-md">
                      <Icon svg={ICONS.check} className="w-3 h-3" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </Modal>
  );
};
