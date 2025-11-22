import React from 'react';

interface ProgressBarProps {
  progress: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress }) => {
  return (
    <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
      <div 
        className="h-full rounded-full bg-indigo-500 transition-all duration-500 ease-out" 
        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} 
      />
    </div>
  );
};

export default ProgressBar;
