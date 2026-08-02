import React from 'react';
import { AppContextType, UserProfile } from '../types';
import { app, auth, db, storage } from '../config/firebaseApp'; // Use Singletons!
import { onAuthStateChanged, signInWithCustomToken, User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { firebaseConfig } from '../config/firebaseConfig';
import { PlanTier } from '../core/product/plans.types';
import { DEFAULT_PLAN_TIER } from '../core/product/plans.config';
import { CapabilitiesEngine } from '../core/product/capabilities.engine';

const AppContext = React.createContext<AppContextType | undefined>(undefined);

export const useApp = (): AppContextType => {
    const context = React.useContext(AppContext);
    if (!context) throw new Error('useApp must be used within an AppProvider');
    return context;
};

// Phase 5.0: Hooks for Capabilities
export const useCapabilities = () => {
    const { userPlan } = useApp();
    return {
        hasLayer: (layer: any) => CapabilitiesEngine.hasLayer(userPlan, layer),
        canExecuteActions: CapabilitiesEngine.canExecuteActions(userPlan),
        canCustomizeThresholds: CapabilitiesEngine.canCustomizeThresholds(userPlan),
        maxAssistedInsights: CapabilitiesEngine.getMaxAssistedInsights(userPlan),
        auditRetentionDays: CapabilitiesEngine.getAuditRetentionDays(userPlan),
        currentPlan: CapabilitiesEngine.getPlan(userPlan),
    };
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = React.useState<User | null>(null);
    const [isAuthReady, setIsAuthReady] = React.useState(false);
    const [userProfile, setUserProfile] = React.useState<Partial<UserProfile>>({});

    const authInitialized = React.useRef(false);

    React.useEffect(() => {
        if (!authInitialized.current) {
            console.log('🔌 AppContext: Initializing Auth Listener...');
            authInitialized.current = true;
        }

        // Timeout safety: Force ready state if Firebase takes too long (5s)
        const safetyTimeout = setTimeout(() => {
            if (!isAuthReady) {
                console.warn('⚠️ Firebase Auth timed out. Forcing UI to render.');
                setIsAuthReady(true);
            }
        }, 5000);

        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (authInitialized.current && isAuthReady) {
                // Skip logging after first initialization to reduce noise
            } else {
                console.log('👤 Auth State Changed:', user ? 'User Logged In' : 'No User');
            }
            
            clearTimeout(safetyTimeout); // Clear timeout on success

            if (user) {
                setUser(user);
            } else {
                const initialToken = (window as any).__initial_auth_token as string;
                if (initialToken) {
                    try {
                        const userCredential = await signInWithCustomToken(auth, initialToken);
                        setUser(userCredential.user);
                    } catch (error) {
                        console.error("Error al iniciar sesión con token personalizado:", error);
                        setUser(null);
                    }
                } else {
                    setUser(null);
                }
            }
            setIsAuthReady(true);
        });

        return () => {
            clearTimeout(safetyTimeout);
            if (unsubscribe) unsubscribe();
        };
    }, []);

    const userId = user ? user.uid : null;
    const appId = firebaseConfig.appId;

    React.useEffect(() => {
        if (db && userId) {
            const profileDocRef = doc(db, `users/${userId}/profile`, 'main');
            const unsubscribe = onSnapshot(profileDocRef, (doc) => {
                if (doc.exists()) {
                    setUserProfile(doc.data());
                } else {
                    setUserProfile({});
                }
            });
            return () => unsubscribe();
        }
    }, [userId]); // Removed db from dep array as it's static

    // Plan is authoritative from the user's profile (updated by the Stripe webhook
    // after a successful subscription). Falls back to the default tier.
    const VALID_TIERS: PlanTier[] = ['FREE', 'PRO', 'EXPERT', 'STUDIO'];
    const profilePlan = (userProfile as any)?.plan;
    const userPlan: PlanTier = VALID_TIERS.includes(profilePlan) ? profilePlan : DEFAULT_PLAN_TIER;

    return (
        <AppContext.Provider value={{ app, db, auth, storage, user, userId, isAuthReady, appId, userProfile, userPlan }}>
            {children}
        </AppContext.Provider>
    );
};
