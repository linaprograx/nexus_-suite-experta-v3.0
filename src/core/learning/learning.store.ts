
import { UserIntelProfile, LearningEvent, DEFAULT_INTEL_PROFILE } from './learning.types';
import { Firestore, doc, getDoc, setDoc, updateDoc, collection, addDoc } from 'firebase/firestore';

// In-memory cache for the session
let profileCache: UserIntelProfile | null = null;

export const loadUserProfile = async (db: Firestore, userId: string): Promise<UserIntelProfile> => {
    if (profileCache && profileCache.userId === userId) return profileCache;

    const ref = doc(db, `users/${userId}/intel_profile`, 'main');
    const snap = await getDoc(ref);

    if (snap.exists()) {
        profileCache = snap.data() as UserIntelProfile;
    } else {
        // Create default
        const newProfile: UserIntelProfile = { ...DEFAULT_INTEL_PROFILE, userId };
        await setDoc(ref, newProfile);
        profileCache = newProfile;
    }
    return profileCache;
};

export const saveUserProfile = async (db: Firestore, profile: UserIntelProfile) => {
    const ref = doc(db, `users/${profile.userId}/intel_profile`, 'main');
    await setDoc(ref, profile); // Overwrite or merge
    profileCache = profile;
};

export const recordEvent = async (db: Firestore, event: LearningEvent) => {
    // Fire and forget, optimized
    try {
        await addDoc(collection(db, 'intel_events'), event);
    } catch (e) {
        console.error('Failed to log learning event', e);
    }
};
