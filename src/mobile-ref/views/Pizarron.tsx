
import React, { useState, useRef } from 'react';
import { PageName, UserProfile, PizarronNode, NodeType } from '../types';
import AnimatedPage from '../components/AnimatedPage';
import NeuCard from '../components/NeuCard';
import NeuButton from '../components/NeuButton';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';

interface Props {
  onNavigate: (page: PageName) => void;
  user?: UserProfile;
  notify: (msg: string, type?: 'success' | 'error' | 'loading') => void;
}

const Pizarron: React.FC<Props> = ({ notify }) => {
  // --- State ---
  const [nodes, setNodes] = useState<PizarronNode[]>([
    { id: '1', type: 'decision', title: 'Summer Cost Strategy', description: 'Maximize margin using local citrus.', status: 'active', priority: 'high', x: 20, y: 80, width: 280, height: 200, color: '#FFFFFF', accent: '#10B981' },
    { id: '2', type: 'idea', title: 'Bergamot Infusion', description: 'Test oils for aroma. Sync w/ Avatar.', status: 'draft', priority: 'medium', x: 60, y: 320, width: 240, height: 180, color: '#fef3c7', accent: '#F59E0B' },
  ]);

  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);

  // Modals
  const [editingNode, setEditingNode] = useState<PizarronNode | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newNodeType, setNewNodeType] = useState<NodeType>('idea');

  const containerRef = useRef<HTMLDivElement>(null);

  // --- Handlers ---
  const handleNodeTap = (node: PizarronNode) => {
    setEditingNode({ ...node }); // Open edit modal with copy
  };

  const saveNodeChanges = () => {
    if (!editingNode) return;
    setNodes(nodes.map(n => n.id === editingNode.id ? editingNode : n));
    setEditingNode(null);
    notify("Changes saved", "success");
  };

  const handleCreate = (title: string) => {
    const newNode: PizarronNode = {
      id: Math.random().toString(36).substr(2, 9),
      type: newNodeType,
      title,
      description: 'New node description...',
      status: 'draft',
      priority: 'medium',
      x: -pan.x + 100,
      y: -pan.y + 200,
      width: 260,
      height: 180,
      color: newNodeType === 'note' ? '#fef3c7' : '#FFFFFF',
      accent: getNodeColor(newNodeType)
    };
    setNodes([...nodes, newNode]);
    setShowCreateModal(false);
    notify("New module anchored", "success");
  };

  // Helper
  const getNodeColor = (type: NodeType) => {
    switch (type) {
      case 'decision': return '#10B981';
      case 'idea': return '#F59E0B';
      case 'task': return '#EF4444';
      default: return '#6366f1';
    }
  };

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

        {/* 2. Sidebar (Persistent, Visible) */}
        <aside className="w-16 bg-white/50 backdrop-blur-xl border-r border-white/40 flex flex-col items-center py-6 gap-4 z-40 shadow-lg">
          <button onClick={() => notify('Tool: Select')} className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shadow-sm active:scale-95"><span className="material-symbols-outlined text-lg">near_me</span></button>
          <button onClick={() => notify('Tool: Pan')} className="w-10 h-10 rounded-xl text-slate-400 hover:text-slate-800 transition-all active:scale-95"><span className="material-symbols-outlined text-lg">back_hand</span></button>
          <div className="h-px w-6 bg-slate-300/50 my-1"></div>
          <button onClick={() => notify('Add Image')} className="w-10 h-10 rounded-xl text-slate-400 hover:text-slate-800 transition-all active:scale-95"><span className="material-symbols-outlined text-lg">image</span></button>
          <button onClick={() => notify('Add Sticky')} className="w-10 h-10 rounded-xl text-slate-400 hover:text-slate-800 transition-all active:scale-95"><span className="material-symbols-outlined text-lg">sticky_note_2</span></button>
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

            {nodes.map(node => (
              <motion.div
                key={node.id}
                className={`absolute rounded-[2rem] p-6 flex flex-col shadow-xl border-2 border-white/60 z-10 active:cursor-grabbing`}
                style={{
                  width: node.width,
                  height: node.height,
                  left: node.x,
                  top: node.y,
                  backgroundColor: node.color
                }}
                onTap={() => handleNodeTap(node)}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex justify-between items-start mb-2 pointer-events-none">
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[8px] font-black uppercase tracking-widest text-slate-500">{node.type}</span>
                  <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: node.accent }}></div>
                </div>
                <h3 className="text-lg font-black text-neu-main leading-tight mb-2 pointer-events-none">{node.title}</h3>
                <p className="text-[10px] text-neu-sec leading-relaxed pointer-events-none">{node.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* 4. Edit Modal */}
      <AnimatePresence>
        {editingNode && (
          <div className="absolute inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center">
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              className="w-full bg-[#EFEEEE] rounded-t-[2.5rem] p-8 shadow-2xl max-h-[85vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-black text-neu-main">Edit Module</h3>
                  <p className="text-[10px] font-black text-neu-sec uppercase tracking-widest">{editingNode.id}</p>
                </div>
                <div className="flex gap-2">
                  <NeuButton onClick={() => setEditingNode(null)} className="w-10 h-10 rounded-xl text-neu-sec"><span className="material-symbols-outlined">close</span></NeuButton>
                </div>
              </div>

              <div className="space-y-4 mb-8">
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
                    <NeuButton className="w-full py-4 text-rose-500 font-black uppercase text-[10px]" onClick={() => notify("Delete functionality placeholder")}>
                      Delete
                    </NeuButton>
                  </div>
                </div>
              </div>

              <NeuButton onClick={saveNodeChanges} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] shadow-lg shadow-indigo-200">
                Save Changes
              </NeuButton>
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
              className="w-full bg-[#EFEEEE] rounded-t-[2.5rem] p-8 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-black text-neu-main">New Module</h3>
                <NeuButton onClick={() => setShowCreateModal(false)} className="w-10 h-10 rounded-xl text-neu-sec"><span className="material-symbols-outlined">close</span></NeuButton>
              </div>

              <div className="grid grid-cols-4 gap-2 mb-8">
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

              <input
                type="text"
                placeholder="Title..."
                className="w-full neu-pressed p-5 rounded-2xl text-lg font-bold text-neu-main outline-none mb-6"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleCreate((e.target as HTMLInputElement).value)}
              />

              <NeuButton onClick={() => handleCreate("New Module")} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-[0.2em]">
                Anchor
              </NeuButton>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </AnimatedPage>
  );
};

export default Pizarron;
