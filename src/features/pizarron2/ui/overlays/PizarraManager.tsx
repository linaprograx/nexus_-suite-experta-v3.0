import React, { useState, useEffect } from 'react';
import { pizarronStore } from '../../state/store';
import { BOARD_TEMPLATES } from '../../data/BoardTemplates';
import { PizarraMetadata } from '../../engine/types';
import { firestoreAdapter } from '../../sync/firestoreAdapter';
import { TemplateEngine } from '../../engine/TemplateEngine';
import { LuLayoutDashboard, LuPlus, LuFolder, LuDownload, LuLayoutTemplate, LuSearch, LuX, LuClock } from 'react-icons/lu';

// Mock function to simulate creating a Pizarra in backend
const createPizarraInBackend = async (templateId: string, title: string): Promise<PizarraMetadata> => {
    // Handle Empty Template Special Case
    if (templateId === 't-empty') {
        return {
            id: crypto.randomUUID(),
            title: title || 'Nueva Pizarra',
            ownerId: 'current-user-id',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            lastOpenedAt: Date.now(),
            isArchived: false,
            canvasState: { viewport: { x: 0, y: 0, zoom: 1 } },
            boards: [{ id: crypto.randomUUID(), title: 'Tablero 1', type: 'board', order: 0 }]
        };
    }

    const template = BOARD_TEMPLATES.find(t => t.id === templateId);
    if (!template) throw new Error("Template not found");

    const newBoards = template.structure.map((item, i) => ({
        id: crypto.randomUUID(),
        title: item.title,
        type: item.type,
        order: i
    }));

    return {
        id: crypto.randomUUID(),
        title: title || template.name,
        ownerId: 'current-user-id',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        lastOpenedAt: Date.now(),
        isArchived: false,
        canvasState: {
            viewport: { x: 0, y: 0, zoom: 1 }
        },
        boards: newBoards
    };
};

export const PizarraManager: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    // Navigation
    const [activeTab, setActiveTab] = useState<'history' | 'my-projects' | 'new-project' | 'my-templates' | 'imports'>('history');

    // Helper for random color generation
    const stringToColor = (str: string) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
        return '#' + '00000'.substring(0, 6 - c.length) + c;
    };

    // New Project State
    const [step, setStep] = useState<'select' | 'details'>('select');
    const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
    const [pizarraTitle, setPizarraTitle] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    // My Projects State
    const [pizarras, setPizarras] = useState<PizarraMetadata[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Handle Escape Key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    // Initial Load
    useEffect(() => {
        // Load projects if needed (History also needs projects to filter)
        if (activeTab === 'my-projects' || activeTab === 'history') {
            loadProjects();
        }
    }, [activeTab]);

    const loadProjects = async () => {
        setLoading(true);
        try {
            const list = await firestoreAdapter.listPizarras();
            setPizarras(list);
        } catch (e) {
            console.error("Failed to load projects", e);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (templateIdOverride?: string) => {
        const tid = (typeof templateIdOverride === 'string' ? templateIdOverride : selectedTemplate);
        if (!tid) return;
        setIsCreating(true);
        try {
            // 1. Create Metadata
            const metadata = await createPizarraInBackend(tid, pizarraTitle);

            // 2. Generate Template Content (Nodes)
            const nodes = TemplateEngine.generateLayout(tid, metadata);

            // 3. Persist (Metadata + Nodes)
            await firestoreAdapter.createPizarraFromTemplate(metadata, nodes);

            // 4. Set Active Pizarra in Store
            pizarronStore.setActivePizarra(metadata);

            // 5. VISUAL FEEDBACK: Reset Board & Load Content
            pizarronStore.resetBoard();

            // Immediate local injection (faster than waiting for sync)
            nodes.forEach(n => pizarronStore.addNode(n));

            // 6. Auto-Fit View
            setTimeout(() => {
                pizarronStore.fitContent();
            }, 100);

            // Close
            onClose();
        } catch (e) {
            console.error(e);
        } finally {
            setIsCreating(false);
        }
    };

    const handleOpen = (metadata: PizarraMetadata) => {
        // Update Last Opened
        // firestoreAdapter.updatePizarra(metadata.id, { lastOpenedAt: Date.now() }); // Optimistic

        pizarronStore.setActivePizarra(metadata);
        pizarronStore.resetBoard(); // Clear previous
        onClose();
    };

    const filteredPizarras = pizarras.filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase()));

    // Sort for History
    const recentPizarras = [...pizarras].sort((a, b) => (b.lastOpenedAt || 0) - (a.lastOpenedAt || 0)).slice(0, 4);

    return (
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-auto"
            onClick={onClose}
        >
            <div
                className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-[900px] h-[600px] flex overflow-hidden pointer-events-auto animate-in fade-in zoom-in duration-200 border border-slate-200 dark:border-slate-800"
                onClick={e => e.stopPropagation()}
            >
                {/* Sidebar */}
                <div className="w-64 bg-slate-50 dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 p-4 flex flex-col">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6 px-2 flex items-center gap-2">
                        <LuLayoutDashboard className="text-blue-600" />
                        Pizarras
                    </h2>
                    <div className="space-y-1">
                        <button
                            className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-3 ${activeTab === 'history' ? 'bg-white dark:bg-slate-800 shadow-sm text-blue-700 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                            onClick={() => setActiveTab('history')}
                        >
                            <LuClock size={18} />
                            Historial
                        </button>
                        {/* 'Mis Pizarras' hidden from direct nav, accessible via Historial 'View All' */}
                        <button
                            className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-3 ${activeTab === 'new-project' ? 'bg-white dark:bg-slate-800 shadow-sm text-blue-700 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                            onClick={() => { setActiveTab('new-project'); setStep('select'); }}
                        >
                            <LuPlus size={18} />
                            Nueva Pizarra
                        </button>
                        <button
                            className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-3 ${activeTab === 'my-templates' ? 'bg-white dark:bg-slate-800 shadow-sm text-blue-700 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                            onClick={() => setActiveTab('my-templates')}
                        >
                            <LuLayoutTemplate size={18} />
                            Mis Plantillas
                        </button>
                        <button
                            className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-3 ${activeTab === 'imports' ? 'bg-white dark:bg-slate-800 shadow-sm text-blue-700 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                            onClick={() => setActiveTab('imports')}
                        >
                            <LuDownload size={18} />
                            Importaciones
                        </button>
                    </div>
                    <div className="flex-1" />
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm flex items-center gap-2 px-3 py-2">
                        <LuX size={16} /> Cerrar
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 p-8 overflow-y-auto bg-white dark:bg-slate-900 custom-scrollbar relative">
                    {/* Header Effect */}
                    <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-white dark:from-slate-900 to-transparent pointer-events-none z-10" />

                    {/* HISTORY TAB */}
                    {activeTab === 'history' && (
                        <div className="relative z-0">
                            <div className="mb-6">
                                <h3 className="text-2xl font-bold text-slate-800 dark:text-white">Historial Reciente</h3>
                                <p className="text-slate-500 dark:text-slate-400 text-sm">Continúa donde lo dejaste.</p>
                            </div>

                            {loading ? (
                                <div className="flex items-center justify-center h-64 text-slate-400">Cargando...</div>
                            ) : recentPizarras.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50/50 dark:bg-slate-800/30">
                                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4 text-slate-400">
                                        <LuClock size={32} />
                                    </div>
                                    <p className="text-slate-500 dark:text-slate-400 font-medium mb-2">No tienes actividad reciente</p>
                                    <button
                                        onClick={() => setActiveTab('new-project')}
                                        className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium text-sm flex items-center gap-1"
                                    >
                                        Crear nueva pizarra <LuPlus size={14} />
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-6">
                                    {recentPizarras.map(p => (
                                        <div
                                            key={p.id}
                                            onClick={() => handleOpen(p)}
                                            className="group relative flex rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-lg cursor-pointer transition-all overflow-hidden bg-white dark:bg-slate-800 h-40"
                                        >
                                            {/* Thumbnail (Left) */}
                                            <div className="w-40 bg-slate-100 dark:bg-slate-700 relative overflow-hidden flex-shrink-0">
                                                <div
                                                    className="w-full h-full opacity-40 transition-transform group-hover:scale-105 duration-500"
                                                    style={{ backgroundImage: `linear-gradient(135deg, ${stringToColor(p.id)} 0%, #1e293b 100%)` }}
                                                />
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <div className="w-12 h-16 bg-white dark:bg-slate-600 rounded shadow-sm border border-slate-200 dark:border-slate-500 transform rotate-3" />
                                                </div>
                                            </div>

                                            <div className="p-4 flex flex-col flex-1">
                                                <h4 className="font-bold text-slate-800 dark:text-white truncate text-lg mb-1">{p.title}</h4>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-auto">
                                                    Abierto hace {Math.floor((Date.now() - (p.lastOpenedAt || 0)) / (1000 * 60 * 60 * 24))} días
                                                </p>
                                                <div className="mt-auto flex items-center justify-between">
                                                    <span className="text-[10px] bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded font-medium">
                                                        Continuar editando
                                                    </span>
                                                    <span className="text-slate-300 dark:text-slate-600">
                                                        <LuClock size={14} />
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800">
                                <button onClick={() => setActiveTab('my-projects')} className="text-sm text-slate-500 hover:text-blue-600 font-medium flex items-center gap-1">
                                    Ver todas mis pizarras &rarr;
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'my-projects' && (
                        <div className="relative z-0">
                            <div className="flex justify-between items-end mb-6">
                                <div>
                                    <h3 className="text-2xl font-bold text-slate-800 dark:text-white">Mis Pizarras</h3>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm">Gestiona tus espacios de trabajo y proyectos.</p>
                                </div>
                                <div className="relative">
                                    <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input
                                        type="text"
                                        placeholder="Buscar..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                                    />
                                </div>
                            </div>

                            {loading ? (
                                <div className="flex items-center justify-center h-64 text-slate-400">Cargando pizarras...</div>
                            ) : filteredPizarras.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50/50 dark:bg-slate-800/30">
                                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4 text-slate-400">
                                        <LuFolder size={32} />
                                    </div>
                                    <p className="text-slate-500 dark:text-slate-400 font-medium mb-2">{searchQuery ? 'No se encontraron resultados' : 'Tu espacio está vacío'}</p>
                                    {!searchQuery && (
                                        <button
                                            onClick={() => setActiveTab('new-project')}
                                            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium text-sm flex items-center gap-1"
                                        >
                                            Crear nueva pizarra <LuPlus size={14} />
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="grid grid-cols-3 gap-6">
                                    {/* Add New Card */}
                                    <div
                                        onClick={() => { setActiveTab('new-project'); setStep('select'); }}
                                        className="group h-48 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl flex flex-col items-center justify-center bg-transparent hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 cursor-pointer transition-all"
                                    >
                                        <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 flex items-center justify-center text-slate-400 group-hover:text-blue-600 transition-colors">
                                            <LuPlus size={24} />
                                        </div>
                                        <span className="mt-3 text-sm font-medium text-slate-500 group-hover:text-blue-600 dark:text-slate-400 dark:group-hover:text-blue-400">Nueva Pizarra</span>
                                    </div>

                                    {filteredPizarras.map(p => (
                                        <div
                                            key={p.id}
                                            onClick={() => handleOpen(p)}
                                            className="group relative flex flex-col rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-lg cursor-pointer transition-all overflow-hidden bg-white dark:bg-slate-800 h-64"
                                        >
                                            {/* Minimalist Thumbnail */}
                                            <div className="h-40 bg-slate-100 dark:bg-slate-700 relative overflow-hidden">
                                                <div
                                                    className="w-full h-full opacity-40 transition-transform group-hover:scale-105 duration-500"
                                                    style={{
                                                        backgroundImage: `linear-gradient(135deg, ${stringToColor(p.id)} 0%, #1e293b 100%)`
                                                    }}
                                                />
                                                {/* Mini Boards representation */}
                                                <div className="absolute inset-0 p-6 flex gap-3 items-center justify-center opacity-80">
                                                    {p.boards?.slice(0, 2).map((b, i) => (
                                                        <div key={i} className="w-16 h-20 bg-white dark:bg-slate-600 rounded-lg shadow-sm border border-slate-200 dark:border-slate-500 transform rotate-3" />
                                                    ))}
                                                </div>
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                                            </div>

                                            <div className="p-4 flex flex-col flex-1">
                                                <div className="flex justify-between items-start mb-1">
                                                    <h4 className="font-bold text-slate-800 dark:text-white truncate flex-1 pr-2 text-sm">{p.title}</h4>
                                                    <span className="text-[10px] bg-slate-50 dark:bg-slate-700 px-2 py-0.5 rounded-full text-slate-400 dark:text-slate-300 whitespace-nowrap">
                                                        {new Date(p.updatedAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <div className="mt-auto flex items-center gap-2">
                                                    <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 rounded">
                                                        <LuLayoutDashboard size={10} /> {p.boards?.length || 0} Tableros
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* NEW PROJECT TAB */}
                    {activeTab === 'new-project' && step === 'select' && (
                        <div className="relative z-0 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="mb-6">
                                <h3 className="text-2xl font-bold text-slate-800 dark:text-white">Nueva Pizarra</h3>
                                <p className="text-slate-500 dark:text-slate-400 text-sm">Selecciona una estructura base o comienza desde cero.</p>
                            </div>

                            <div className="grid grid-cols-3 gap-5">
                                {/* BLANK BOARD OPTION (Manual) */}
                                <div
                                    onClick={() => handleCreate('t-empty')}
                                    className={`p-6 rounded-xl border-2 cursor-pointer transition-all hover:shadow-lg active:scale-95 border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 bg-white dark:bg-slate-800 flex flex-col items-center text-center group`}
                                >
                                    <div className="w-16 h-16 bg-slate-50 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        <div className="w-10 h-10 border-2 border-dashed border-slate-300 dark:border-slate-500 rounded-lg"></div>
                                    </div>
                                    <h4 className="font-bold text-slate-800 dark:text-white mb-1">Pizarra Vacía</h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 px-2">Lienzo infinito en blanco para libertad total.</p>
                                    <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">Básico</span>
                                </div>

                                {BOARD_TEMPLATES.map(t => (
                                    <div
                                        key={t.id}
                                        onClick={() => setSelectedTemplate(t.id)}
                                        onDoubleClick={() => handleCreate(t.id)}
                                        className={`p-6 rounded-xl border-2 cursor-pointer transition-all hover:shadow-lg active:scale-95 flex flex-col items-center text-center group ${selectedTemplate === t.id ? 'border-blue-500 bg-blue-50/30 dark:bg-blue-900/10 ring-1 ring-blue-500' : 'border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 bg-white dark:bg-slate-800'}`}
                                    >
                                        <div className="text-5xl mb-4 group-hover:scale-110 transition-transform drop-shadow-sm">{t.icon}</div>
                                        <h4 className="font-bold text-slate-800 dark:text-white mb-1">{t.name}</h4>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 px-2 line-clamp-2">{t.description}</p>
                                        <div className="flex flex-wrap justify-center gap-1 mt-auto">
                                            {t.structure.slice(0, 2).map((s, i) => (
                                                <span key={i} className="px-2 py-0.5 bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded text-[9px] text-slate-500 dark:text-slate-300 uppercase font-semibold tracking-wide">{s.title.slice(0, 10)}</span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-8 flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20 active:scale-95 transition-all flex items-center gap-2"
                                    disabled={!selectedTemplate}
                                    onClick={() => setStep('details')}
                                >
                                    Configurar <LuPlus size={16} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* MIS PLANTILLAS TAB */}
                    {activeTab === 'my-templates' && (
                        <div>
                            <div className="mb-6">
                                <h3 className="text-2xl font-bold text-slate-800 dark:text-white">Mis Plantillas</h3>
                                <p className="text-slate-500 dark:text-slate-400 text-sm">Biblioteca de estructuras personalizadas.</p>
                            </div>
                            <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50/50 dark:bg-slate-800/30">
                                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4 text-slate-400">
                                    <LuLayoutTemplate size={32} />
                                </div>
                                <h4 className="text-slate-800 dark:text-white font-medium mb-1">Tu colección está vacía</h4>
                                <p className="text-xs text-slate-400 max-w-sm text-center mx-auto px-6">
                                    Puedes guardar cualquier estructura como plantilla desde el panel de Inspector en una Pizarra activa.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* IMPORTACIONES TAB */}
                    {activeTab === 'imports' && (
                        <div>
                            <div className="mb-6">
                                <h3 className="text-2xl font-bold text-slate-800 dark:text-white">Importaciones</h3>
                                <p className="text-slate-500 dark:text-slate-400 text-sm">Trae tus diseños de otras plataformas.</p>
                            </div>

                            <div className="grid grid-cols-2 gap-6 mb-8">
                                <button className="p-8 border border-slate-200 dark:border-slate-700 rounded-2xl hover:border-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all flex flex-col items-center gap-4 group bg-white dark:bg-slate-800">
                                    <div className="w-14 h-14 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300 flex items-center justify-center text-2xl font-bold">C</div>
                                    <span className="font-semibold text-slate-700 dark:text-slate-200 group-hover:text-purple-700 dark:group-hover:text-purple-300">Importar de Canva</span>
                                </button>
                                <button className="p-8 border border-slate-200 dark:border-slate-700 rounded-2xl hover:border-yellow-300 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-all flex flex-col items-center gap-4 group bg-white dark:bg-slate-800">
                                    <div className="w-14 h-14 rounded-full bg-yellow-100 dark:bg-yellow-900/50 text-yellow-600 dark:text-yellow-300 flex items-center justify-center text-2xl font-bold">M</div>
                                    <span className="font-semibold text-slate-700 dark:text-slate-200 group-hover:text-yellow-700 dark:group-hover:text-yellow-300">Importar de Miro</span>
                                </button>
                            </div>

                            <div className="bg-blue-50 dark:bg-blue-900/20 p-5 rounded-xl border border-blue-100 dark:border-blue-800 text-sm text-blue-800 dark:text-blue-300 flex gap-3">
                                <div className="mt-1"><LuDownload size={16} /></div>
                                <div>
                                    <strong>Importación Inteligente:</strong> Al importar, Pizarrón creará una pizarra gemela e identificará automáticamente formas, gráficos y estructuras para guardarlas en tu biblioteca.
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'new-project' && step === 'details' && selectedTemplate && (
                        <div className="max-w-md mx-auto mt-12 animate-in fade-in slide-in-from-right-8 duration-300">
                            <div className="text-center mb-8">
                                <div className="text-6xl mb-4 inline-block drop-shadow-md">{BOARD_TEMPLATES.find(t => t.id === selectedTemplate)?.icon}</div>
                                <h3 className="text-2xl font-bold text-slate-800 dark:text-white">Nombre de la Pizarra</h3>
                                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Dale una identidad a tu nuevo espacio de trabajo.</p>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-2 tracking-wide">Título</label>
                                    <input
                                        type="text"
                                        value={pizarraTitle}
                                        onChange={e => setPizarraTitle(e.target.value)}
                                        placeholder="Ej: Estrategia Q3 2025"
                                        className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm"
                                        autoFocus
                                    />
                                </div>

                                <button
                                    className="w-full py-3.5 bg-blue-600 text-white rounded-lg font-bold shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center gap-2"
                                    onClick={() => handleCreate()}
                                    disabled={isCreating}
                                >
                                    {isCreating ? <span className="animate-pulse">Creando...</span> : <span>Lanzar Pizarra 🚀</span>}
                                </button>

                                <button
                                    className="w-full py-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 text-sm"
                                    onClick={() => setStep('select')}
                                >
                                    &larr; Volver a Plantillas
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
