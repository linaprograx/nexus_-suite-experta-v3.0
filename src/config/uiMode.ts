export type UiMode = 'legacy' | 'product';
export type DeviceMode = 'desktop' | 'mobile';

export const getUiMode = (): UiMode => {
    const envMode = import.meta.env.VITE_UI_MODE;
    if (envMode === 'product') return 'product';
    return 'legacy';
};

export const getDeviceMode = (): DeviceMode => {
    // Can be enhanced with media query checks if needed, but per requirements we stick to env/default
    const envMode = import.meta.env.VITE_DEVICE_MODE;
    if (envMode === 'mobile') return 'mobile';
    return 'desktop';
};
