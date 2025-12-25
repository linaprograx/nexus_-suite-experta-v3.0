/**
 * Simple metrics tracking for Product KPIs.
 * In a real app, this would send data to Mixpanel/Amplitude/Google Analytics.
 */
export const ProductMetrics = {
    trackView: (feature: string, plan: string) => {
        console.log(`[METRIC] View: ${feature} (${plan})`);
    },

    trackInteraction: (feature: string, action: string, plan: string) => {
        console.log(`[METRIC] Interaction: ${feature} -> ${action} (${plan})`);
    },

    trackGateHit: (feature: string, plan: string) => {
        console.warn(`[METRIC] Gated Access Attempt: ${feature} (${plan})`);
    }
};
