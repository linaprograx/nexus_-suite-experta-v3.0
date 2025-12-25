import React from 'react';
import { AppContextType, UserProfile } from '../types';
import { initializeApp, FirebaseApp, getApps, getApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, Auth, signInWithCustomToken, User } from 'firebase/auth';
import { getFirestore, Firestore, doc, onSnapshot } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
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
    const [app, setApp] = React.useState<FirebaseApp | null>(null);
    const [db, setDb] = React.useState<Firestore | null>(null);
    const [auth, setAuth] = React.useState<Auth | null>(null);
    const [storage, setStorage] = React.useState<FirebaseStorage | null>(null);
    const [user, setUser] = React.useState<User | null>(null);
    const [isAuthReady, setIsAuthReady] = React.useState(false);
    const [userProfile, setUserProfile] = React.useState<Partial<UserProfile>>({});

    React.useEffect(() => {
        let appInstance: FirebaseApp;
        let authInstance: Auth;
        let dbInstance: Firestore;
        let storageInstance: FirebaseStorage;

        // Verificar si ya existe una instancia (evita crashes en StrictMode/Dev)
        if (getApps().length === 0) {
            appInstance = initializeApp(firebaseConfig);
        } else {
            appInstance = getApp();
        }

        authInstance = getAuth(appInstance);
        dbInstance = getFirestore(appInstance);
        storageInstance = getStorage(appInstance);

        setApp(appInstance);
        setAuth(authInstance);
        setDb(dbInstance);
        setStorage(storageInstance);

        const unsubscribe = onAuthStateChanged(authInstance, async (user) => {
            if (user) {
                setUser(user);
            } else {
                const initialToken = (window as any).__initial_auth_token as string;
                if (initialToken) {
                    try {
                        const userCredential = await signInWithCustomToken(authInstance, initialToken);
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

        return () => unsubscribe();
    }, []);

    const userId = user ? user.uid : null;
    const appId = firebaseConfig.appId;

    React.useEffect(() => {
        if (db && userId) {
            const profileDocRef = doc(db, `users/${userId}/profile`, 'main');
            const unsubscribe = onSnapshot(profileDocRef, (doc) => {
                if (doc.exists()) {
                    setUserProfile(doc.data());
                }
            });
            return () => unsubscribe();
        }
    }, [db, userId]);

    const [userPlan, setUserPlan] = React.useState<PlanTier>(DEFAULT_PLAN_TIER);

    // In a real app, we would fetch the plan from Stripe/User Doc here.
    // React.useEffect(() => { if (userProfile.plan) setUserPlan(userProfile.plan); }, [userProfile]);

    return (
        <AppContext.Provider value={{ app, db, auth, storage, user, userId, isAuthReady, appId, userProfile, userPlan }}>
            {children}
        </AppContext.Provider>
    );
};
