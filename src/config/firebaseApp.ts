// src/config/firebaseApp.ts

import { initializeApp } from 'firebase/app';
// Configuración de Firestore con caché persistente (Nueva API)
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { firebaseConfig } from './firebaseConfig';

// Inicialización única de Firebase
const app = initializeApp(firebaseConfig);

const db = initializeFirestore(app, {
    localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
    })
});

const auth = getAuth(app);
const storage = getStorage(app);

// Legacy persistence code removed as it is handled by initializeFirestore options above.


export { app, db, auth, storage };