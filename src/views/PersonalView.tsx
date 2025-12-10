import React, { useEffect, useState } from 'react';
import { doc, onSnapshot, setDoc, collection, query, orderBy, limit, Firestore, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, FirebaseStorage } from 'firebase/storage';
import { Auth } from 'firebase/auth';
import { UserProfile, ColegiumResult, Recipe, PizarronTask } from '../types';
import { PersonalProfileSidebar } from '../components/personal/PersonalProfileSidebar';
import { PersonalHub } from '../components/personal/PersonalHub';
import { PersonalSettingsPanel } from '../components/personal/PersonalSettingsPanel';
import { useUI } from '../context/UIContext';
import { Input } from '../components/ui/Input'; // Used for hidden file inputs, kept for logic

import { useRecipes } from '../hooks/useRecipes';
import { usePizarronData } from '../hooks/usePizarronData';

interface PersonalViewProps {
    db: Firestore;
    userId: string;
    storage: FirebaseStorage | null;
    auth: Auth | null;
    // allRecipes, allPizarronTasks REMOVED
}

const PersonalView: React.FC<PersonalViewProps> = ({ db, userId, storage, auth }) => {
    const { recipes: allRecipes } = useRecipes();
    const { tasks: allPizarronTasks } = usePizarronData();

    const { theme, setTheme, compactMode, toggleCompactMode } = useUI();
    const [profile, setProfile] = useState<Partial<UserProfile>>({});
    const [newAvatar, setNewAvatar] = useState<File | null>(null);
    const [newAvatarPreview, setNewAvatarPreview] = useState<string | null>(null);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [newCover, setNewCover] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [quizHistory, setQuizHistory] = useState<ColegiumResult[]>([]);

    // Local Settings State
    const [reducedMotion, setReducedMotion] = useState(false);
    const [twoFactor, setTwoFactor] = useState(false);
    const [notifications, setNotifications] = useState(true);
    const [sounds, setSounds] = useState(true);

    // Hidden input refs logic replaced by direct button interactions if simplified, 
    // but we need to trigger the File Input.
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!userId) return;
        const profileDocRef = doc(db, `users/${userId}/profile`, 'main');
        const unsubscribe = onSnapshot(profileDocRef, (doc) => {
            if (doc.exists()) {
                setProfile(doc.data());
            } else {
                setProfile({
                    displayName: auth?.currentUser?.displayName || '',
                    photoURL: auth?.currentUser?.photoURL || '',
                    jobTitle: '',
                    bio: '',
                });
            }
        });

        const resultsPath = `users/${userId}/colegium-results`;
        const q = query(collection(db, resultsPath), orderBy('createdAt', 'desc'), limit(10));
        const unsubQuiz = onSnapshot(q, (snap) => {
            setQuizHistory(snap.docs.map(d => d.data() as ColegiumResult));
        });

        return () => {
            unsubscribe();
            unsubQuiz();
        };
    }, [userId, db, auth]);

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            if (!storage) {
                alert("Storage no disponible");
                return;
            }
            const file = e.target.files[0];
            setNewAvatarPreview(URL.createObjectURL(file));

            try {
                // Upload to Firebase Storage
                const storageRef = ref(storage, `users/${userId}/profile/avatar_${Date.now()}`);
                await uploadBytes(storageRef, file);
                const downloadURL = await getDownloadURL(storageRef);

                // Update Firestore
                const profileRef = doc(db, `users/${userId}/profile`, 'main');
                await setDoc(profileRef, { photoURL: downloadURL }, { merge: true });

                alert('Foto de perfil actualizada correctamente.');
            } catch (error) {
                console.error("Error updating avatar:", error);
                alert('Error al subir la imagen. Inténtalo de nuevo.');
            }
        }
    };

    // Placeholder for full edit modal or inline edit. 
    // The previous code had inline inputs. The new design has "Edit Profile" button.
    // For this redesign, we'll keep the button as a "Mock" or simple prompt until user asks for the modal.
    const handleEditProfile = () => {
        const newName = prompt("Nuevo nombre:", profile.displayName);
        if (newName) setProfile(p => ({ ...p, displayName: newName }));
        // Full implementation would be a modal.
    };

    const recipesCount = allRecipes.length;
    const avgQuizScore = quizHistory.length > 0 ? (quizHistory.reduce((acc, curr) => acc + (curr.score / curr.total), 0) / quizHistory.length * 100) : 0;
    const ideasCount = allPizarronTasks.filter(task => task.assignees?.includes(userId)).length;

    const handleSaveProfile = async () => {
        try {
            const profileRef = doc(db, `users/${userId}/profile`, 'main');
            await setDoc(profileRef, profile, { merge: true });
            alert('Perfil actualizado.');
        } catch (e) {
            console.error("Error saving profile:", e);
        }
    };

    return (
        <div className="h-full p-4 lg:p-8 overflow-hidden">
            {/* Hidden Inputs for logic */}
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleAvatarChange}
            />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
                {/* Left Column: Profile (3 cols) */}
                <div className="lg:col-span-3 h-full overflow-y-auto custom-scrollbar">
                    <PersonalProfileSidebar
                        profile={profile}
                        onEditProfile={handleEditProfile}
                        onUploadAvatar={() => fileInputRef.current?.click()}
                        onSaveProfile={handleSaveProfile}
                        newAvatarPreview={newAvatarPreview}
                    />
                </div>

                {/* Center Column: Hub (6 cols) */}
                <div className="lg:col-span-6 h-full overflow-hidden">
                    <PersonalHub
                        stats={{
                            recipes: recipesCount,
                            avgScore: Math.round(avgQuizScore),
                            ideas: ideasCount
                        }}
                    />
                </div>

                {/* Right Column: Settings (3 cols) */}
                <div className="lg:col-span-3 h-full overflow-y-auto custom-scrollbar">
                    <PersonalSettingsPanel
                        darkMode={theme === 'dark'}
                        toggleDarkMode={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
                        reducedMotion={reducedMotion}
                        toggleReducedMotion={() => setReducedMotion(!reducedMotion)}
                        twoFactor={twoFactor}
                        toggleTwoFactor={() => setTwoFactor(!twoFactor)}
                        notifications={notifications}
                        toggleNotifications={() => setNotifications(!notifications)}
                        sounds={sounds}
                        toggleSounds={() => setSounds(!sounds)}
                        compactMode={compactMode}
                        toggleCompactMode={toggleCompactMode}
                        activeSessions={true}
                        toggleActiveSessions={() => { }}
                    />
                </div>
            </div>
        </div>
    );
};

export default PersonalView;
