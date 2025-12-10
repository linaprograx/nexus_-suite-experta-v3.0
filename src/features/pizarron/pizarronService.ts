import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    serverTimestamp,
    Firestore
} from 'firebase/firestore';
import { PizarronTask, PizarronBoard } from '../../types';

export const pizarronService = {
    // --- TASKS ---
    addTask: async (db: Firestore, appId: string, taskData: Partial<PizarronTask>) => {
        const collectionRef = collection(db, `artifacts/${appId}/public/data/pizarron-tasks`);
        const docRef = await addDoc(collectionRef, {
            ...taskData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        return docRef.id;
    },

    updateTask: async (db: Firestore, appId: string, taskId: string, updates: Partial<PizarronTask>) => {
        const docRef = doc(db, `artifacts/${appId}/public/data/pizarron-tasks`, taskId);
        await updateDoc(docRef, {
            ...updates,
            updatedAt: serverTimestamp()
        });
    },

    deleteTask: async (db: Firestore, appId: string, taskId: string) => {
        const docRef = doc(db, `artifacts/${appId}/public/data/pizarron-tasks`, taskId);
        await deleteDoc(docRef);
    },

    // --- BOARDS ---
    addBoard: async (db: Firestore, appId: string, boardData: Partial<PizarronBoard>) => {
        const collectionRef = collection(db, `artifacts/${appId}/public/data/pizarron-boards`);
        const docRef = await addDoc(collectionRef, {
            ...boardData,
            createdAt: serverTimestamp()
        });
        return docRef.id;
    },

    updateBoard: async (db: Firestore, appId: string, boardId: string, updates: Partial<PizarronBoard>) => {
        const docRef = doc(db, `artifacts/${appId}/public/data/pizarron-boards`, boardId);
        await updateDoc(docRef, updates);
    },

    deleteBoard: async (db: Firestore, appId: string, boardId: string) => {
        const docRef = doc(db, `artifacts/${appId}/public/data/pizarron-boards`, boardId);
        await deleteDoc(docRef);
    }
};
