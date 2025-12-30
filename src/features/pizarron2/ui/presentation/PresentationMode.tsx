import React, { useEffect, useState } from 'react';
import { pizarronStore } from '../../state/store';

export const PresentationMode: React.FC = () => {
    const [active, setActive] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [totalSlides, setTotalSlides] = useState(0);

    // 1. Subscribe to State
    useEffect(() => {
        const unsub = pizarronStore.subscribe(() => {
            const state = pizarronStore.getState();
            setActive(state.presentationState.isActive);
            setCurrentIndex(state.presentationState.currentIndex);
            setTotalSlides(state.presentationState.storyPath.length);
        });
        return unsub;
    }, []);

    // 2. Keyboard Shortcuts
    useEffect(() => {
        const handleDown = (e: KeyboardEvent) => {
            const state = pizarronStore.getState();
            if (state.presentationState.isActive) {
                // Presentation Mode Shortcuts
                if (e.key === 'Escape') {
                    pizarronStore.setPresentationMode(false);
                }
                if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') {
                    pizarronStore.nextSlide();
                }
                if (e.key === 'ArrowLeft' || e.key === 'Backspace') {
                    pizarronStore.prevSlide();
                }
            }
            if (e.key === 'Escape') {
                pizarronStore.setPresentationMode(false);
            }
            if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') {
                pizarronStore.nextSlide();
            }
            if (e.key === 'ArrowLeft' || e.key === 'Backspace') {
                pizarronStore.prevSlide();
            }
        };

        window.addEventListener('keydown', handleDown);
        return () => window.removeEventListener('keydown', handleDown);
    }, []);

    if (!active) return null;

    return (
        <div className="absolute inset-0 pointer-events-none z-50 flex flex-col justify-end pb-8 items-center">
            {/* Minimal Controller */}
            <div className="bg-black/80 backdrop-blur text-white px-6 py-3 rounded-full flex items-center gap-6 shadow-2xl pointer-events-auto animate-in slide-in-from-bottom duration-300 border border-white/10">
                <div className="flex items-center gap-2 border-r border-white/20 pr-4">
                    <span className="text-xs font-bold tracking-widest text-orange-400">PRESENTING</span>
                    <span className="text-xs text-zinc-400 font-mono">
                        {totalSlides > 0 ? `${currentIndex + 1} / ${totalSlides}` : 'NO SLIDES'}
                    </span>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => pizarronStore.prevSlide()}
                        className="hover:bg-white/20 w-8 h-8 rounded-full flex items-center justify-center transition disabled:opacity-30 disabled:hover:bg-transparent"
                        disabled={currentIndex <= 0}
                        title="Previous Slide (Left Arrow)"
                    >
                        ←
                    </button>
                    <button
                        onClick={() => pizarronStore.setPresentationMode(false)}
                        className="hover:bg-red-500/20 text-red-400 px-3 py-1 rounded-md text-xs font-bold tracking-wide transition uppercase"
                        title="Exit Presentation (Esc)"
                    >
                        End
                    </button>
                    <button
                        onClick={() => pizarronStore.nextSlide()}
                        className="hover:bg-white/20 w-8 h-8 rounded-full flex items-center justify-center transition disabled:opacity-30 disabled:hover:bg-transparent"
                        disabled={currentIndex >= totalSlides - 1}
                        title="Next Slide (Right Arrow)"
                    >
                        →
                    </button>
                </div>
            </div>
        </div>
    );
};
