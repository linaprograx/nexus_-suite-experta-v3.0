// src/config/firebaseApp.ts

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { firebaseConfig } from './firebaseConfig';

// Inicialización única de Firebase
const app = initializeApp(firebaseConfig);

// Servicios globales compartidos por toda la app
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { app, db, auth, storage };