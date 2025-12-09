import React from 'react';
import { AuthContextType } from '../../types';
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, Auth, signInWithCustomToken, User } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { firebaseConfig } from '../config/firebaseConfig';

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
    const context = React.useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [app, setApp] = React.useState<FirebaseApp | null>(null);
    const [db, setDb] = React.useState<Firestore | null>(null);
    const [auth, setAuth] = React.useState<Auth | null>(null);
    const [storage, setStorage] = React.useState<FirebaseStorage | null>(null);
    const [user, setUser] = React.useState<User | null>(null);
    const [isAuthReady, setIsAuthReady] = React.useState(false);

    React.useEffect(() => {
        const appInstance = initializeApp(firebaseConfig);
        const authInstance = getAuth(appInstance);
        const dbInstance = getFirestore(appInstance);
        const storageInstance = getStorage(appInstance);
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

    return (
        <AuthContext.Provider value={{ app, db, auth, storage, user, userId, isAuthReady, appId }}>
            {children}
        </AuthContext.Provider>
    );
};
