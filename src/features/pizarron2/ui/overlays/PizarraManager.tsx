import React, { useState, useEffect } from 'react';
import { pizarronStore } from '../../state/store';
import { BOARD_TEMPLATES } from '../../data/BoardTemplates';
import { PizarraMetadata } from '../../engine/types';
import { firestoreAdapter } from '../../sync/firestoreAdapter';
import { TemplateEngine } from '../../engine/TemplateEngine';

// Mock function to simulate creating a Pizarra in backend
// real implementation would go via firestoreAdapter or a service
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
            boards: [{ id: crypto.randomUUID(), title: 'Board 1', type: 'board', order: 0 }]
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

    // In a real app, we'd batch write these blank boards to Firestore here
    // For now, we return the metadata so the frontend 'thinks' they exist

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
    const [activeTab, setActiveTab] = useState<'my-projects' | 'new-project' | 'my-templates' | 'imports'>('my-projects');

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
        if (activeTab === 'my-projects') {
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
        pizarronStore.setActivePizarra(metadata);
        pizarronStore.resetBoard(); // Clear previous
        // TODO: In a real implementation, we'd fetch the nodes for this board here or trigger re-sync
        onClose();
    };

    return (
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-auto"
            onClick={onClose} // Backdrop Click
        >
            <div
                className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-[900px] h-[600px] flex overflow-hidden pointer-events-auto animate-in fade-in zoom-in duration-200"
                onClick={e => e.stopPropagation()}
            >
                {/* Sidebar */}
                <div className="w-64 bg-slate-50 dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 p-6 flex flex-col">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6">Pizarra Manager</h2>
                    <div className="space-y-2">
                        <button
                            className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'my-projects' ? 'bg-blue-100/50 text-blue-700 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                            onClick={() => setActiveTab('my-projects')}
                        >
                            📁 Mis Pizarras
                        </button>
                        <button
                            className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'new-project' ? 'bg-blue-100/50 text-blue-700 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                            onClick={() => { setActiveTab('new-project'); setStep('select'); }}
                        >
                            ✨ Nueva Pizarra
                        </button>
                        <button
                            className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'my-templates' ? 'bg-blue-100/50 text-blue-700 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                            onClick={() => setActiveTab('my-templates')}
                        >
                            🧩 Mis Plantillas
                        </button>
                        <button
                            className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'imports' ? 'bg-blue-100/50 text-blue-700 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                            onClick={() => setActiveTab('imports')}
                        >
                            📥 Importaciones
                        </button>
                    </div>
                    <div className="flex-1" />
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm">Cancel</button>
                </div>

                {/* Content */}
                <div className="flex-1 p-8 overflow-y-auto bg-white dark:bg-slate-900 custom-scrollbar">
                    {activeTab === 'my-projects' && (
                        <div>
                            <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Mis Pizarras</h3>
                            <p className="text-slate-500 dark:text-slate-400 mb-8">Administra tus espacios de trabajo guardados.</p>

                            {loading ? (
                                <div className="flex items-center justify-center h-48 text-slate-400">Cargando...</div>
                            ) : pizarras.length === 0 ? (
                                <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                                    <p className="text-slate-400 mb-4">No se encontraron pizarras.</p>
                                    <button
                                        onClick={() => setActiveTab('new-project')}
                                        className="text-blue-600 hover:underline dark:text-blue-400"
                                    >
                                        Crear mi primera Pizarra
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-4">
                                    {pizarras.map(p => (
                                        <div
                                            key={p.id}
                                            onClick={() => handleOpen(p)}
                                            className="group relative flex flex-col rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md cursor-pointer transition-all overflow-hidden bg-white dark:bg-slate-800"
                                        >
                                            {/* Thumbnail Area */}
                                            <div className="h-32 bg-slate-100 dark:bg-slate-700 relative overflow-hidden">
                                                {/* Placeholder for real thumbnail - using a generated pattern based on ID for distinctiveness */}
                                                <div
                                                    className="w-full h-full opacity-50"
                                                    style={{
                                                        backgroundImage: `linear-gradient(135deg, ${stringToColor(p.id)} 0%, #1e293b 100%)`
                                                    }}
                                                />
                                                {/* Boards Mini-preview (Abstract) */}
                                                <div className="absolute inset-0 p-4 flex gap-2 items-center justify-center">
                                                    {p.boards.slice(0, 3).map((b, i) => (
                                                        <div key={i} className="w-12 h-16 bg-white/80 dark:bg-slate-600/80 rounded shadow-sm border border-slate-200 dark:border-slate-500" style={{ transform: `rotate(${(i - 1) * 5}deg)` }} />
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="p-4">
                                                <div className="flex justify-between items-start mb-1">
                                                    <h4 className="font-bold text-slate-800 dark:text-white truncate pr-2">{p.title}</h4>
                                                    <span className="text-[10px] bg-slate-50 dark:bg-slate-700 px-2 py-1 rounded text-slate-400 dark:text-slate-300 whitespace-nowrap">
                                                        {new Date(p.updatedAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-400 dark:text-slate-500 mb-3 line-clamp-1">{p.description || "Sin descripción"}</p>

                                                <div className="flex items-center justify-between mt-auto">
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded font-medium">
                                                            {p.boards.length} Boards
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button className="p-1.5 bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-700 rounded-full text-slate-400 hover:text-red-500 shadow-sm backdrop-blur-sm">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* NEW PROJECT TAB */}
                    {activeTab === 'new-project' && step === 'select' && (
                        <div>
                            <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Selecciona una Base</h3>
                            <p className="text-slate-500 dark:text-slate-400 mb-8">Elige una estructura especializada para iniciar tu pizarra.</p>

                            <div className="grid grid-cols-2 gap-4">
                                {/* BLANK BOARD OPTION (Manual) */}
                                <div
                                    onClick={() => handleCreate('t-empty')}
                                    className={`p-5 rounded-xl border-2 cursor-pointer transition-all hover:shadow-lg active:scale-95 border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-500 bg-white dark:bg-slate-800`}
                                    title="Crear pizarra vacía"
                                >
                                    <div className="text-4xl mb-3">⬜</div>
                                    <h4 className="font-bold text-slate-800 dark:text-white mb-1">Pizarra Vacía</h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Lienzo en blanco para libertad total.</p>
                                    <div className="flex flex-wrap gap-1">
                                        <span className="px-2 py-0.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-[10px] text-slate-500 dark:text-slate-300">Basic</span>
                                    </div>
                                </div>

                                {BOARD_TEMPLATES.map(t => (
                                    <div
                                        key={t.id}
                                        onClick={() => setSelectedTemplate(t.id)}
                                        onDoubleClick={() => handleCreate(t.id)}
                                        className={`p-5 rounded-xl border-2 cursor-pointer transition-all hover:shadow-lg active:scale-95 ${selectedTemplate === t.id ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 ring-2 ring-blue-200 dark:ring-blue-800' : 'border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-500 bg-white dark:bg-slate-800'}`}
                                        title="Doble click para crear inmediatamente"
                                    >
                                        <div className="text-4xl mb-3">{t.icon}</div>
                                        <h4 className="font-bold text-slate-800 dark:text-white mb-1">{t.name}</h4>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">{t.description}</p>
                                        <div className="flex flex-wrap gap-1">
                                            {t.structure.map((s, i) => (
                                                <span key={i} className="px-2 py-0.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-[10px] text-slate-500 dark:text-slate-300">{s.title}</span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-8 flex justify-end">
                                <button
                                    className="px-6 py-2 bg-slate-900 dark:bg-blue-600 text-white rounded-lg font-medium hover:bg-slate-800 dark:hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={!selectedTemplate}
                                    onClick={() => setStep('details')}
                                >
                                    Siguiente &rarr;
                                </button>
                            </div>
                        </div>
                    )}

                    {/* MIS PLANTILLAS TAB */}
                    {activeTab === 'my-templates' && (
                        <div>
                            <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Mis Plantillas</h3>
                            <p className="text-slate-500 dark:text-slate-400 mb-8">Estructuras reutilizables guardadas de tus pizarras.</p>
                            <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-800/30">
                                <div className="text-4xl mb-4">🧩</div>
                                <h4 className="text-slate-800 dark:text-white font-medium mb-1">Tu colección está vacía</h4>
                                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                                    Puedes guardar cualquier estructura como plantilla desde el panel de Inspector en una Pizarra activa.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* IMPORTACIONES TAB */}
                    {activeTab === 'imports' && (
                        <div>
                            <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Importaciones</h3>
                            <p className="text-slate-500 dark:text-slate-400 mb-8">Trae tus diseños de otras plataformas.</p>

                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <button className="p-6 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all flex flex-col items-center gap-3 group bg-white dark:bg-slate-800">
                                    <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300 flex items-center justify-center text-xl font-bold">C</div>
                                    <span className="font-semibold text-slate-700 dark:text-slate-200 group-hover:text-purple-700 dark:group-hover:text-purple-300">Importar de Canva</span>
                                </button>
                                <button className="p-6 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-yellow-300 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-all flex flex-col items-center gap-3 group bg-white dark:bg-slate-800">
                                    <div className="w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900/50 text-yellow-600 dark:text-yellow-300 flex items-center justify-center text-xl font-bold">M</div>
                                    <span className="font-semibold text-slate-700 dark:text-slate-200 group-hover:text-yellow-700 dark:group-hover:text-yellow-300">Importar de Miro</span>
                                </button>
                            </div>

                            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800 text-sm text-blue-800 dark:text-blue-300">
                                <strong>Nota:</strong> Al importar, Pizarrón creará una pizarra gemela e identificará automáticamente formas, gráficos y estructuras para guardarlas en tu biblioteca.
                            </div>
                        </div>
                    )}

                    {activeTab === 'new-project' && step === 'details' && selectedTemplate && (
                        <div className="max-w-md mx-auto mt-10">
                            <div className="text-center mb-8">
                                <div className="text-6xl mb-4">{BOARD_TEMPLATES.find(t => t.id === selectedTemplate)?.icon}</div>
                                <h3 className="text-2xl font-bold text-slate-800 dark:text-white">Name your Project</h3>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Project Title</label>
                                    <input
                                        type="text"
                                        value={pizarraTitle}
                                        onChange={e => setPizarraTitle(e.target.value)}
                                        placeholder="e.g., Summer Menu 2025"
                                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
                                        autoFocus
                                    />
                                </div>

                                <button
                                    className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold shadow-lg hover:bg-blue-700 transition-transform active:scale-95 flex items-center justify-center space-x-2"
                                    onClick={() => handleCreate()}
                                    disabled={isCreating}
                                >
                                    {isCreating ? <span>Creating...</span> : <span>Launch Pizarra 🚀</span>}
                                </button>

                                <button
                                    className="w-full py-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 text-sm"
                                    onClick={() => setStep('select')}
                                >
                                    &larr; Back to Templates
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
