import React from 'react';
import ReactDOM from 'react-dom';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Icon } from '../ui/Icon';
import { ICONS } from '../ui/icons';
import { usePizarraStore } from '../../store/pizarraStore';
import { FiltersBar } from './FiltersBar';
import { Firestore } from 'firebase/firestore';
import { Tag } from '../../types';
import { useUI } from '../../context/UIContext';
import { Modal } from '../ui/Modal';
import { Label } from '../ui/Label';

interface PizarronControlsProps {
    searchQuery: string;
    onSearchChange: (value: string) => void;
    filters: any;
    setFilters: (filters: any) => void;
    db: Firestore;
    userId: string;
    tags: Tag[];
    onShowStats: () => void;
    onShowTopIdeas: () => void;
    onShowSmartView: () => void;
    onGlobalSearch: () => void;
}

export const PizarronControls: React.FC<PizarronControlsProps> = ({
    searchQuery, onSearchChange,
    filters, setFilters,
    db, userId, tags,
    onShowStats, onShowTopIdeas, onShowSmartView,
    onGlobalSearch
}) => {
    const { focusMode, toggleFocusMode, automationsEnabled, toggleAutomationsEnabled } = usePizarraStore();
    const { compactMode, toggleCompactMode } = useUI();
    const [showSearch, setShowSearch] = React.useState(false);

    // Modal States
    const [showFocusModal, setShowFocusModal] = React.useState(false);
    const [showAutomationsModal, setShowAutomationsModal] = React.useState(false);

    // Mock states for Focus Customization
    const [focusOptions, setFocusOptions] = React.useState({
        hideSidebars: true,
        onlyMyTasks: true,
        dimBackground: false
    });

    return (
        <div className="h-full flex flex-col bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-white/5 p-2 items-center relative overflow-visible z-40 shadow-sm">
            {/* Gradient Border Overlay */}
            <div className="absolute inset-0 rounded-2xl pointer-events-none border-2 border-transparent" style={{ maskImage: 'linear-gradient(to bottom, black 40%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to bottom, black 40%, transparent 100%)' }}></div>

            {/* Search Top */}
            <div className="mb-6 relative w-full flex justify-center z-50">
                <Button
                    variant="ghost"
                    size="icon"
                    className="w-10 h-10 rounded-xl transition-all text-slate-600 dark:text-slate-400 hover:bg-white/50 hover:text-orange-500"
                    onClick={onGlobalSearch}
                    title="Búsqueda Global"
                >
                    <Icon svg={ICONS.search} className="w-5 h-5" />
                </Button>
            </div>

            {/* Main Tools - Better Distributed */}
            <div className="space-y-4 w-full flex flex-col items-center flex-1 py-4">

                <div className="flex flex-col gap-2 p-2 bg-white/30 dark:bg-slate-800/30 rounded-2xl">
                    <TooltipButton
                        active={focusMode}
                        activeColor="bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                        icon={ICONS.eye}
                        onClick={() => setShowFocusModal(true)}
                        label="Configurar Focus"
                    />
                    <TooltipButton
                        active={automationsEnabled}
                        activeColor="bg-emerald-600 text-white shadow-md shadow-emerald-500/20"
                        icon={ICONS.settings} // Keeping 'settings' icon on button as sidebar usually has settings-like icon for this
                        onClick={() => setShowAutomationsModal(true)}
                        label="Automatizaciones"
                    />
                    <TooltipButton
                        active={compactMode}
                        activeColor="bg-slate-600 text-white"
                        icon={ICONS.slidersHorizontal}
                        onClick={toggleCompactMode}
                        label="Vista Compacta"
                    />
                </div>

                <div className="w-8 h-px bg-slate-200/50 dark:bg-slate-700/50" />

                <div className="flex flex-col gap-3">
                    <TooltipButton
                        active={false}
                        className="hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                        icon={ICONS.sparkles}
                        onClick={onShowTopIdeas}
                        label="Top Ideas"
                    />
                    <TooltipButton
                        active={false}
                        className="hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                        icon={ICONS.trendingUp}
                        onClick={onShowStats}
                        label="Estadísticas"
                    />
                </div>
            </div>

            {/* Bottom High Value Action */}
            <div className="mt-auto pb-4 w-full flex flex-col items-center relative z-40">
                <Button
                    size="icon"
                    className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-xl shadow-orange-500/20 hover:scale-105 transition-all"
                    onClick={onShowSmartView}
                    title="Vista Inteligente AI"
                >
                    <Icon svg={ICONS.activity} className="w-6 h-6" />
                </Button>
                <span className="text-[10px] font-semibold text-slate-400 mt-2">AI View</span>
            </div>

            {/* Modals */}
            {showFocusModal && ReactDOM.createPortal(
                <Modal isOpen={showFocusModal} onClose={() => setShowFocusModal(false)} title="Personalizar Modo Focus">
                    <div className="space-y-6 p-2">
                        <div className="flex items-center justify-between bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${focusMode ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                                    <Icon svg={ICONS.eye} className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 dark:text-slate-100">Activar Modo Focus</h3>
                                    <p className="text-xs text-slate-500">Elimina distracciones y filtra tareas.</p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" checked={focusMode} onChange={toggleFocusMode} />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                            </label>
                        </div>

                        <div className="space-y-3">
                            <Label>Configuración de Visibilidad</Label>
                            <div className="grid gap-3">
                                {['Ocultar Barras Laterales', 'Mostrar solo Mis Tareas', 'Oscurecer Fondo'].map((opt, i) => (
                                    <label key={i} className="flex items-center gap-3 p-3 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition">
                                        <input type="checkbox" defaultChecked className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500" />
                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{opt}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div className="pt-4 flex justify-end">
                            <Button onClick={() => setShowFocusModal(false)}>Listo</Button>
                        </div>
                    </div>
                </Modal>,
                document.body
            )}

            {showAutomationsModal && ReactDOM.createPortal(
                <Modal isOpen={showAutomationsModal} onClose={() => setShowAutomationsModal(false)} title="Centro de Automatizaciones">
                    <div className="space-y-6 p-2 h-[60vh] overflow-y-auto custom-scrollbar">
                        <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-xl border border-emerald-100 dark:border-emerald-800">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${automationsEnabled ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                                    <Icon svg={ICONS.zap} className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 dark:text-slate-100">Motor de Reglas</h3>
                                    <p className="text-xs text-slate-500">Ejecuta acciones basadas en eventos.</p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" checked={automationsEnabled} onChange={toggleAutomationsEnabled} />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 dark:peer-focus:ring-emerald-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-600"></div>
                            </label>
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <Label>Reglas Activas</Label>
                                <Button size="sm" variant="secondary" className="text-xs h-7"><Icon svg={ICONS.plus} className="w-3 h-3 mr-1" /> Nueva Regla</Button>
                            </div>
                            <div className="space-y-3">
                                {[
                                    { name: "Crear Receta en Aprobado", desc: "Cuando una tarea se mueve a 'Aprobado', generar borrador en Recetario.", active: true },
                                    { name: "Asignación Automática", desc: "Si creo una tarea en 'Mis Ideas', asignármela automáticamente.", active: true },
                                    { name: "Notificar Retrasos", desc: "Enviar alerta si la fecha de entrega vence en 24h.", active: false }
                                ].map((rule, idx) => (
                                    <div key={idx} className="flex items-start gap-3 p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800">
                                        <div className="mt-1"><Icon svg={ICONS.gitBranch} className="w-4 h-4 text-slate-400" /></div>
                                        <div className="flex-1">
                                            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{rule.name}</h4>
                                            <p className="text-xs text-slate-500 mt-0.5">{rule.desc}</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" className="sr-only peer" defaultChecked={rule.active} />
                                            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </Modal>,
                document.body
            )}
        </div>
    );
};

const TooltipButton = ({ active, activeColor, icon, onClick, label, className = '' }: any) => (
    <div className="relative group/tooltip flex justify-center">
        <Button
            variant={active ? "default" : "ghost"}
            size="icon"
            onClick={onClick}
            className={`w-10 h-10 rounded-xl transition-all duration-200 ${active ? activeColor : 'text-slate-500 hover:bg-white/80 dark:hover:bg-slate-800/80'} ${className}`}
        >
            <Icon svg={icon} className="h-5 w-5" />
        </Button>
        {/* Tooltip fixed to be visible - high z-index and enough width */}
        <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 opacity-0 group-hover/tooltip:opacity-100 transition-all duration-200 pointer-events-none z-[100]">
            <div className="bg-slate-900/90 backdrop-blur text-white text-xs font-medium px-3 py-1.5 rounded-lg whitespace-nowrap shadow-xl border border-white/10">
                {label}
            </div>
        </div>
    </div>
);
