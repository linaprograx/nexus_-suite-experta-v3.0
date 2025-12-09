import { useState, useEffect } from 'react';
import { Firestore, collection, onSnapshot, query, orderBy, limit, doc } from 'firebase/firestore';
import { Recipe, Ingredient, PizarronTask, AppNotification, UserProfile } from '../../types';
import { safeNormalizeTask } from '../utils/taskHelpers';

export const useFirebaseData = (
    db: Firestore | null,
    userId: string | null,
    appId: string
) => {
    const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);
    const [allIngredients, setAllIngredients] = useState<Ingredient[]>([]);
    const [allPizarronTasks, setAllPizarronTasks] = useState<PizarronTask[]>([]);
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [userProfile, setUserProfile] = useState<Partial<UserProfile>>({});
    const [activeBoardId, setActiveBoardId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Triple Guard: Do not attempt to listen if any requirement is missing
        if (!db || !userId || !appId) {
            setLoading(false);
            return;
        }

        setLoading(true);

        // 1. Recipes Listener
        const recipeDef = query(collection(db, `users/${userId}/grimorio`), orderBy('nombre'));
        const recipeUnsub = onSnapshot(recipeDef,
            (snap) => {
                setAllRecipes(snap.docs.map(d => ({ ...d.data(), id: d.id } as Recipe)));
            },
            (error) => console.log("Recipes listener info:", error.message)
        );

        // 2. Ingredients Listener
        const ingredientRef = query(collection(db, `artifacts/${appId}/users/${userId}/grimorio-ingredients`), orderBy('nombre'));
        const ingredientUnsub = onSnapshot(ingredientRef,
            (snap) => {
                setAllIngredients(snap.docs.map(d => ({ ...d.data(), id: d.id } as Ingredient)));
            },
            (error) => console.log("Ingredients listener info:", error.message)
        );

        // 3. Tasks Listener
        const tasksRef = query(collection(db, `artifacts/${appId}/public/data/pizarron-tasks`), orderBy('createdAt', 'desc'));
        const taskUnsub = onSnapshot(tasksRef,
            (snap) => {
                setAllPizarronTasks(snap.docs.map(d => safeNormalizeTask({ ...d.data(), id: d.id })));
            },
            (error) => console.log("Tasks listener info:", error.message)
        );

        // 4. Notifications Listener
        const notifRef = query(collection(db, `artifacts/${appId}/users/${userId}/notifications`), orderBy('createdAt', 'desc'), limit(20));
        const notifUnsub = onSnapshot(notifRef,
            (snap) => {
                setNotifications(snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as AppNotification)));
            },
            (error) => console.log("Notifications listener info:", error.message)
        );

        // 5. User Profile Listener
        const profileRef = doc(db, `users/${userId}/profile`, 'main');
        const profileUnsub = onSnapshot(profileRef,
            (doc) => {
                if (doc.exists()) {
                    setUserProfile(doc.data());
                }
            },
            (error) => console.log("Profile listener info:", error.message)
        );

        // 6. Boards Listener for FAB
        const boardsColPath = `artifacts/${appId}/public/data/pizarron-boards`;
        const boardsUnsub = onSnapshot(collection(db, boardsColPath), (snap) => {
            if (!snap.empty) {
                setActiveBoardId(snap.docs[0].id);
            } else {
                setActiveBoardId('general');
            }
        });

        setLoading(false);

        // Cleanup function to unsubscribe from all listeners
        return () => {
            recipeUnsub();
            ingredientUnsub();
            taskUnsub();
            notifUnsub();
            profileUnsub();
            boardsUnsub();
        };

    }, [db, userId, appId]);

    return {
        allRecipes,
        allIngredients,
        allPizarronTasks,
        notifications,
        userProfile,
        activeBoardId,
        loading
    };
};
