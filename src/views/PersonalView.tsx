import React, { useEffect, useState } from 'react';
import { doc, onSnapshot, setDoc, collection, query, orderBy, limit, Firestore } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, FirebaseStorage } from 'firebase/storage';
import { Auth } from 'firebase/auth';
import { UserProfile, ColegiumResult, Recipe, PizarronTask } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Spinner } from '../components/ui/Spinner';
import { Icon } from '../components/ui/Icon';
import { ICONS } from '../components/ui/icons';
import { StatCard } from '../components/personal/StatCard';

interface PersonalViewProps {
    db: Firestore;
    userId: string;
    storage: FirebaseStorage;
    auth: Auth;
    allRecipes: Recipe[];
    allPizarronTasks: PizarronTask[];
}

const PersonalView: React.FC<PersonalViewProps> = ({ db, userId, storage, auth, allRecipes, allPizarronTasks }) => {
    const [profile, setProfile] = useState<Partial<UserProfile>>({});
    const [newAvatar, setNewAvatar] = useState<File | null>(null);
    const [newCover, setNewCover] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [quizHistory, setQuizHistory] = useState<ColegiumResult[]>([]);

    useEffect(() => {
        if (!userId) return;
        const profileDocRef = doc(db, `users/${userId}/profile`, 'main');
        const unsubscribe = onSnapshot(profileDocRef, (doc) => {
            if (doc.exists()) {
                setProfile(doc.data());
            } else {
                setProfile({
                    displayName: auth.currentUser?.displayName || '',
                    photoURL: auth.currentUser?.photoURL || '',
                    jobTitle: '',
                    bio: '',
                    coverPhotoURL: '',
                    instagramHandle: '',
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

    const handleProfileSave = async () => {
        if (!userId) return;
        setLoading(true);

        let avatarURL = profile.photoURL || '';
        if (newAvatar) {
            const storageRef = ref(storage, `users/${userId}/profile-images/avatar.jpg`);
            await uploadBytes(storageRef, newAvatar);
            avatarURL = await getDownloadURL(storageRef);
        }

        let coverURL = profile.coverPhotoURL || '';
        if (newCover) {
            const storageRef = ref(storage, `users/${userId}/profile-images/cover.jpg`);
            await uploadBytes(storageRef, newCover);
            coverURL = await getDownloadURL(storageRef);
        }

        const profileDataToSave: UserProfile = {
            displayName: profile.displayName || auth.currentUser?.email || '',
            photoURL: avatarURL,
            jobTitle: profile.jobTitle || '',
            bio: profile.bio || '',
            coverPhotoURL: coverURL,
            instagramHandle: profile.instagramHandle || '',
        };

        try {
            await setDoc(doc(db, `users/${userId}/profile`, 'main'), profileDataToSave, { merge: true });
            setNewAvatar(null);
            setNewCover(null);
            alert("Perfil guardado con éxito.");
        } catch (error) {
            console.error("Error saving profile:", error);
            alert("Error al guardar el perfil.");
        } finally {
            setLoading(false);
        }
    };

    const recipesCount = allRecipes.length;
    const avgQuizScore = quizHistory.length > 0 ? (quizHistory.reduce((acc, curr) => acc + (curr.score / curr.total), 0) / quizHistory.length * 100) : 0;
    const ideasCount = allPizarronTasks.filter(task => task.assignees?.includes(userId)).length;

    return (
        <div className="p-4 lg:p-8 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Panel */}
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <div className="relative h-40 bg-secondary rounded-t-xl">
                            <img
                                src={newCover ? URL.createObjectURL(newCover) : profile.coverPhotoURL || 'https://placehold.co/600x200/27272a/FFF?text=Cover'}
                                alt="Cover"
                                className="w-full h-full object-cover rounded-t-xl"
                            />
                            <Button as="label" htmlFor="cover-upload" size="sm" className="absolute top-2 right-2">
                                <Icon svg={ICONS.upload} className="h-4 w-4 mr-2" /> Subir
                            </Button>
                            <Input id="cover-upload" type="file" accept="image/*" className="hidden" onChange={e => setNewCover(e.target.files?.[0] || null)} />
                        </div>
                        <div className="relative p-6 flex flex-col items-center text-center">
                            <div className="absolute -top-12">
                                <img
                                    src={newAvatar ? URL.createObjectURL(newAvatar) : profile.photoURL || `https://ui-avatars.com/api/?name=${profile.displayName || 'A'}&background=random`}
                                    alt="Avatar"
                                    className="w-24 h-24 rounded-full object-cover border-4 border-card"
                                />
                                <Button as="label" htmlFor="avatar-upload" size="icon" variant="secondary" className="absolute bottom-0 right-0 h-8 w-8">
                                    <Icon svg={ICONS.edit} className="h-4 w-4" />
                                </Button>
                                <Input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={e => setNewAvatar(e.target.files?.[0] || null)} />
                            </div>
                            <div className="mt-12 w-full space-y-2">
                                <Input
                                    placeholder="Tu Nombre"
                                    className="text-xl font-bold text-center border-none focus-visible:ring-0"
                                    value={profile.displayName || ''}
                                    onChange={e => setProfile(p => ({ ...p, displayName: e.target.value }))}
                                />
                                <Input
                                    placeholder="Cargo (ej. Head Bartender)"
                                    className="text-center text-muted-foreground border-none focus-visible:ring-0"
                                    value={profile.jobTitle || ''}
                                    onChange={e => setProfile(p => ({ ...p, jobTitle: e.target.value }))}
                                />
                                <Textarea
                                    placeholder="Una bio corta sobre ti..."
                                    className="text-center text-sm min-h-[60px] border-none focus-visible:ring-0"
                                    value={profile.bio || ''}
                                    onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))}
                                />
                                <div className="relative">
                                    <Icon svg={ICONS.tag} className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="usuario_instagram"
                                        className="pl-8"
                                        value={profile.instagramHandle || ''}
                                        onChange={e => setProfile(p => ({ ...p, instagramHandle: e.target.value }))}
                                    />
                                </div>
                            </div>
                        </div>
                    </Card>
                    <Button onClick={handleProfileSave} disabled={loading} className="w-full">
                        {loading ? <Spinner className="mr-2" /> : <Icon svg={ICONS.check} className="mr-2 h-4 w-4" />}
                        Guardar Perfil
                    </Button>
                </div>

                {/* Right Panel */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader><CardTitle>Estadísticas y Logros</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-2 gap-4">
                            <StatCard title="Recetas en Grimorio" value={recipesCount} />
                            <StatCard title="Nivel Colegium" value={`${avgQuizScore.toFixed(0)}%`} />
                            <StatCard title="Ideas Aportadas" value={ideasCount} />
                            <StatCard title="Próximamente" value="N/A" />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default PersonalView;
