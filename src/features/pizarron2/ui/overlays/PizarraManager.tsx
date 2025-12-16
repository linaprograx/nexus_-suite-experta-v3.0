import React, { useState, useEffect } from 'react';
import { pizarronStore } from '../../state/store';
import { BOARD_TEMPLATES } from '../../data/BoardTemplates';
import { PizarraMetadata } from '../../engine/types';
import { firestoreAdapter } from '../../sync/firestoreAdapter';
import { TemplateEngine } from '../../engine/TemplateEngine';

// Mock function to simulate creating a Pizarra in backend
// real implementation would go via firestoreAdapter or a service
const createPizarraInBackend = async (templateId: string, title: string): Promise<PizarraMetadata> => {
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
    const [activeTab, setActiveTab] = useState<'my-projects' | 'new-project'>('my-projects');

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
                className="bg-white rounded-2xl shadow-2xl w-[900px] h-[600px] flex overflow-hidden pointer-events-auto animate-in fade-in zoom-in duration-200"
                onClick={e => e.stopPropagation()}
            >
                {/* Sidebar */}
                <div className="w-64 bg-slate-50 border-r border-slate-200 p-6 flex flex-col">
                    <h2 className="text-xl font-bold text-slate-800 mb-6">Pizarra Manager</h2>
                    <div className="space-y-2">
                        <button
                            className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'my-projects' ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:bg-slate-100'}`}
                            onClick={() => setActiveTab('my-projects')}
                        >
                            📁 My Projects
                        </button>
                        <button
                            className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'new-project' ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:bg-slate-100'}`}
                            onClick={() => { setActiveTab('new-project'); setStep('select'); }}
                        >
                            ✨ New Project
                        </button>
                    </div>
                    <div className="flex-1" />
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-sm">Cancel</button>
                </div>

                {/* Content */}
                <div className="flex-1 p-8 overflow-y-auto bg-white">
                    {/* MY PROJECTS TAB */}
                    {activeTab === 'my-projects' && (
                        <div>
                            <h3 className="text-2xl font-bold text-slate-800 mb-2">My Projects</h3>
                            <p className="text-slate-500 mb-8">Manage your saved workspaces.</p>

                            {loading ? (
                                <div className="flex items-center justify-center h-48 text-slate-400">Loading...</div>
                            ) : pizarras.length === 0 ? (
                                <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl">
                                    <p className="text-slate-400 mb-4">No projects found.</p>
                                    <button
                                        onClick={() => setActiveTab('new-project')}
                                        className="text-blue-600 hover:underline"
                                    >
                                        Create your first Project
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-4">
                                    {pizarras.map(p => (
                                        <div
                                            key={p.id}
                                            onClick={() => handleOpen(p)}
                                            className="group relative p-5 rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-md cursor-pointer transition-all"
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="font-bold text-slate-800">{p.title}</h4>
                                                <span className="text-[10px] bg-slate-100 px-2 py-1 rounded text-slate-500">
                                                    {new Date(p.updatedAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500 mb-4 line-clamp-2">{p.description || "No description"}</p>

                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-slate-400">{p.boards.length} Boards</span>
                                            </div>

                                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button className="p-1 hover:bg-slate-100 rounded text-slate-400">⋮</button>
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
                            <h3 className="text-2xl font-bold text-slate-800 mb-2">Choose a Foundation</h3>
                            <p className="text-slate-500 mb-8">Select a specialized structure to jumpstart your project.</p>

                            <div className="grid grid-cols-2 gap-4">
                                {BOARD_TEMPLATES.map(t => (
                                    <div
                                        key={t.id}
                                        onClick={() => setSelectedTemplate(t.id)}
                                        onDoubleClick={() => handleCreate(t.id)}
                                        className={`p-5 rounded-xl border-2 cursor-pointer transition-all hover:shadow-lg active:scale-95 ${selectedTemplate === t.id ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-200' : 'border-slate-200 hover:border-blue-300'}`}
                                        title="Double click to create immediately"
                                    >
                                        <div className="text-4xl mb-3">{t.icon}</div>
                                        <h4 className="font-bold text-slate-800 mb-1">{t.name}</h4>
                                        <p className="text-xs text-slate-500 mb-3">{t.description}</p>
                                        <div className="flex flex-wrap gap-1">
                                            {t.structure.map((s, i) => (
                                                <span key={i} className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[10px] text-slate-500">{s.title}</span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-8 flex justify-end">
                                <button
                                    className="px-6 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={!selectedTemplate}
                                    onClick={() => setStep('details')}
                                >
                                    Next Step &rarr;
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'new-project' && step === 'details' && selectedTemplate && (
                        <div className="max-w-md mx-auto mt-10">
                            <div className="text-center mb-8">
                                <div className="text-6xl mb-4">{BOARD_TEMPLATES.find(t => t.id === selectedTemplate)?.icon}</div>
                                <h3 className="text-2xl font-bold text-slate-800">Name your Project</h3>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Project Title</label>
                                    <input
                                        type="text"
                                        value={pizarraTitle}
                                        onChange={e => setPizarraTitle(e.target.value)}
                                        placeholder="e.g., Summer Menu 2025"
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
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
                                    className="w-full py-2 text-slate-500 hover:text-slate-800 text-sm"
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
