import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { getUiMode, getDeviceMode, UiMode, DeviceMode } from '../config/uiMode';

interface UiModeContextType {
    uiMode: UiMode;
    deviceMode: DeviceMode;
}

const UiModeContext = createContext<UiModeContextType>({
    uiMode: 'legacy',
    deviceMode: 'desktop',
});

export const UiModeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const value = useMemo(() => ({
        uiMode: getUiMode(),
        deviceMode: getDeviceMode(),
    }), []);

    return (
        <UiModeContext.Provider value={value}>
            {children}
        </UiModeContext.Provider>
    );
};

export const useUiMode = () => useContext(UiModeContext);
