import React, { useRef, useState, useEffect } from 'react';
import { useUI } from '../ui/UIContext'; // Assuming UI context exists or correct import
import { Icon } from '../ui/Icon';
import { ICONS } from '../ui/icons';

interface PanZoomCanvasProps {
    children: React.ReactNode;
    zoom: number;
    setZoom: (zoom: number) => void;
    pan: { x: number; y: number };
    setPan: (pan: { x: number; y: number }) => void;
    className?: string;
}

export const PanZoomCanvas: React.FC<PanZoomCanvasProps> = ({
    children,
    zoom,
    setZoom,
    pan,
    setPan,
    className = ''
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });

    // Handle Wheel Zoom
    const handleWheel = (e: React.WheelEvent) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const delta = e.deltaY * -0.01;
            const newZoom = Math.min(Math.max(zoom + delta, 0.5), 2);
            setZoom(newZoom);
        } else {
            // Optional: Pan with wheel if not zooming? 
            // Standard behavior for infinite canvas often allows wheel to pan Y or Shift+Wheel to pan X
            // But let's stick to trackpad/mouse conventions if possible.
            // For now, let native scroll happen if we aren't preventing it, 
            // BUT we are using transform, so native scroll might not work well on the container if we want "infinite" feeling.
            // Let's implement wheel pan for non-zoom events.
            const newPan = {
                x: pan.x - e.deltaX,
                y: pan.y - e.deltaY
            };
            setPan(newPan);
        }
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        // Only start drag if clicking on the background (container)
        // We can check if e.target is the container or explicitly checking class/id
        if ((e.target as HTMLElement) === containerRef.current) {
            setIsDragging(true);
            setLastMousePos({ x: e.clientX, y: e.clientY });
            containerRef.current.style.cursor = 'grabbing';
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        const dx = e.clientX - lastMousePos.x;
        const dy = e.clientY - lastMousePos.y;

        setPan({ x: pan.x + dx, y: pan.y + dy });
        setLastMousePos({ x: e.clientX, y: e.clientY });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        if (containerRef.current) {
            containerRef.current.style.cursor = 'default';
        }
    };

    // Effect to handle mouse up outside window
    useEffect(() => {
        const handleWindowMouseUp = () => {
            if (isDragging) {
                setIsDragging(false);
                if (containerRef.current) containerRef.current.style.cursor = 'default';
            }
        };
        window.addEventListener('mouseup', handleWindowMouseUp);
        return () => window.removeEventListener('mouseup', handleWindowMouseUp);
    }, [isDragging]);

    return (
        <div
            ref={containerRef}
            className={`w-full h-full overflow-hidden relative bg-slate-50 dark:bg-slate-900 ${className}`}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            style={{
                // Dot Grid Background
                backgroundImage: 'radial-gradient(circle, #94a3b8 1px, transparent 1px)',
                backgroundSize: `${30 * zoom}px ${30 * zoom}px`, // Scale grid with zoom? Or keep static? Static is usually better for reference.
                // actually, scaling grid helps visualize zoom level.
                backgroundPosition: `${pan.x}px ${pan.y}px`, // Move grid with pan
                opacity: 1 // We can control opacity of dots via color
            }}
        >
            {/* 
                We apply styles inline for performance. 
                Using a wrapper for the content that scales and moves.
             */}
            <div
                style={{
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                    transformOrigin: '0 0',
                    width: '100%',
                    height: '100%',
                    // We need to ensure pointer events work for children
                    pointerEvents: 'none' // Disable events on wrapper, enable on children? 
                    // No, we need drag events on background, but clicks on children.
                    // If we put pointer-events: none here, children need auto.
                }}
            >
                <div style={{ pointerEvents: 'auto', width: 'max-content', height: 'max-content', minWidth: '100vw', minHeight: '100vh', padding: '100px' }}>
                    {children}
                </div>
            </div>

            {/* Zoom Indicator (Optional overlay) */}
            <div className="absolute bottom-6 right-6 bg-white/80 dark:bg-slate-800/80 backdrop-blur px-3 py-1.5 rounded-full text-xs font-mono text-slate-500 border border-slate-200 dark:border-slate-700 pointer-events-none select-none">
                {Math.round(zoom * 100)}%
            </div>
        </div>
    );
};
