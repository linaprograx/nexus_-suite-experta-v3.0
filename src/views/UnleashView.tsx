import React from 'react';
import CsaXView from './unleash/CsaXView';
import LctProView from './unleash/LctProView';
import OcrMasterView from './unleash/OcrMasterView';

interface UnleashViewProps { }

const UnleashView: React.FC<UnleashViewProps> = () => {
  const [activeTab, setActiveTab] = React.useState<'csa-x' | 'lct-pro' | 'ocr-master'>('csa-x');

  // Vertical gradient as requested: Top color -> Bottom transparent/dark
  // Using to-slate-950/0 or just letting it fade into the main background
  const backgroundClass = activeTab === 'csa-x'
    ? "bg-gradient-to-b from-[#1a1b3a] to-transparent"
    : (activeTab === 'lct-pro' ? "bg-gradient-to-b from-[#083344] to-transparent" : "bg-gradient-to-b from-[#022c22] to-transparent");

  return (
    <div className="h-[calc(100vh-80px)] w-full flex flex-col px-4 lg:px-8 py-6">
      <div className="flex-shrink-0 mb-4 z-10">
        <div className="flex items-center gap-2 bg-slate-900/80 p-1 rounded-full w-fit backdrop-blur-md border border-white/10">
          <button onClick={() => setActiveTab('csa-x')} className={`py-2 px-5 text-sm font-semibold rounded-full transition-all duration-300 ${activeTab === 'csa-x' ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/50' : 'text-slate-400 hover:text-white'}`}>CSA-X</button>
          <button onClick={() => setActiveTab('lct-pro')} className={`py-2 px-5 text-sm font-semibold rounded-full transition-all duration-300 ${activeTab === 'lct-pro' ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-900/50' : 'text-slate-400 hover:text-white'}`}>LCT-PRO</button>
          <button onClick={() => setActiveTab('ocr-master')} className={`py-2 px-5 text-sm font-semibold rounded-full transition-all duration-300 ${activeTab === 'ocr-master' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/50' : 'text-slate-400 hover:text-white'}`}>OCR-MASTER</button>
        </div>
      </div>

      <div className={`flex-1 overflow-hidden rounded-3xl ${backgroundClass} p-6 shadow-2xl ring-1 ring-white/10 relative`}>
        {/* Background Glow */}
        <div className="absolute top-0 left-0 w-full h-full bg-noise opacity-[0.03] pointer-events-none"></div>

        {activeTab === 'csa-x' && <CsaXView />}
        {activeTab === 'lct-pro' && <LctProView />}
        {activeTab === 'ocr-master' && <OcrMasterView />}
      </div>
    </div>
  );
};

export default UnleashView;
