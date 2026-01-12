import React, { useState, useRef, useEffect } from 'react';
import { PageName, UserProfile, PizarronNode, NodeType, PizarronTask } from '../types';
import AnimatedPage from '../components/AnimatedPage';
import NeuCard from '../components/NeuCard';
import NeuButton from '../components/NeuButton';
import { motion, AnimatePresence } from 'framer-motion';
import { usePizarronData } from '../../../hooks/usePizarronData';
import { useRecipes } from '../../../hooks/useRecipes';
import { useIngredients } from '../../../hooks/useIngredients';
import { useApp } from '../../../context/AppContext';
import { addDoc, collection, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';

interface Props {
    onNavigate: (page: PageName) => void;
    user?: UserProfile;
    notify?: (msg: string, type?: 'success' | 'error' | 'loading') => void;
}

const Pizarron: React.FC<Props> = ({ notify }) => {
    const { tasks: realTasks, activeBoardId } = usePizarronData();
    const { db, appId, userId } = useApp();
    const { recipes } = useRecipes();
    const { ingredients } = useIngredients();

    // Map real tasks to nodes
    const nodes: PizarronNode[] = realTasks.map(t => ({
        id: t.id,
        type: (t.type as NodeType) || 'idea',
        title: t.title || t.texto || 'Untitled',
        description: t.description || t.content || '',
        status: t.status as any || 'draft',
        priority: t.priority as any || 'medium',
        x: t.position?.x || Math.random() * 200,
        y: t.position?.y || Math.random() * 400,
        width: t.width || 260,
        height: t.height || 180,
        color: t.style?.backgroundColor || (t.type === 'note' ? '#fef3c7' : '#FFFFFF'),
        accent: getNodeColor((t.type as NodeType) || 'idea')
    }));

    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);

    // Modals & Selection
    const [editingNode, setEditingNode] = useState<PizarronNode | null>(null);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [activeTool, setActiveTool] = useState('select');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showLibraryModal, setShowLibraryModal] = useState(false);
    const [showGrimorioModal, setShowGrimorioModal] = useState(false);
    const [showBoardsModal, setShowBoardsModal] = useState(false);
    const [libraryTab, setLibraryTab] = useState<'shapes' | 'stickers'>('shapes');
    const [grimorioTab, setGrimorioTab] = useState<'recipes' | 'ingredients'>('recipes');
    const [newNodeType, setNewNodeType] = useState<NodeType>('idea');
    const [newDescription, setNewDescription] = useState('');

    const containerRef = useRef<HTMLDivElement>(null);

    // --- Handlers ---
    const handleNodeTap = (node: PizarronNode) => {
        if (selectedNodeId === node.id) {
            setEditingNode({ ...node }); // Edit on second tap
        } else {
            setSelectedNodeId(node.id); // Select on first tap
        }
    };

    // Clear selection on canvas tap
    const handleCanvasTap = (e: any) => {
        // Simple check to ensure we aren't tapping a node (event bubbling should handled but just in case)
        if (e.target === e.currentTarget) {
            setSelectedNodeId(null);
        }
    };

    const saveNodeChanges = async () => {
        if (!editingNode || !db || !appId) return;

        try {
            const taskRef = doc(db, `artifacts/${appId}/public/data/pizarron-tasks`, editingNode.id);
            await updateDoc(taskRef, {
                title: editingNode.title,
                description: editingNode.description,
                type: editingNode.type,
                style: { ...editingNode.color ? { backgroundColor: editingNode.color } : {} }
            });
            notify?.("Changes saved", "success");
            setEditingNode(null);
        } catch (e) {
            console.error(e);
            notify?.("Error saving changes", "error");
        }
    };

    const handleCreate = async (title: string) => {
        if (!db || !appId) return;

        try {
            const newTask: Partial<PizarronTask> = {
                title,
                description: newDescription || 'New module description...',
                type: newNodeType,
                status: 'draft',
                priority: 'medium',
                position: { x: -pan.x + 100, y: -pan.y + 200 },
                width: 260,
                height: 180,
                style: {
                    backgroundColor: newNodeType === 'note' ? '#fef3c7' : '#FFFFFF'
                },
                boardId: activeBoardId || 'general',
                createdAt: serverTimestamp(),
                authorName: userId || 'Unknown'
            };

            await addDoc(collection(db, `artifacts/${appId}/public/data/pizarron-tasks`), newTask);

            setShowCreateModal(false);
            setNewDescription(''); // Reset
            notify?.("New module anchored", "success");
        } catch (e) {
            console.error(e);
            notify?.("Error creating module", "error");
        }
    };

    // Helper
    function getNodeColor(type: NodeType) {
        switch (type) {
            case 'decision': return '#10B981';
            case 'idea': return '#F59E0B';
            case 'task': return '#EF4444';
            default: return '#6366f1';
        }
    };

    // --- Tool Handlers ---

    const handleGrimorioAdd = async (item: any, type: 'recipe' | 'ingredient') => {
        if (!db || !appId) return;
        try {
            const newTask: Partial<PizarronTask> = {
                title: item.nombre || 'Untitled',
                description: type === 'recipe' ? (item.instrucciones || item.storytelling || 'No description') : `Stock: ${item.stock || 0} ${item.unidad || 'units'}`,
                type: type === 'recipe' ? 'recipe' : 'task', // Ingredients map to Tasks
                content: item.id,
                status: 'active',
                position: { x: -pan.x + 150 + (Math.random() * 50), y: -pan.y + 300 + (Math.random() * 50) },
                width: 260,
                height: 180,
                style: { backgroundColor: type === 'recipe' ? '#e0e7ff' : '#cffafe' },
                boardId: activeBoardId || 'general',
                createdAt: serverTimestamp(),
                authorName: userId || 'Unknown'
            };
            await addDoc(collection(db, `artifacts/${appId}/public/data/pizarron-tasks`), newTask);
            setShowGrimorioModal(false);
            notify?.(`${type === 'recipe' ? 'Recipe' : 'Ingredient'} anchored`, "success");
        } catch (e) {
            console.error(e);
            notify?.("Error anchoring item", "error");
        }
    };

    const handleLibraryAdd = async (type: 'shape' | 'sticker', content: string, style?: any) => {
        if (!db || !appId) return;
        try {
            const newTask: Partial<PizarronTask> = {
                title: type === 'sticker' ? content : 'Shape',
                description: '',
                type: type,
                content: content, // 'circle' | 'square' | 'triangle' OR emoji
                status: 'active',
                position: { x: -pan.x + 150 + (Math.random() * 50), y: -pan.y + 300 + (Math.random() * 50) },
                width: type === 'sticker' ? 100 : 200,
                height: type === 'sticker' ? 100 : 200,
                style: style || {}, // spread custom style
                boardId: activeBoardId || 'general',
                createdAt: serverTimestamp(),
                authorName: userId || 'Unknown'
            };
            await addDoc(collection(db, `artifacts/${appId}/public/data/pizarron-tasks`), newTask);
            setShowLibraryModal(false);
            notify?.(`${type === 'sticker' ? 'Sticker' : 'Shape'} added`, "success");
        } catch (e) {
            console.error(e);
            notify?.("Error adding item", "error");
        }
    };

    const handleAddImage = async () => {
        const url = window.prompt("Enter Image URL:");
        if (!url || !db || !appId) return;

        try {
            const newTask: Partial<PizarronTask> = {
                title: 'Image',
                description: '',
                type: 'image',
                content: url, // Storing URL in content
                status: 'draft',
                priority: 'medium',
                position: { x: -pan.x + 150, y: -pan.y + 300 },
                width: 200,
                height: 200,
                style: { backgroundColor: 'transparent' },
                boardId: activeBoardId || 'general',
                createdAt: serverTimestamp(),
                authorName: userId || 'Unknown'
            };
            await addDoc(collection(db, `artifacts/${appId}/public/data/pizarron-tasks`), newTask);
            notify?.("Image added", "success");
        } catch (e) {
            console.error(e);
            notify?.("Error adding image", "error");
        }
    };

    const handleDeleteNode = async () => {
        if (!selectedNodeId || !db || !appId) return;

        if (!window.confirm("Are you sure you want to delete this module?")) return;

        try {
            await deleteDoc(doc(db, `artifacts/${appId}/public/data/pizarron-tasks`, selectedNodeId));
            notify?.("Module deleted", "success");
            setSelectedNodeId(null);
            setEditingNode(null);
        } catch (e) {
            console.error(e);
            notify?.("Error deleting module", "error");
        }
    };

    const tools = [
        { id: 'select', icon: 'near_me', label: 'Select' },
        { id: 'pan', icon: 'back_hand', label: 'Pan' },
        { id: 'sep1', type: 'separator' },
        { id: 'library', icon: 'shapes', label: 'Library', action: () => setShowLibraryModal(true) },
        { id: 'image', icon: 'image', label: 'Image', action: handleAddImage },
        { id: 'sep2', type: 'separator' },
        { id: 'boards', icon: 'grid_view', label: 'Pizarras', action: () => setShowBoardsModal(true) },
        { id: 'grimorio', icon: 'local_dining', label: 'Grimorio', action: () => setShowGrimorioModal(true) },
        { id: 'sep3', type: 'separator' },
        { id: 'delete', icon: 'delete', label: 'Delete' },
    ];



    return (
        <AnimatedPage className="bg-[#EFEEEE] relative overflow-hidden flex flex-col h-full">
            {/* 1. Header Tools */}
            <header className="px-6 py-4 flex justify-between items-center z-50 bg-[#EFEEEE]/90 backdrop-blur-md border-b border-white/40 shadow-sm">
                <div className="flex gap-2">
                    <NeuButton onClick={() => setZoom(Math.max(0.5, zoom - 0.1))} className="w-10 h-10 rounded-xl" variant="flat"><span className="material-symbols-outlined">remove</span></NeuButton>
                    <div className="flex items-center justify-center w-12 text-xs font-black text-neu-sec">{Math.round(zoom * 100)}%</div>
                    <NeuButton onClick={() => setZoom(Math.min(1.5, zoom + 0.1))} className="w-10 h-10 rounded-xl" variant="flat"><span className="material-symbols-outlined">add</span></NeuButton>
                </div>
                <NeuButton onClick={() => setShowCreateModal(true)} className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-200">
                    <span className="material-symbols-outlined text-sm mr-2">add</span> Anchor
                </NeuButton>
            </header>

            <div className="flex-1 relative flex overflow-hidden">

                {/* 2. Sidebar (Mobile Left Rail) - Glassmorphism Strip */}
                <aside className="absolute left-4 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-2 p-2 rounded-2xl bg-white/40 backdrop-blur-xl border border-white/50 shadow-2xl transition-all duration-300">
                    {tools.map((tool, i) => {
                        if (tool.type === 'separator') return <div key={`sep-${i}`} className="h-px w-6 bg-slate-300/50 mx-auto my-1" />;

                        const isActive = activeTool === tool.id;
                        return (
                            <button
                                key={tool.id}
                                onClick={() => {
                                    if (tool.action) tool.action();
                                    else {
                                        setActiveTool(tool.id);
                                        if (tool.id === 'delete' && editingNode) handleDeleteNode();
                                        else if (['library', 'boards', 'grimorio'].includes(tool.id)) notify?.(`${tool.label} modal coming soon`, 'loading');
                                    }
                                }}
                                className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200 ${isActive
                                    ? 'bg-orange-50 text-orange-600 border border-orange-200 shadow-sm scale-110'
                                    : 'text-slate-500 hover:bg-white/60 hover:text-slate-700 hover:scale-105'
                                    }`}
                            >
                                <span className="material-symbols-outlined text-xl">{tool.icon}</span>
                            </button>
                        );
                    })}
                </aside>

                {/* 3. Infinite Canvas */}
                <div className="flex-1 relative overflow-hidden touch-none" ref={containerRef}>
                    <motion.div
                        className="absolute inset-0 origin-top-left"
                        drag
                        dragConstraints={containerRef}
                        dragElastic={0.1}
                        onDragEnd={(e, info) => setPan({ x: pan.x + info.offset.x, y: pan.y + info.offset.y })}
                        animate={{ x: pan.x, y: pan.y, scale: zoom }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    >
                        {/* Background Grid */}
                        <div className="absolute inset-[-1000%] opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#3E4E5E 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

                        {nodes.map(node => {
                            const isSelected = selectedNodeId === node.id;
                            return (
                                <motion.div
                                    key={node.id}
                                    className={`absolute rounded-[2rem] p-6 flex flex-col shadow-xl z-10 active:cursor-grabbing transition-shadow duration-300
                                        ${isSelected ? 'ring-4 ring-indigo-500/50 shadow-2xl scale-[1.02]' : 'border-2 border-white/60'}
                                    `}
                                    style={{
                                        width: node.width,
                                        height: node.height,
                                        left: node.x,
                                        top: node.y,
                                        backgroundColor: node.color
                                    }}
                                    onTap={(e) => { e.stopPropagation(); handleNodeTap(node); }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    {node.type === 'shape' ? (
                                        <div className="w-full h-full" style={{
                                            backgroundColor: node.color,
                                            borderRadius: node.description === 'circle' ? '50%' : node.description === 'triangle' ? '0' : '0',
                                            clipPath: node.description === 'triangle' ? 'polygon(50% 0%, 0% 100%, 100% 100%)' : undefined
                                        }}>
                                            {/* Hide text for shapes */}
                                        </div>
                                    ) : node.type === 'sticker' ? (
                                        <div className="w-full h-full flex items-center justify-center text-[5rem]">
                                            {node.description}
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex justify-between items-start mb-2 pointer-events-none">
                                                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[8px] font-black uppercase tracking-widest text-slate-500">{node.type}</span>
                                                <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: node.accent }}></div>
                                            </div>
                                            <h3 className="text-lg font-black text-neu-main leading-tight mb-2 pointer-events-none">{node.title}</h3>
                                            <p className="text-[10px] text-neu-sec leading-relaxed pointer-events-none">{node.description}</p>
                                        </>
                                    )}
                                </motion.div>
                            );
                        })}
                    </motion.div>
                </div>
            </div>

            {/* 4. Edit Modal */}
            <AnimatePresence>
                {editingNode && (
                    <div className="absolute inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center">
                        <motion.div
                            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                            className="w-full bg-[#EFEEEE] rounded-t-[2.5rem] shadow-2xl max-h-[85vh] flex flex-col"
                        >
                            <div className="p-8 flex-shrink-0">
                                <div className="flex justify-between items-center mb-6">
                                    <div>
                                        <h3 className="text-xl font-black text-neu-main">Edit Module</h3>
                                        <p className="text-[10px] font-black text-neu-sec uppercase tracking-widest">{editingNode.id}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <NeuButton onClick={() => setEditingNode(null)} className="w-10 h-10 rounded-xl text-neu-sec"><span className="material-symbols-outlined">close</span></NeuButton>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-scroll px-8" style={{ maxHeight: 'calc(85vh - 200px)' }}>
                                <div className="space-y-4 mb-6">
                                    <div>
                                        <label className="text-[9px] font-black text-neu-sec uppercase tracking-widest ml-2 mb-1 block">Title</label>
                                        <input
                                            value={editingNode.title}
                                            onChange={(e) => setEditingNode({ ...editingNode, title: e.target.value })}
                                            className="w-full neu-pressed p-4 rounded-xl text-sm font-bold text-neu-main"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-black text-neu-sec uppercase tracking-widest ml-2 mb-1 block">Description</label>
                                        <textarea
                                            value={editingNode.description}
                                            onChange={(e) => setEditingNode({ ...editingNode, description: e.target.value })}
                                            className="w-full neu-pressed p-4 rounded-xl text-sm font-medium text-neu-sec h-24 resize-none"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[9px] font-black text-neu-sec uppercase tracking-widest ml-2 mb-1 block">Color</label>
                                            <input
                                                type="color"
                                                value={editingNode.color}
                                                onChange={(e) => setEditingNode({ ...editingNode, color: e.target.value })}
                                                className="w-full h-12 rounded-xl border-none outline-none"
                                            />
                                        </div>
                                        <div className="flex items-end">
                                            <NeuButton className="w-full py-4 text-rose-500 font-black uppercase text-[10px]" onClick={async () => {
                                                if (window.confirm("Delete this module?")) {
                                                    if (!db || !appId) return;
                                                    await deleteDoc(doc(db, `artifacts/${appId}/public/data/pizarron-tasks`, editingNode.id));
                                                    setEditingNode(null);
                                                    notify?.("Deleted", "success");
                                                }
                                            }}>
                                                Delete
                                            </NeuButton>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 flex-shrink-0">
                                <NeuButton onClick={saveNodeChanges} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] shadow-lg shadow-indigo-200">
                                    Save Changes
                                </NeuButton>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* 5. Creation Modal (reused logic) */}
            <AnimatePresence>
                {showCreateModal && (
                    <div className="absolute inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center">
                        <motion.div
                            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                            className="w-full bg-[#EFEEEE] rounded-t-[2.5rem] p-8 shadow-2xl max-h-[85vh] overflow-y-auto"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-black text-neu-main">New Module</h3>
                                <NeuButton onClick={() => setShowCreateModal(false)} className="w-10 h-10 rounded-xl text-neu-sec"><span className="material-symbols-outlined">close</span></NeuButton>
                            </div>

                            <div className="grid grid-cols-4 gap-2 mb-6">
                                {['idea', 'task', 'decision', 'note'].map(type => (
                                    <button
                                        key={type}
                                        onClick={() => setNewNodeType(type as NodeType)}
                                        className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all
                                        ${newNodeType === type ? 'border-indigo-500 bg-indigo-50/50' : 'border-transparent hover:bg-white/50'}`}
                                    >
                                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                                            <span className="material-symbols-outlined text-lg opacity-70">
                                                {type === 'idea' ? 'tips_and_updates' : type === 'task' ? 'check_circle' : type === 'decision' ? 'alt_route' : 'sticky_note_2'}
                                            </span>
                                        </div>
                                    </button>
                                ))}
                            </div>

                            <div className="space-y-4 mb-6">
                                <input
                                    type="text"
                                    placeholder="Title..."
                                    className="w-full neu-pressed p-5 rounded-2xl text-lg font-bold text-neu-main outline-none"
                                    autoFocus
                                    onKeyDown={(e) => e.key === 'Enter' && handleCreate((e.target as HTMLInputElement).value)}
                                />
                                <textarea
                                    placeholder="Description (optional)..."
                                    value={newDescription}
                                    onChange={(e) => setNewDescription(e.target.value)}
                                    className="w-full neu-pressed p-5 rounded-2xl text-sm font-medium text-neu-sec outline-none h-24 resize-none"
                                />
                            </div>

                            <NeuButton onClick={() => handleCreate(document.querySelector<HTMLInputElement>('input[placeholder="Title..."]')?.value || "New Module")} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-[0.2em]">
                                Anchor
                            </NeuButton>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* 6. Library Modal */}
            <AnimatePresence>
                {showLibraryModal && (
                    <div className="absolute inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center">
                        <motion.div
                            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                            className="w-full bg-[#EFEEEE] rounded-t-[2.5rem] p-8 shadow-2xl h-[60vh] flex flex-col"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-black text-neu-main">Library</h3>
                                <NeuButton onClick={() => setShowLibraryModal(false)} className="w-10 h-10 rounded-xl text-neu-sec"><span className="material-symbols-outlined">close</span></NeuButton>
                            </div>

                            {/* Tabs */}
                            <div className="flex gap-4 mb-6 border-b border-gray-300 pb-2">
                                {['shapes', 'stickers'].map(tab => (
                                    <button
                                        key={tab}
                                        onClick={() => setLibraryTab(tab as any)}
                                        className={`pb-2 text-sm font-black uppercase tracking-widest transition-colors ${libraryTab === tab ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400'}`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>

                            <div className="flex-1 overflow-y-auto w-full">
                                {libraryTab === 'shapes' ? (
                                    <div className="grid grid-cols-3 gap-4">
                                        {/* Shapes Grid */}
                                        {[
                                            { id: 'square', color: '#6366f1', radius: '0' },
                                            { id: 'circle', color: '#ec4899', radius: '50%' },
                                            { id: 'triangle', color: '#10b981', radius: '0', clip: 'polygon(50% 0%, 0% 100%, 100% 100%)' },
                                            { id: 'rect-rounded', color: '#f59e0b', radius: '1rem' },
                                        ].map(shape => (
                                            <button
                                                key={shape.id}
                                                onClick={() => handleLibraryAdd('shape', shape.id, {
                                                    backgroundColor: shape.color,
                                                    borderRadius: shape.radius,
                                                    clipPath: shape.clip
                                                })}
                                                className="aspect-square bg-slate-100 rounded-2xl flex items-center justify-center shadow-sm hover:shadow-md transition-shadow"
                                            >
                                                <div
                                                    className="w-16 h-16"
                                                    style={{
                                                        backgroundColor: shape.color,
                                                        borderRadius: shape.radius,
                                                        clipPath: shape.clip
                                                    }}
                                                />
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-5 gap-3">
                                        {/* Stickers Grid */}
                                        {['🔥', '✅', '❌', '❤️', '👍', '👎', '🎉', '💡', '🚀', '⚠️', '⭐', '✔️', '👀', '🧠', '💼'].map(emoji => (
                                            <button
                                                key={emoji}
                                                onClick={() => handleLibraryAdd('sticker', emoji, { backgroundColor: 'transparent' })}
                                                className="aspect-square bg-white rounded-xl flex items-center justify-center text-3xl shadow-sm hover:scale-110 transition-transform"
                                            >
                                                {emoji}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* 7. Grimorio Modal */}
            <AnimatePresence>
                {showGrimorioModal && (
                    <div className="absolute inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center">
                        <motion.div
                            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                            className="w-full bg-[#EFEEEE] rounded-t-[2.5rem] p-8 shadow-2xl h-[70vh] flex flex-col"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-black text-neu-main">Grimorio</h3>
                                <NeuButton onClick={() => setShowGrimorioModal(false)} className="w-10 h-10 rounded-xl text-neu-sec"><span className="material-symbols-outlined">close</span></NeuButton>
                            </div>

                            {/* Tabs */}
                            <div className="flex gap-4 mb-6 border-b border-gray-300 pb-2">
                                {['recipes', 'ingredients'].map(tab => (
                                    <button
                                        key={tab}
                                        onClick={() => setGrimorioTab(tab as any)}
                                        className={`pb-2 text-sm font-black uppercase tracking-widest transition-colors ${grimorioTab === tab ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400'}`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>

                            <div className="flex-1 overflow-y-auto w-full space-y-3">
                                {grimorioTab === 'recipes' ? (
                                    (recipes || []).length > 0 ? (recipes.map(recipe => (
                                        <div
                                            key={recipe.id}
                                            onClick={() => handleGrimorioAdd(recipe, 'recipe')}
                                            className="p-4 bg-white rounded-xl shadow-sm border border-slate-100 flex justify-between items-center active:bg-indigo-50 transition-colors"
                                        >
                                            <div>
                                                <h4 className="font-bold text-slate-800">{recipe.nombre}</h4>
                                                <p className="text-[10px] text-slate-500">{recipe.categorias?.[0] || 'General'}</p>
                                            </div>
                                            <span className="material-symbols-outlined text-indigo-400">add_circle</span>
                                        </div>
                                    ))) : <p className="text-center text-slate-400 py-10">No recipes found.</p>
                                ) : (
                                    (ingredients || []).length > 0 ? (ingredients.map(ing => (
                                        <div
                                            key={ing.id}
                                            onClick={() => handleGrimorioAdd(ing, 'ingredient')}
                                            className="p-4 bg-white rounded-xl shadow-sm border border-slate-100 flex justify-between items-center active:bg-cyan-50 transition-colors"
                                        >
                                            <div>
                                                <h4 className="font-bold text-slate-800">{ing.nombre}</h4>
                                                <p className="text-[10px] text-slate-500">Stock: {ing.stock || 0} {ing.unidad}</p>
                                            </div>
                                            <span className="material-symbols-outlined text-cyan-400">add_circle</span>
                                        </div>
                                    ))) : <p className="text-center text-slate-400 py-10">No ingredients found.</p>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* 8. Board Switcher Modal */}
            <AnimatePresence>
                {showBoardsModal && (
                    <div className="absolute inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center">
                        <motion.div
                            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                            className="w-full bg-[#EFEEEE] rounded-t-[2.5rem] p-8 shadow-2xl h-[50vh] flex flex-col"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-black text-neu-main">Switch Board</h3>
                                <NeuButton onClick={() => setShowBoardsModal(false)} className="w-10 h-10 rounded-xl text-neu-sec"><span className="material-symbols-outlined">close</span></NeuButton>
                            </div>

                            <div className="flex-1 overflow-y-auto w-full space-y-3">
                                {[
                                    { id: 'general', name: 'General', color: '#6366f1', icon: 'dashboard' },
                                    { id: 'creativo', name: 'Creativo', color: '#f59e0b', icon: 'lightbulb' },
                                    { id: 'operativo', name: 'Operativo', color: '#10b981', icon: 'settings' },
                                    { id: 'carta', name: 'Carta', color: '#ec4899', icon: 'restaurant_menu' }
                                ].map(board => (
                                    <button
                                        key={board.id}
                                        onClick={() => {
                                            // TODO: Real switch board logic when Context supports it
                                            notify?.(`Switched to ${board.name}`, "success");
                                            setShowBoardsModal(false);
                                        }}
                                        className={`w-full p-4 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center gap-4 active:scale-95 transition-transform ${activeBoardId === board.id ? 'ring-2 ring-indigo-500' : ''}`}
                                    >
                                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: board.color }}>
                                            <span className="material-symbols-outlined">{board.icon}</span>
                                        </div>
                                        <div className="text-left">
                                            <h4 className="font-bold text-slate-800">{board.name}</h4>
                                            <p className="text-[10px] text-slate-500">Board ID: {board.id}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>


        </AnimatedPage >
    );
};

export default Pizarron;
