import { Firestore } from 'firebase/firestore';
import { calculateEfficiency } from './DigitalBarCalculators';

// Types
export interface BarSnapshot {
    time: string;
    tickets: number;
    efficiency: number;
    stress: number;
}

export const DigitalBarService = {
    /**
     * Fetch daily metrics (Placeholder for real Firestore query)
     */
    fetchDailyMetrics: async (db: Firestore | null, userId: string | null): Promise<BarSnapshot[]> => {
        // Mocking data simulation for now, but structured as a service
        // In real app, this would query a 'daily_metrics' collection
        return new Promise((resolve) => {
            setTimeout(() => {
                const data: BarSnapshot[] = [];
                for (let i = 0; i < 24; i++) {
                    data.push({
                        time: `${String(i).padStart(2, '0')}:00`,
                        tickets: Math.floor(Math.random() * 50),
                        efficiency: 70 + Math.random() * 20,
                        stress: 20 + Math.random() * 40
                    });
                }
                resolve(data);
            }, 500);
        });
    },

    /**
     * Get AI Insights (Placeholder for simple rules engine or Gemini call)
     */
    getDailyInsights: (snapshots: BarSnapshot[]) => {
        const avgEff = snapshots.reduce((acc, curr) => acc + curr.efficiency, 0) / (snapshots.length || 1);
        const peakHour = snapshots.reduce((max, curr) => curr.tickets > max.tickets ? curr : max, snapshots[0]);

        return {
            summary: avgEff > 85 ? "Alta Eficiencia" : "Se detectaron cuellos de botella",
            recommendation: avgEff < 80 ? "Revisar dotación de personal en hora pico." : "Mantener ritmo actual.",
            peakHour: peakHour?.time || "--:--"
        };
    }
};
