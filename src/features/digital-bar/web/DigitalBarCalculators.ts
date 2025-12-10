
// Logic for productivity and efficiency calculations

export interface DigitalBarMetrics {
    efficiency: number;
    stress: number;
    ticketsPerHour: number;
    staffActive: number;
    revenue: number;
}

export const calculateEfficiency = (tickets: number, staff: number, errors: number): number => {
    if (staff === 0) return 0;
    const baseLoad = tickets / staff;
    // Ideal load is ~10 tickets/hr per person.
    // If load < 10, efficiency is high (but maybe underutilized).
    // If load > 15, efficiency drops due to stress.

    let eff = 100 - (errors * 5);

    if (baseLoad > 15) {
        eff -= (baseLoad - 15) * 2; // Penalty for overload
    } else if (baseLoad < 5) {
        eff -= (5 - baseLoad) * 2; // Penalty for underutilization
    }

    return Math.max(0, Math.min(100, eff));
};

export const calculateProjectedRevenue = (currentRevenue: number, hourOfDay: number): number => {
    // Simple projection: assume remaining hours follow standard curve
    // E.g. If at 12:00 we have X, and 12:00 is usually 20% of daily, then total = X / 0.2

    // Simplified model
    const progress = Math.max(0.1, hourOfDay / 24);
    return currentRevenue / progress;
};
