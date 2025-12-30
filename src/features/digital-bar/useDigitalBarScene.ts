import { useState, useEffect, useCallback, useRef } from 'react';
import { BarSceneState, BarArea, BarWorker } from './scene/digitalBarTypes';
import { INITIAL_SCENE_STATE } from './scene/digitalBarTemplate';
import { OperationalEngine } from './engine/OperationalEngine';
import { OperationalState, EngineWorker } from './engine/types';
import { useDigitalBarMetrics } from './hooks/useDigitalBarMetrics';

export const useDigitalBarScene = () => {
    // We maintain a "View State" (BarSceneState) for the UI components
    // and an "Engine State" (OperationalState) for the logic.
    const [viewState, setViewState] = useState<BarSceneState>(INITIAL_SCENE_STATE);
    const engineStateRef = useRef<OperationalState | null>(null);
    const { metrics } = useDigitalBarMetrics(); // Real data integration

    // Initialize Engine on first mount
    useEffect(() => {
        if (!engineStateRef.current) {
            // Transform Initial View State to Engine State workers
            const initialEngineWorkers: EngineWorker[] = viewState.workers.map(w => ({
                id: w.id,
                areaId: w.areaId,
                name: w.name,
                role: w.role,
                state: w.activity as any, // Cast for v1 compatibility
                stressLevel: w.stressLevel,
                energyLevel: 100, // Default start
                skillLevel: 1.0
            }));

            const areaIds = viewState.areas.map(a => a.id);
            engineStateRef.current = OperationalEngine.initialize(areaIds, initialEngineWorkers);
        }
    }, []);

    // -- Actions --

    const selectArea = useCallback((areaId: string | null) => {
        setViewState(prev => ({ ...prev, selectedAreaId: areaId }));
    }, []);

    const setZoom = useCallback((zoom: number) => {
        setViewState(prev => ({ ...prev, zoomLevel: Math.max(0.5, Math.min(3, zoom)) }));
    }, []);

    const setPan = useCallback((x: number, y: number) => {
        setViewState(prev => ({ ...prev, panOffset: { x, y } }));
    }, []);

    const centerView = useCallback(() => {
        setViewState(prev => ({ ...prev, zoomLevel: 1, panOffset: { x: 0, y: 0 } }));
    }, []);

    // -- Dynamic Area Actions --
    const addArea = useCallback((area: BarArea) => {
        setViewState(prev => ({ ...prev, areas: [...prev.areas, area] }));
        if (engineStateRef.current) {
            engineStateRef.current = OperationalEngine.addArea(engineStateRef.current, area.id);
        }
    }, []);

    const deleteArea = useCallback((areaId: string) => {
        setViewState(prev => ({
            ...prev,
            areas: prev.areas.filter(a => a.id !== areaId),
            selectedAreaId: prev.selectedAreaId === areaId ? null : prev.selectedAreaId
        }));
        if (engineStateRef.current) {
            engineStateRef.current = OperationalEngine.removeArea(engineStateRef.current, areaId);
        }
    }, []);

    const updateArea = useCallback((areaId: string, updates: Partial<BarArea>) => {
        setViewState(prev => ({
            ...prev,
            areas: prev.areas.map(a => a.id === areaId ? { ...a, ...updates } : a)
        }));
    }, []);

    // -- Engine Loop --
    useEffect(() => {
        const intervalId = setInterval(() => {
            if (engineStateRef.current) {
                // 1. Run Engine Step
                const nextEngineState = OperationalEngine.update(engineStateRef.current);
                engineStateRef.current = nextEngineState;

                // 2. Sync Engine State -> View State
                setViewState(prev => {
                    const nextAreas = prev.areas.map(area => {
                        const engineStats = nextEngineState.areas[area.id];
                        const realMetrics = metrics[area.id]; // Get real metrics for this area

                        if (!engineStats) return area;

                        return {
                            ...area,
                            stats: {
                                // Prefer real metrics if available, fallback to engine
                                load: realMetrics ? realMetrics.activeTasks * 10 : engineStats.load, // Scale for demo
                                efficiency: realMetrics ? realMetrics.efficiency : engineStats.efficiency,
                                activeTickets: realMetrics ? realMetrics.activeTasks : engineStats.activeTickets,

                                // Attach full snapshot
                                snapshot: realMetrics,
                                ticketsPerHour: realMetrics?.ticketsPerHour,
                                stockPressure: realMetrics?.stockPressure,
                                teamStress: realMetrics?.teamStress
                            }
                        };
                    });

                    const nextWorkers = prev.workers.map(w => {
                        const engineWorker = nextEngineState.workers[w.id];
                        if (!engineWorker) return w;
                        return {
                            ...w,
                            activity: engineWorker.state as any,
                            stressLevel: engineWorker.stressLevel
                        };
                    });

                    return {
                        ...prev,
                        areas: nextAreas,
                        workers: nextWorkers
                    };
                });
            }
        }, 2000); // 2-second heartbeat

        return () => clearInterval(intervalId);
    }, [metrics]); // Added metrics logic dependency

    // -- Computed --
    const selectedArea = viewState.areas.find(a => a.id === viewState.selectedAreaId);

    return {
        sceneState: viewState,
        actions: {
            selectArea,
            setZoom,
            setPan,
            centerView,
            addArea,
            deleteArea,
            updateArea
        },
        selectedArea
    };
};

